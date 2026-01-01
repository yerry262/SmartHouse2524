const SSDP = require('node-ssdp').Client;
const Bonjour = require('bonjour-service').Bonjour;
const fs = require('fs').promises;
const path = require('path');
const NetworkScanner = require('./networkScanner');

// Gracefully load optional packages
let HueDiscovery = null;
let TplinkClient = null;
let Wemo = null;

try {
  const hue = require('node-hue-api');
  HueDiscovery = hue.discovery;
  console.log('✓ Philips Hue discovery available');
} catch (error) {
  console.log('⚠️ Philips Hue discovery not available (npm install node-hue-api)');
}

try {
  Wemo = require('wemo-client');
  console.log('✓ WeMo discovery available');
} catch (error) {
  console.log('⚠️ WeMo discovery not available (npm install wemo-client)');
}

try {
  const tplink = require('tplink-smarthome-api');
  TplinkClient = tplink.Client;
  console.log('✓ TP-Link discovery available');
} catch (error) {
  console.log('⚠️ TP-Link discovery not available (npm install tplink-smarthome-api)');
}

class DeviceDiscovery {
  constructor() {
    this.devices = [];
    this.devicesFile = path.join(__dirname, '../data/devices.json');
    this.networkScanner = new NetworkScanner();
    this.bonjour = new Bonjour();
    this.loadDevices();
  }

  async loadDevices() {
    try {
      const data = await fs.readFile(this.devicesFile, 'utf8');
      this.devices = JSON.parse(data);
    } catch (error) {
      this.devices = [];
    }
  }

  async saveDevices() {
    try {
      await fs.mkdir(path.dirname(this.devicesFile), { recursive: true });
      await fs.writeFile(this.devicesFile, JSON.stringify(this.devices, null, 2));
    } catch (error) {
      console.error('Error saving devices:', error);
    }
  }

  async discoverDevices() {
    console.log('Starting device discovery...');
    const startTime = Date.now();
    const discovered = [];
    const discoveryPromises = [];

    // 1. Discover Philips Hue bridges (Parallel)
    if (HueDiscovery) {
      discoveryPromises.push((async () => {
        try {
          let hueResults = [];
          try {
            hueResults = await HueDiscovery.nupnpSearch();
          } catch (err) {
            if (err.message && err.message.includes('429')) {
              console.log('Hue N-UPnP rate limited (429), falling back to local UPnP search...');
            } else {
              console.warn('Hue N-UPnP search failed:', err.message);
            }
            
            if (HueDiscovery.upnpSearch) {
              try {
                hueResults = await HueDiscovery.upnpSearch(5000);
              } catch (localErr) {
                console.warn('Hue local UPnP search failed:', localErr.message);
              }
            }
          }

          hueResults.forEach(bridge => {
            const mac = bridge.id ? bridge.id.match(/.{1,2}/g).join(':') : null;
            discovered.push({
              id: this.generateId(mac || bridge.ipaddress),
              type: 'hue-bridge',
              name: bridge.name || 'Philips Hue Bridge',
              ipAddress: bridge.ipaddress,
              ip: bridge.ipaddress,
              mac: mac,
              modelId: bridge.model?.modelid,
              manufacturer: 'Philips',
              lastSeen: new Date()
            });
          });
          if (hueResults.length > 0) {
            console.log(`Discovered ${hueResults.length} Hue bridge(s)`);
          }
        } catch (error) {
          console.error('Error discovering Hue bridges:', error.message);
        }
      })());
    }

    // 2. Discover TP-Link devices (Parallel)
    if (TplinkClient) {
      discoveryPromises.push((async () => {
        try {
          const tplinkClient = new TplinkClient();
          const tplinkDevices = [];
          
          tplinkClient.startDiscovery({ discoveryTimeout: 5000 });
          
          tplinkClient.on('device-new', (device) => {
            tplinkDevices.push({
              id: this.generateId(device.mac || device.host),
              type: device.deviceType === 'bulb' ? 'tplink-bulb' : 'tplink-plug',
              name: device.alias,
              ipAddress: device.host,
              ip: device.host,
              mac: device.mac,
              model: device.model,
              manufacturer: 'TP-Link',
              deviceId: device.deviceId,
              lastSeen: new Date()
            });
          });

          await new Promise(resolve => setTimeout(resolve, 6000));
          tplinkClient.stopDiscovery();
          
          discovered.push(...tplinkDevices);
          console.log(`Discovered ${tplinkDevices.length} TP-Link device(s)`);
        } catch (error) {
          console.error('Error discovering TP-Link devices:', error);
        }
      })());
    }

    // 3. Discover WeMo devices (Parallel)
    if (Wemo) {
      discoveryPromises.push((async () => {
        try {
          const wemo = new Wemo();
          const wemoDevices = [];
          
          wemo.discover((err, deviceInfo) => {
            if (!err && deviceInfo) {
              wemoDevices.push({
                id: this.generateId(deviceInfo.macAddress || deviceInfo.host),
                type: 'wemo-plug',
                name: deviceInfo.friendlyName,
                ipAddress: deviceInfo.host,
                ip: deviceInfo.host,
                mac: deviceInfo.macAddress,
                model: deviceInfo.modelName,
                manufacturer: 'Belkin',
                serialNumber: deviceInfo.serialNumber,
                lastSeen: new Date()
              });
            }
          });

          await new Promise(resolve => setTimeout(resolve, 5000));
          
          discovered.push(...wemoDevices);
          console.log(`Discovered ${wemoDevices.length} WeMo device(s)`);
        } catch (error) {
          console.error('Error discovering WeMo devices:', error);
        }
      })());
    }

    // 4. SSDP & mDNS Discovery (Parallel)
    discoveryPromises.push(new Promise((resolve) => {
      const ssdpClient = new SSDP();
      const ssdpDiscovered = [];
      
      const timeout = setTimeout(() => {
        ssdpClient.stop();
        discovered.push(...ssdpDiscovered);
        resolve();
      }, parseInt(process.env.DISCOVERY_TIMEOUT) || 10000);

      ssdpClient.on('response', (headers, statusCode, rinfo) => {
        const device = {
          id: this.generateId(rinfo.address),
          type: this.detectDeviceType(headers),
          name: headers.SERVER || headers.USN || 'Unknown Device',
          ip: rinfo.address,
          port: rinfo.port,
          status: 'online',
          lastSeen: new Date().toISOString(),
          metadata: headers
        };
        
        // Avoid duplicates within SSDP results
        if (!ssdpDiscovered.some(d => d.ip === device.ip)) {
            ssdpDiscovered.push(device);
            global.broadcast({ type: 'device_discovered', device });
        }
      });

      // Discover mDNS/Bonjour devices (HTTP services)
      const browser = this.bonjour.find({ type: 'http' });
      
      browser.on('up', (service) => {
        const device = {
          id: this.generateId(service.host || service.addresses[0]),
          type: this.detectDeviceTypeFromService(service),
          name: service.name,
          ip: service.addresses[0],
          port: service.port,
          status: 'online',
          lastSeen: new Date().toISOString(),
          metadata: service
        };
        
        if (!ssdpDiscovered.some(d => d.ip === device.ip)) {
            ssdpDiscovered.push(device);
            global.broadcast({ type: 'device_discovered', device });
        }
      });

      // Discover Apple TV and AirPlay devices
      const airplayBrowser = this.bonjour.find({ type: 'airplay' });
      
      airplayBrowser.on('up', (service) => {
        // Try to extract a meaningful name from service
        let deviceName = service.name || 'Apple TV';
        
        // If service has a host, extract hostname without domain
        if (service.host) {
          const hostname = service.host.replace('.local', '').replace('.lan', '');
          // Use hostname if it looks more descriptive than the service name
          if (hostname && hostname.length > 0 && !hostname.match(/^[0-9a-f-]+$/i)) {
            deviceName = hostname;
          }
        }
        
        // If service.txt has a model or friendly name, use it
        if (service.txt && typeof service.txt === 'object') {
          if (service.txt.model) deviceName = service.txt.model;
          if (service.txt.deviceid) deviceName = service.txt.deviceid;
        }
        
        const device = {
          id: this.generateId(service.host || service.addresses[0]),
          type: 'appletv',
          name: deviceName,
          hostname: service.host,
          ip: service.addresses[0],
          port: service.port,
          status: 'online',
          lastSeen: new Date().toISOString(),
          metadata: service
        };
        
        if (!ssdpDiscovered.some(d => d.ip === device.ip)) {
            ssdpDiscovered.push(device);
            global.broadcast({ type: 'device_discovered', device });
        }
      });

      ssdpClient.search('ssdp:all');
    }));

    // Wait for all discovery methods to complete
    await Promise.all(discoveryPromises);

    this.mergeDevices(discovered);
    console.log(`Discovery completed in ${(Date.now() - startTime) / 1000}s. Total devices found: ${discovered.length}`);
    return discovered;
  }

  detectDeviceType(headers) {
    const server = (headers.SERVER || '').toLowerCase();
    const usn = (headers.USN || '').toLowerCase();
    
    if (server.includes('sonos') || usn.includes('sonos')) return 'sonos';
    if (server.includes('samsung') || usn.includes('samsung')) return 'samsung-tv';
    if (server.includes('camera') || usn.includes('camera')) return 'camera';
    if (server.includes('ring')) return 'ring';
    
    return 'unknown';
  }

  detectDeviceTypeFromService(service) {
    const name = (service.name || '').toLowerCase();
    const type = (service.type || '').toLowerCase();
    
    if (name.includes('sonos') || type.includes('sonos')) return 'sonos';
    if (name.includes('apple tv') || type.includes('airplay')) return 'appletv';
    if (name.includes('eero')) return 'eero';
    if (name.includes('ring')) return 'ring';
    if (name.includes('epson') || name.includes('printer') || type.includes('printer') || type.includes('ipp')) return 'printer';
    
    return 'unknown';
  }

  generateId(identifier) {
    // If identifier looks like a MAC address, use it directly (sanitized)
    if (identifier && (identifier.includes(':') || identifier.includes('-')) && identifier.length >= 12) {
      return identifier.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
    }
    // Fallback to base64 of IP/Host for legacy or non-MAC devices
    return Buffer.from(identifier).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  }

  mergeDevices(newDevices) {
    newDevices.forEach(newDevice => {
      let existingIndex = -1;

      // 1. Try to find by MAC address (if new device has one)
      if (newDevice.mac) {
        const normalizedMac = newDevice.mac.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
        existingIndex = this.devices.findIndex(d => 
          d.mac && d.mac.replace(/[^a-fA-F0-9]/g, '').toLowerCase() === normalizedMac
        );
      }

      // 2. If not found by MAC, try to find by IP address
      if (existingIndex === -1 && newDevice.ip) {
        existingIndex = this.devices.findIndex(d => d.ip === newDevice.ip);
      }

      if (existingIndex >= 0) {
        const existingDevice = this.devices[existingIndex];
        
        // If we matched by IP but the new device has a MAC, we should update the ID to be MAC-based
        // and ensure the MAC is stored.
        if (newDevice.mac && !existingDevice.mac) {
           // We are upgrading this device to have a MAC
           // The ID will change if we regenerate it from MAC, but we should probably keep the ID consistent 
           // if we want to avoid frontend issues, OR switch to MAC-based ID as requested.
           // User asked: "The unique ID in the dataframe stored should be the mac address."
           // So we will update the ID.
           existingDevice.id = this.generateId(newDevice.mac);
           existingDevice.mac = newDevice.mac;
        }

        // Merge data
        // We want to keep existing metadata if new data is sparse
        // But overwrite status and timestamps
        
        const mergedDevice = {
          ...existingDevice,
          ...newDevice,
          // Preserve firstSeen
          firstSeen: existingDevice.firstSeen || new Date().toISOString(),
          // Update lastSeen
          lastSeen: new Date().toISOString(),
          // Merge metadata
          metadata: {
            ...existingDevice.metadata,
            ...newDevice.metadata
          }
        };

        // If new device has specific model/manufacturer, use it. 
        // If new device is generic (from scan) and existing was specific (from discovery), keep specific.
        if (existingDevice.manufacturer && (!newDevice.manufacturer || newDevice.manufacturer === 'Unknown')) {
          mergedDevice.manufacturer = existingDevice.manufacturer;
        }
        if (existingDevice.model && (!newDevice.model || newDevice.model === 'Unknown')) {
          mergedDevice.model = existingDevice.model;
        }
        if (existingDevice.type && existingDevice.type !== 'unknown' && newDevice.type === 'unknown') {
          mergedDevice.type = existingDevice.type;
        }
        
        // Use name from metadata if available (e.g. from mDNS) to avoid overwriting with generic scan name
        if (mergedDevice.metadata && mergedDevice.metadata.name) {
          mergedDevice.name = mergedDevice.metadata.name;
        }

        // Ensure status is updated based on the new scan
        mergedDevice.status = newDevice.status || 'online';

        this.devices[existingIndex] = mergedDevice;

      } else {
        // Add new device
        // Ensure ID is generated from MAC if available, else IP
        const id = this.generateId(newDevice.mac || newDevice.ip);
        
        const deviceToAdd = {
          ...newDevice,
          id: id,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          status: newDevice.status || 'online'
        };

        // Use name from metadata if available
        if (deviceToAdd.metadata && deviceToAdd.metadata.name) {
          deviceToAdd.name = deviceToAdd.metadata.name;
        }

        this.devices.push(deviceToAdd);
      }
    });
    
    this.saveDevices();
  }

  async getAllDevices() {
    return this.devices;
  }

  async getDeviceById(id) {
    return this.devices.find(d => d.id === id);
  }

  async removeDevice(id) {
    this.devices = this.devices.filter(d => d.id !== id);
    await this.saveDevices();
  }

  async clearAllDevices() {
    this.devices = [];
    await this.saveDevices();
  }

  async searchDevices(query) {
    const lowerQuery = query.toLowerCase();
    return this.devices.filter(device => 
      device.name.toLowerCase().includes(lowerQuery) ||
      device.type.toLowerCase().includes(lowerQuery) ||
      device.ip.includes(lowerQuery)
    );
  }

  // Subnet scanning with port detection
  async scanSubnet(subnet = '192.168.4', startIP = 1, endIP = 255) {
    const onProgress = (progress, foundCount) => {
      global.broadcast({
        type: 'scan_progress',
        progress,
        foundCount
      });
    };

    const results = await this.networkScanner.scanSubnet(
      `${subnet}.1`,
      startIP,
      endIP,
      onProgress
    );

    // Process all scan results to update status
    const processedDevices = results.map(result => {
      // If alive, create full device object
      if (result.alive) {
        return {
          id: this.generateId(result.mac || result.ip),
          name: this.networkScanner.generateDeviceName(result.deviceType, result.ip, result.hostname),
          type: result.deviceType,
          ip: result.ip,
          hostname: result.hostname,
          mac: result.mac,
          vendor: result.vendor,
          status: 'online',
          lastSeen: new Date().toISOString(),
          openPorts: result.openPorts,
          confidence: result.confidence,
          metadata: {
            scanMethod: 'subnet_scan',
            openPorts: result.openPorts,
            hostname: result.hostname,
            mac: result.mac,
            vendor: result.vendor
          }
        };
      } else {
        // If not alive, we still want to report it so mergeDevices can mark it offline
        // But we only care if we already know about this device (by IP)
        return {
          ip: result.ip,
          status: 'offline'
        };
      }
    });

    // Merge with existing devices
    this.mergeDevices(processedDevices);

    // Filter to return only online devices for the immediate response/broadcast if desired, 
    // or return all. Usually UI wants to see what was found.
    const onlineDevices = processedDevices.filter(d => d.status === 'online');

    global.broadcast({
      type: 'scan_complete',
      devices: onlineDevices,
      total: onlineDevices.length
    });

    return onlineDevices;
  }

  // Quick scan single IP
  async scanSingleIP(ip) {
    const result = await this.networkScanner.scanIP(ip);
    
    if (result.alive) {
      const device = {
        id: this.generateId(result.mac || result.ip),
        name: this.networkScanner.generateDeviceName(result.deviceType, result.ip, result.hostname),
        type: result.deviceType,
        ip: result.ip,
        hostname: result.hostname,
        mac: result.mac,
        status: 'online',
        lastSeen: new Date().toISOString(),
        openPorts: result.openPorts,
        confidence: result.confidence,
        metadata: {
          scanMethod: 'single_scan',
          openPorts: result.openPorts,
          hostname: result.hostname,
          mac: result.mac
        }
      };

      this.mergeDevices([device]);
      return device;
    } else {
      // If not alive, update status to offline if we know about this device
      this.mergeDevices([{ ip: ip, status: 'offline' }]);
      return null;
    }
  }
}

module.exports = DeviceDiscovery;
