/**
 * IP Camera Discovery Service
 * Discovers and connects to IP cameras on the local network
 * Supports common camera protocols: MJPEG, RTSP, and proprietary web interfaces
 */

const net = require('net');
const http = require('http');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class IPCameraDiscovery {
  constructor() {
    // Common camera ports to scan
    this.cameraPorts = [80, 81, 88, 443, 554, 8000, 8080, 8081, 8888, 9000];
    
    // Known camera URL patterns for different manufacturers/firmware types
    this.cameraPatterns = {
      // Hi3510/Generic Chinese cameras (like the one discovered)
      hi3510: {
        stream: '/media/?action=stream',
        snapshot: '/media/?action=snapshot',
        settings: '/setting.asp',
        liveView: '/video/livesp.asp',
        liveViewMobile: '/video/livemb.asp',
        about: '/adm/about.asp',
        testPaths: ['/media/?action=stream', '/video/livesp.asp', '/setting.asp'],
        identifyPatterns: ['IPCamera', 'hi3510', 'P2P Setting', 'liveplg.asp', 'livesp.asp']
      },
      // Foscam cameras
      foscam: {
        stream: '/videostream.cgi',
        snapshot: '/snapshot.cgi',
        settings: '/web/',
        testPaths: ['/snapshot.cgi', '/videostream.cgi'],
        identifyPatterns: ['foscam', 'IPCam']
      },
      // MJPEG-Streamer (common on Raspberry Pi)
      mjpegStreamer: {
        stream: '/?action=stream',
        snapshot: '/?action=snapshot',
        testPaths: ['/?action=stream', '/?action=snapshot'],
        identifyPatterns: ['mjpg-streamer', 'MJPG-Streamer']
      },
      // DLink cameras
      dlink: {
        stream: '/video.cgi',
        snapshot: '/image.jpg',
        testPaths: ['/video.cgi', '/image.jpg'],
        identifyPatterns: ['D-Link', 'DCS-']
      },
      // Axis cameras
      axis: {
        stream: '/axis-cgi/mjpg/video.cgi',
        snapshot: '/axis-cgi/jpg/image.cgi',
        testPaths: ['/axis-cgi/jpg/image.cgi'],
        identifyPatterns: ['AXIS', 'axis-cgi']
      },
      // Generic RTSP cameras
      rtsp: {
        stream: 'rtsp://{ip}:{port}/stream1',
        altStreams: [
          'rtsp://{ip}:{port}/live/ch00_0',
          'rtsp://{ip}:{port}/h264',
          'rtsp://{ip}:{port}/mpeg4',
          'rtsp://{ip}:{port}/'
        ],
        testPaths: [],
        identifyPatterns: []
      },
      // Hikvision cameras
      hikvision: {
        stream: '/Streaming/Channels/101',
        snapshot: '/ISAPI/Streaming/channels/101/picture',
        testPaths: ['/doc/page/login.asp', '/ISAPI/'],
        identifyPatterns: ['hikvision', 'HIKVISION', 'DNVRS-Webs']
      },
      // Dahua cameras
      dahua: {
        stream: '/cam/realmonitor?channel=1&subtype=0',
        snapshot: '/cgi-bin/snapshot.cgi',
        testPaths: ['/cgi-bin/snapshot.cgi'],
        identifyPatterns: ['dahua', 'Dahua', 'DH-']
      },
      // Amcrest cameras
      amcrest: {
        stream: '/cam/realmonitor?channel=1&subtype=0',
        snapshot: '/cgi-bin/snapshot.cgi',
        testPaths: ['/cgi-bin/snapshot.cgi'],
        identifyPatterns: ['amcrest', 'Amcrest']
      },
      // TP-Link Tapo cameras
      tapo: {
        stream: 'rtsp://{ip}:{port}/stream1',
        testPaths: [],
        identifyPatterns: ['Tapo', 'TP-Link']
      },
      // Generic ONVIF cameras
      onvif: {
        stream: '/onvif/device_service',
        testPaths: ['/onvif/device_service'],
        identifyPatterns: ['onvif', 'ONVIF']
      }
    };

    // MAC address prefixes for camera manufacturers
    this.cameraMacPrefixes = {
      '00:62:6e': 'Amcrest',
      '90:02:a9': 'Hikvision',
      'c0:56:e3': 'Hikvision',
      '44:19:b6': 'Hikvision',
      '54:c4:15': 'Hikvision',
      'a4:14:37': 'Dahua',
      'e0:50:8b': 'Dahua',
      '3c:ef:8c': 'Dahua',
      '00:12:17': 'Axis',
      'ac:cc:8e': 'Axis',
      '00:40:8c': 'Axis',
      '00:0e:8f': 'Foscam',
      '00:62:78': 'Foscam',
      'c4:d6:55': 'D-Link',
      '1c:7e:e5': 'D-Link',
      'e4:6f:13': 'TP-Link',
      '50:c7:bf': 'TP-Link',
    };
  }

  /**
   * Check if a port is open on a given IP
   */
  async checkPort(ip, port, timeout = 1000) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timer = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, timeout);

      socket.on('connect', () => {
        clearTimeout(timer);
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        clearTimeout(timer);
        resolve(false);
      });

      socket.connect(port, ip);
    });
  }

  /**
   * Try to fetch a URL and check response
   */
  async probeUrl(url, auth = null, timeout = 3000) {
    return new Promise((resolve) => {
      try {
        const urlObj = new URL(url);
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || 80,
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          timeout: timeout,
          headers: {},
          // Allow malformed HTTP responses from cheap IP cameras
          insecureHTTPParser: true
        };

        if (auth) {
          const credentials = Buffer.from(`${auth.username}:${auth.password || ''}`).toString('base64');
          options.headers['Authorization'] = `Basic ${credentials}`;
        }

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk.toString().substring(0, 5000));
          res.on('end', () => {
            resolve({
              success: res.statusCode >= 200 && res.statusCode < 400,
              statusCode: res.statusCode,
              contentType: res.headers['content-type'] || '',
              data: data,
              headers: res.headers
            });
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ success: false, error: 'timeout' });
        });

        req.on('error', (err) => {
          resolve({ success: false, error: err.message });
        });

        req.end();
      } catch (err) {
        resolve({ success: false, error: err.message });
      }
    });
  }

  /**
   * Identify camera type based on response content
   */
  identifyCameraType(responseData, headers = {}) {
    const content = responseData.toLowerCase();
    const contentType = (headers['content-type'] || '').toLowerCase();

    for (const [type, pattern] of Object.entries(this.cameraPatterns)) {
      if (pattern.identifyPatterns) {
        for (const identifier of pattern.identifyPatterns) {
          if (content.includes(identifier.toLowerCase())) {
            return type;
          }
        }
      }
    }

    // Check content type for streams
    if (contentType.includes('multipart/x-mixed-replace') || 
        contentType.includes('image/jpeg') ||
        contentType.includes('video/')) {
      return 'mjpeg-generic';
    }

    return 'unknown';
  }

  /**
   * Probe a single IP for camera capabilities
   */
  async probeCamera(ip, port = 80, auth = { username: 'admin', password: '' }) {
    const baseUrl = `http://${ip}:${port}`;
    const result = {
      ip,
      port,
      isCamera: false,
      cameraType: 'unknown',
      manufacturer: 'Unknown',
      capabilities: {
        mjpegStream: null,
        snapshot: null,
        settings: null,
        liveView: null,
        rtsp: null,
        ptz: false,
        audio: false,
        twoWayAudio: false
      },
      requiresAuth: false,
      authWorking: false,
      firmwareInfo: null,
      uid: null
    };

    // First, check if port is open
    const portOpen = await this.checkPort(ip, port, 2000);
    if (!portOpen) {
      return result;
    }

    // Try root path first
    const rootProbe = await this.probeUrl(baseUrl + '/', auth);
    
    if (rootProbe.statusCode === 401) {
      result.requiresAuth = true;
      // Try with auth
      const authProbe = await this.probeUrl(baseUrl + '/', auth);
      if (authProbe.success) {
        result.authWorking = true;
      }
    }

    // Probe Hi3510-style cameras (like the discovered one)
    const hi3510Paths = [
      { path: '/media/?action=stream', type: 'mjpegStream' },
      { path: '/media/?action=snapshot', type: 'snapshot' },
      { path: '/video/livesp.asp', type: 'liveView' },
      { path: '/video/livemb.asp', type: 'liveViewMobile' },
      { path: '/setting.asp', type: 'settings' },
      { path: '/adm/about.asp', type: 'about' }
    ];

    for (const probe of hi3510Paths) {
      const response = await this.probeUrl(baseUrl + probe.path, auth);
      
      // Consider 401 as "exists but needs auth" - still a camera
      const pathExists = response.success || response.statusCode === 401;
      
      if (pathExists) {
        result.isCamera = true;
        
        if (probe.type === 'mjpegStream') {
          result.capabilities.mjpegStream = baseUrl + probe.path;
          result.cameraType = 'hi3510';
          if (response.statusCode === 401) {
            result.requiresAuth = true;
          }
        } else if (probe.type === 'snapshot') {
          result.capabilities.snapshot = baseUrl + probe.path;
        } else if (probe.type === 'liveView' || probe.type === 'liveViewMobile') {
          result.capabilities.liveView = baseUrl + probe.path;
        } else if (probe.type === 'settings') {
          result.capabilities.settings = baseUrl + probe.path;
        } else if (probe.type === 'about') {
          // Parse firmware info from about page
          const uidMatch = response.data.match(/p2p_uid='([^']+)'/);
          if (uidMatch) {
            result.uid = uidMatch[1];
          }
          const fwMatch = response.data.match(/Firmware[^:]*:\s*([^\n<]+)/i);
          if (fwMatch) {
            result.firmwareInfo = fwMatch[1].trim();
          }
        }

        // Check for camera identification
        const cameraType = this.identifyCameraType(response.data, response.headers);
        if (cameraType !== 'unknown') {
          result.cameraType = cameraType;
        }
      }
    }

    // If not Hi3510, try other patterns
    if (!result.isCamera) {
      for (const [type, pattern] of Object.entries(this.cameraPatterns)) {
        if (type === 'hi3510' || type === 'rtsp') continue;
        
        for (const testPath of pattern.testPaths || []) {
          const response = await this.probeUrl(baseUrl + testPath, auth);
          if (response.success) {
            result.isCamera = true;
            result.cameraType = type;
            
            if (pattern.stream) {
              result.capabilities.mjpegStream = baseUrl + pattern.stream;
            }
            if (pattern.snapshot) {
              result.capabilities.snapshot = baseUrl + pattern.snapshot;
            }
            if (pattern.settings) {
              result.capabilities.settings = baseUrl + pattern.settings;
            }
            break;
          }
        }
        if (result.isCamera) break;
      }
    }

    // Check for RTSP on port 554
    if (await this.checkPort(ip, 554, 2000)) {
      result.capabilities.rtsp = `rtsp://${auth.username}:${auth.password}@${ip}:554/stream1`;
    }

    return result;
  }

  /**
   * Scan network for IP cameras
   */
  async scanForCameras(baseIP, startRange = 1, endRange = 255, auth = { username: 'admin', password: '' }, onProgress = null) {
    const cameras = [];
    const ipParts = baseIP.split('.');
    const basePrefix = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;

    console.log(`🎥 Scanning for IP cameras: ${basePrefix}.${startRange} - ${basePrefix}.${endRange}`);

    // Scan in larger batches for speed
    const batchSize = 20;
    for (let i = startRange; i <= endRange; i += batchSize) {
      const batch = [];
      const end = Math.min(i + batchSize - 1, endRange);

      for (let j = i; j <= end; j++) {
        const ip = `${basePrefix}.${j}`;
        // Quick port check first, then probe if open
        batch.push(
          (async () => {
            // Check most common camera ports quickly
            const portsToCheck = [80, 81, 8080];
            for (const port of portsToCheck) {
              const portOpen = await this.checkPort(ip, port, 500);
              if (portOpen) {
                const result = await this.probeCamera(ip, port, auth);
                if (result.isCamera) {
                  return result;
                }
              }
            }
            return null;
          })()
        );
      }

      const batchResults = await Promise.all(batch);
      const foundCameras = batchResults.filter(r => r !== null);
      cameras.push(...foundCameras);

      if (onProgress) {
        const progress = Math.round(((end - startRange + 1) / (endRange - startRange + 1)) * 100);
        onProgress(progress, cameras.length);
      }

      console.log(`🎥 Scanned ${end}/${endRange} - Found ${cameras.length} cameras`);

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return cameras;
  }

  /**
   * Get camera manufacturer from MAC address
   */
  getManufacturerFromMac(mac) {
    if (!mac) return 'Unknown';
    const prefix = mac.substring(0, 8).toLowerCase();
    return this.cameraMacPrefixes[prefix] || 'Unknown';
  }

  /**
   * Test camera connectivity
   */
  async testCamera(camera) {
    const results = {
      streamWorking: false,
      snapshotWorking: false,
      settingsAccessible: false,
      authRequired: false,
      latency: null
    };

    const auth = { username: camera.username || 'admin', password: camera.password || '' };
    const startTime = Date.now();

    if (camera.capabilities?.mjpegStream) {
      const response = await this.probeUrl(camera.capabilities.mjpegStream, auth);
      results.streamWorking = response.success;
      results.latency = Date.now() - startTime;
    }

    if (camera.capabilities?.snapshot) {
      const response = await this.probeUrl(camera.capabilities.snapshot, auth);
      results.snapshotWorking = response.success;
    }

    if (camera.capabilities?.settings) {
      const response = await this.probeUrl(camera.capabilities.settings, auth);
      results.settingsAccessible = response.success;
      if (response.statusCode === 401) {
        results.authRequired = true;
      }
    }

    return results;
  }
}

module.exports = IPCameraDiscovery;
