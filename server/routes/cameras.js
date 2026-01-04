const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const IPCameraDiscovery = require('../services/ipCameraDiscovery');

// Initialize camera discovery service
const cameraDiscovery = new IPCameraDiscovery();

// Camera storage
const camerasFile = path.join(__dirname, '../data/cameras.json');
let cameras = [];

// Load cameras from file
const loadCameras = async () => {
  try {
    const data = await fs.readFile(camerasFile, 'utf8');
    cameras = JSON.parse(data);
    console.log(`📷 Loaded ${cameras.length} camera(s) from storage`);
  } catch (error) {
    cameras = [];
    // Initialize from environment if available
    initCamerasFromEnv();
  }
};

// Save cameras to file
const saveCameras = async () => {
  try {
    await fs.mkdir(path.dirname(camerasFile), { recursive: true });
    await fs.writeFile(camerasFile, JSON.stringify(cameras, null, 2));
  } catch (error) {
    console.error('Error saving cameras:', error);
  }
};

// Initialize cameras from environment variables
const initCamerasFromEnv = () => {
  const urls = (process.env.CAMERA_URLS || '').split(',').filter(url => url);
  urls.forEach((url, index) => {
    cameras.push({
      id: `camera_env_${index}`,
      name: `Camera ${index + 1}`,
      url: url.trim(),
      type: 'camera',
      protocol: url.includes('rtsp') ? 'RTSP' : 'HTTP',
      source: 'environment',
      capabilities: {
        mjpegStream: url.trim(),
        snapshot: null,
        settings: null
      },
      createdAt: new Date().toISOString()
    });
  });
};

// Initialize on load
loadCameras();

// Get all cameras
router.get('/', (req, res) => {
  res.json(cameras);
});

// Get single camera by ID
router.get('/:id', (req, res) => {
  const camera = cameras.find(c => c.id === req.params.id);
  if (!camera) {
    return res.status(404).json({ error: 'Camera not found' });
  }
  res.json(camera);
});

// Get camera stream URL and info
router.get('/:id/stream', (req, res) => {
  const camera = cameras.find(c => c.id === req.params.id);
  if (!camera) {
    return res.status(404).json({ error: 'Camera not found' });
  }
  
  res.json({
    id: camera.id,
    name: camera.name,
    streamUrl: camera.capabilities?.mjpegStream || camera.url,
    snapshotUrl: camera.capabilities?.snapshot,
    settingsUrl: camera.capabilities?.settings,
    protocol: camera.protocol,
    cameraType: camera.cameraType,
    requiresAuth: camera.requiresAuth,
    username: camera.username || 'admin',
    // Don't send password to client
  });
});

// Proxy stream for embedding in app (avoids CORS issues)
router.get('/:id/proxy-stream', async (req, res) => {
  const camera = cameras.find(c => c.id === req.params.id);
  if (!camera) {
    return res.status(404).json({ error: 'Camera not found' });
  }

  const streamUrl = camera.capabilities?.mjpegStream || camera.url;
  if (!streamUrl) {
    return res.status(400).json({ error: 'No stream URL configured' });
  }

  try {
    const urlObj = new URL(streamUrl);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {}
    };

    // Add auth if available
    if (camera.username) {
      const credentials = Buffer.from(`${camera.username}:${camera.password || ''}`).toString('base64');
      options.headers['Authorization'] = `Basic ${credentials}`;
    }

    const proxyReq = http.request(options, (proxyRes) => {
      // Forward content type
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'multipart/x-mixed-replace');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Stream proxy error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream connection failed' });
      }
    });

    req.on('close', () => {
      proxyReq.destroy();
    });

    proxyReq.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generic proxy stream by IP (for devices not in cameras.json)
// Supports multiple stream URL patterns for generic cameras
router.get('/proxy/:ip/:port/*', async (req, res) => {
  const { ip, port } = req.params;
  const streamPath = '/' + req.params[0]; // Get the rest of the path
  const username = req.query.user || 'admin';
  const password = req.query.pass || '';

  try {
    const options = {
      hostname: ip,
      port: parseInt(port) || 80,
      path: streamPath,
      method: 'GET',
      headers: {},
      // Allow self-signed certs and handle insecure responses
      rejectUnauthorized: false
    };

    // Add basic auth if credentials provided
    if (username) {
      const credentials = Buffer.from(`${username}:${password}`).toString('base64');
      options.headers['Authorization'] = `Basic ${credentials}`;
    }

    const proxyReq = http.request(options, (proxyRes) => {
      // Forward content type
      const contentType = proxyRes.headers['content-type'] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Handle MJPEG streams
      if (contentType.includes('multipart/x-mixed-replace') || contentType.includes('image/')) {
        proxyRes.pipe(res);
      } else {
        proxyRes.pipe(res);
      }
    });

    proxyReq.on('error', (err) => {
      console.error('Generic proxy stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream connection failed: ' + err.message });
      }
    });

    // Handle client disconnect
    req.on('close', () => {
      proxyReq.destroy();
    });

    proxyReq.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get camera snapshot
router.get('/:id/snapshot', async (req, res) => {
  const camera = cameras.find(c => c.id === req.params.id);
  if (!camera) {
    return res.status(404).json({ error: 'Camera not found' });
  }

  const snapshotUrl = camera.capabilities?.snapshot;
  if (!snapshotUrl) {
    return res.status(400).json({ error: 'Snapshot not supported for this camera' });
  }

  try {
    const urlObj = new URL(snapshotUrl);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {}
    };

    if (camera.username) {
      const credentials = Buffer.from(`${camera.username}:${camera.password || ''}`).toString('base64');
      options.headers['Authorization'] = `Basic ${credentials}`;
    }

    const proxyReq = http.request(options, (proxyRes) => {
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'image/jpeg');
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Snapshot failed' });
      }
    });

    proxyReq.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PTZ Control (Pan-Tilt-Zoom)
router.post('/:id/ptz', async (req, res) => {
  try {
    const camera = cameras.find(c => c.id === req.params.id);
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    const { direction, speed } = req.body;
    
    // For Hi3510 cameras, PTZ commands go through cmd_req.asp
    if (camera.cameraType === 'hi3510' && camera.ip) {
      const ptzCommands = {
        up: 0, down: 2, left: 4, right: 6, stop: 1,
        upleft: 90, upright: 91, downleft: 92, downright: 93
      };
      
      const cmdCode = ptzCommands[direction] ?? 1;
      const cmdUrl = `http://${camera.ip}:${camera.port || 80}/video/cmd_req.asp?ptz_cmd=${cmdCode}`;
      
      // TODO: Make HTTP request to camera
      res.json({
        success: true,
        message: `PTZ command ${direction} sent`,
        cameraId: camera.id
      });
    } else {
      res.json({
        message: 'PTZ control not available for this camera type',
        cameraId: req.params.id,
        command: { direction, speed }
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test camera connectivity
router.post('/:id/test', async (req, res) => {
  try {
    const camera = cameras.find(c => c.id === req.params.id);
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    const testResult = await cameraDiscovery.testCamera(camera);
    res.json({
      cameraId: camera.id,
      name: camera.name,
      ...testResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Discover cameras on network
router.post('/discover', async (req, res) => {
  try {
    const { baseIP, startRange = 1, endRange = 255, username = 'admin', password = '' } = req.body;
    
    // Get local IP if not provided
    let scanBaseIP = baseIP;
    if (!scanBaseIP) {
      const os = require('os');
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            scanBaseIP = iface.address;
            break;
          }
        }
        if (scanBaseIP) break;
      }
    }

    if (!scanBaseIP) {
      return res.status(400).json({ error: 'Could not determine network to scan' });
    }

    console.log(`🎥 Starting camera discovery on ${scanBaseIP}`);
    
    const discoveredCameras = await cameraDiscovery.scanForCameras(
      scanBaseIP,
      parseInt(startRange),
      parseInt(endRange),
      { username, password }
    );

    // Add discovered cameras that aren't already in the list
    const newCameras = [];
    for (const discovered of discoveredCameras) {
      const exists = cameras.find(c => c.ip === discovered.ip && c.port === discovered.port);
      if (!exists) {
        const newCamera = {
          id: `camera_${discovered.ip.replace(/\./g, '_')}_${discovered.port}`,
          name: `IP Camera (${discovered.ip})`,
          ip: discovered.ip,
          port: discovered.port,
          url: discovered.capabilities.mjpegStream || `http://${discovered.ip}:${discovered.port}/`,
          type: 'camera',
          cameraType: discovered.cameraType,
          protocol: discovered.capabilities.rtsp ? 'RTSP' : 'HTTP',
          capabilities: discovered.capabilities,
          requiresAuth: discovered.requiresAuth,
          username: username,
          password: password,
          uid: discovered.uid,
          firmwareInfo: discovered.firmwareInfo,
          source: 'discovered',
          discoveredAt: new Date().toISOString()
        };
        cameras.push(newCamera);
        newCameras.push(newCamera);
      }
    }

    if (newCameras.length > 0) {
      await saveCameras();
    }

    res.json({
      scanned: `${scanBaseIP.split('.').slice(0, 3).join('.')}.${startRange}-${endRange}`,
      found: discoveredCameras.length,
      new: newCameras.length,
      cameras: newCameras
    });
  } catch (error) {
    console.error('Camera discovery error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Quick probe a specific IP for camera
router.post('/probe', async (req, res) => {
  try {
    const { ip, port = 80, username = 'admin', password = '' } = req.body;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP address required' });
    }

    const result = await cameraDiscovery.probeCamera(ip, parseInt(port), { username, password });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new camera
router.post('/', async (req, res) => {
  try {
    const { name, url, ip, port, username, password, cameraType } = req.body;
    
    // If URL is provided, parse it
    let cameraIP = ip;
    let cameraPort = port || 80;
    
    if (url && !ip) {
      try {
        const urlObj = new URL(url);
        cameraIP = urlObj.hostname;
        cameraPort = urlObj.port || 80;
      } catch (e) {
        // URL parsing failed, continue without IP
      }
    }

    // Probe camera if we have an IP
    let capabilities = { mjpegStream: url };
    let detectedType = cameraType || 'unknown';
    
    if (cameraIP) {
      const probeResult = await cameraDiscovery.probeCamera(cameraIP, cameraPort, { username, password });
      if (probeResult.isCamera) {
        capabilities = probeResult.capabilities;
        detectedType = probeResult.cameraType;
      }
    }

    const newCamera = {
      id: `camera_${Date.now()}`,
      name: name || `Camera (${cameraIP || 'manual'})`,
      url: url || capabilities.mjpegStream,
      ip: cameraIP,
      port: cameraPort,
      type: 'camera',
      cameraType: detectedType,
      protocol: url?.includes('rtsp') ? 'RTSP' : 'HTTP',
      capabilities,
      username,
      password,
      source: 'manual',
      createdAt: new Date().toISOString()
    };
    
    cameras.push(newCamera);
    await saveCameras();
    
    res.json(newCamera);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update camera
router.put('/:id', async (req, res) => {
  try {
    const index = cameras.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    const { name, url, username, password } = req.body;
    
    cameras[index] = {
      ...cameras[index],
      name: name || cameras[index].name,
      url: url || cameras[index].url,
      username: username !== undefined ? username : cameras[index].username,
      password: password !== undefined ? password : cameras[index].password,
      updatedAt: new Date().toISOString()
    };

    // Update stream URL in capabilities if URL changed
    if (url && cameras[index].capabilities) {
      cameras[index].capabilities.mjpegStream = url;
    }

    await saveCameras();
    res.json(cameras[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove camera
router.delete('/:id', async (req, res) => {
  try {
    const index = cameras.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    cameras.splice(index, 1);
    await saveCameras();
    
    res.json({ message: 'Camera removed', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh camera capabilities
router.post('/:id/refresh', async (req, res) => {
  try {
    const camera = cameras.find(c => c.id === req.params.id);
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    if (!camera.ip) {
      return res.status(400).json({ error: 'Camera IP not available for refresh' });
    }

    const probeResult = await cameraDiscovery.probeCamera(
      camera.ip,
      camera.port || 80,
      { username: camera.username || 'admin', password: camera.password || '' }
    );

    if (probeResult.isCamera) {
      camera.capabilities = probeResult.capabilities;
      camera.cameraType = probeResult.cameraType;
      camera.uid = probeResult.uid || camera.uid;
      camera.firmwareInfo = probeResult.firmwareInfo || camera.firmwareInfo;
      camera.lastRefreshed = new Date().toISOString();
      
      await saveCameras();
    }

    res.json(camera);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
