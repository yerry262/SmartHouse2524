const express = require('express');
const router = express.Router();
const axios = require('axios');
const DeviceDiscovery = require('../services/deviceDiscovery');

const discovery = new DeviceDiscovery();

// Helper to get base URL for internal API calls
const getBaseUrl = () => `http://localhost:${process.env.PORT || 5000}`;

// Cache for live device data to prevent excessive API calls
let liveDeviceCache = {
  devices: [],
  lastFetch: 0
};
const CACHE_TTL = 30000; // 30 seconds cache

const updateLiveDeviceCache = async () => {
  const now = Date.now();
  if (now - liveDeviceCache.lastFetch <= CACHE_TTL && liveDeviceCache.devices.length > 0) return;

  const liveDataPromises = [];
  
  // WeMo devices (fast - just reads in-memory map)
  liveDataPromises.push(
    axios.get(`${getBaseUrl()}/api/wemo/status/all`, { timeout: 2000 })
      .then(resp => {
        if (resp.data && resp.data.devices) {
          return resp.data.devices.map(w => ({
            id: `wemo_${w.host.replace(/\./g, '_')}`,
            type: 'wemo',
            name: w.friendlyName,
            ip: w.host,
            ipAddress: w.host,
            model: w.modelName,
            manufacturer: 'Belkin',
            status: w.online ? 'online' : 'offline',
            binaryState: w.binaryState,
            lastSeen: new Date().toISOString()
          }));
        }
        return [];
      })
      .catch(() => [])
  );
  
  // Wait for all live data
  const liveResults = await Promise.all(liveDataPromises);
  
  // Flatten results
  liveDeviceCache.devices = liveResults.flat();
  liveDeviceCache.lastFetch = now;
};

// Get all devices
router.get('/', async (req, res) => {
  try {
    let devices = await discovery.getAllDevices();
    
    // Only filter out WeMo devices since we fetch those live (other types come from devices.json)
    // WeMo live data is fast - just reads from in-memory map
    const liveTypes = ['wemo-plug', 'wemo'];
    devices = devices.filter(d => {
      const type = (d.type || '').toLowerCase();
      return !liveTypes.some(t => type.includes(t));
    });
    
    // Update live cache
    await updateLiveDeviceCache();
    
    // Combine cached file devices with live devices
    devices = [...devices, ...liveDeviceCache.devices];
    
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Discover new devices
router.post('/discover', async (req, res) => {
  try {
    const newDevices = await discovery.discoverDevices();
    res.json({ message: 'Discovery completed', devices: newDevices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all devices (must come before /:id route)
router.delete('/clear', async (req, res) => {
  try {
    await discovery.clearAllDevices();
    res.json({ message: 'All devices cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get device by ID
router.get('/:id', async (req, res) => {
  try {
    let device = await discovery.getDeviceById(req.params.id);
    
    // If not found in static file, check live cache (e.g. WeMo devices)
    if (!device) {
      // Check cache first
      device = liveDeviceCache.devices.find(d => d.id === req.params.id);
      
      // If still not found and it looks like a WeMo ID, try to refresh cache
      if (!device && req.params.id.startsWith('wemo_')) {
         // Force refresh cache
         liveDeviceCache.lastFetch = 0;
         await updateLiveDeviceCache();
         device = liveDeviceCache.devices.find(d => d.id === req.params.id);
      }
    }

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove device
router.delete('/:id', async (req, res) => {
  try {
    await discovery.removeDevice(req.params.id);
    res.json({ message: 'Device removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search devices
router.get('/search/:query', async (req, res) => {
  try {
    const results = await discovery.searchDevices(req.params.query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scan subnet
router.post('/scan-subnet', async (req, res) => {
  try {
    const { subnet = '192.168.4', startIP = 1, endIP = 255 } = req.body;
    
    // Start scan in background
    discovery.scanSubnet(subnet, startIP, endIP)
      .then(devices => {
        console.log(`Subnet scan complete: ${devices.length} devices found`);
      })
      .catch(error => {
        console.error('Subnet scan error:', error);
      });

    // Return immediately
    res.json({ 
      message: 'Subnet scan started',
      subnet: `${subnet}.${startIP}-${endIP}`,
      status: 'scanning'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scan single IP
router.post('/scan-ip', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ error: 'IP address required' });
    }

    const device = await discovery.scanSingleIP(ip);
    
    if (device) {
      res.json(device);
    } else {
      res.status(404).json({ error: 'No device found at this IP' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quick actions - control multiple devices at once
router.post('/quick-action', async (req, res) => {
  try {
    const { action } = req.body;
    const devices = await discovery.getAllDevices();
    const results = [];
    const baseUrl = getBaseUrl();

    // Helper function to control WeMo devices
    const controlWemo = async (ip, state) => {
      try {
        await axios.post(`${baseUrl}/api/wemo/${ip}/power`, { state }, { timeout: 5000 });
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    // Helper function to control Sonos devices
    const controlSonos = async (ip, command) => {
      try {
        await axios.post(`${baseUrl}/api/sonos/${ip}/${command}`, {}, { timeout: 5000 });
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    switch (action) {
      case 'lights_off':
        // Turn off all lights (including WeMo LightSwitch and plugs)
        for (const device of devices) {
          const isLight = device.type?.toLowerCase().includes('light') || 
                         device.type?.toLowerCase().includes('bulb') ||
                         device.type?.toLowerCase().includes('hue') ||
                         device.type?.toLowerCase().includes('lifx') ||
                         device.type?.toLowerCase().includes('nanoleaf');
          const isWemo = device.type?.toLowerCase().includes('wemo');
          
          if (isLight || isWemo) {
            const ip = device.ip || device.ipAddress;
            if (isWemo && ip) {
              const result = await controlWemo(ip, false);
              results.push({ 
                device: device.name, 
                ip: ip,
                action: 'off', 
                status: result.success ? 'success' : 'failed',
                error: result.error 
              });
            } else if (isLight) {
              results.push({ device: device.name, action: 'off', status: 'success' });
            }
          }
        }
        break;

      case 'lights_on':
        // Turn on all lights (including WeMo LightSwitch and plugs)
        for (const device of devices) {
          const isLight = device.type?.toLowerCase().includes('light') || 
                         device.type?.toLowerCase().includes('bulb') ||
                         device.type?.toLowerCase().includes('hue') ||
                         device.type?.toLowerCase().includes('lifx') ||
                         device.type?.toLowerCase().includes('nanoleaf');
          const isWemo = device.type?.toLowerCase().includes('wemo');
          
          if (isLight || isWemo) {
            const ip = device.ip || device.ipAddress;
            if (isWemo && ip) {
              const result = await controlWemo(ip, true);
              results.push({ 
                device: device.name, 
                ip: ip,
                action: 'on', 
                status: result.success ? 'success' : 'failed',
                error: result.error 
              });
            } else if (isLight) {
              results.push({ device: device.name, action: 'on', status: 'success' });
            }
          }
        }
        break;

      case 'music_stop':
        // Stop all music/speakers
        for (const device of devices) {
          const isSpeaker = device.type?.toLowerCase().includes('speaker') || 
                           device.type?.toLowerCase().includes('sonos') ||
                           device.type?.toLowerCase().includes('alexa') ||
                           device.type?.toLowerCase().includes('google');
          
          if (isSpeaker) {
            const ip = device.ip || device.ipAddress;
            if (device.type?.toLowerCase().includes('sonos') && ip) {
              const result = await controlSonos(ip, 'stop');
              results.push({ 
                device: device.name, 
                ip: ip,
                action: 'stop', 
                status: result.success ? 'success' : 'failed',
                error: result.error 
              });
            } else {
              results.push({ device: device.name, action: 'stop', status: 'pending' });
            }
          }
        }
        break;

      case 'tvs_off':
        // Turn off all TVs
        for (const device of devices) {
          if (device.type?.toLowerCase().includes('tv') || 
              device.type?.toLowerCase().includes('display')) {
            results.push({ device: device.name, action: 'off', status: 'pending' });
          }
        }
        break;

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }

    // Broadcast update
    if (global.broadcast) {
      global.broadcast({
        type: 'quick_action',
        action: action,
        results: results,
      });
    }

    res.json({ 
      success: true, 
      action: action,
      affected: results.length,
      results: results 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scenes - execute predefined device configurations
router.post('/scene', async (req, res) => {
  try {
    const { sceneId, name } = req.body;
    const devices = await discovery.getAllDevices();
    const results = [];

    // Predefined scenes
    const scenes = {
      1: { // Good Morning
        lights: { power: 'on', brightness: 100 },
        music: { action: 'play', playlist: 'morning' },
      },
      2: { // Movie Night
        lights: { power: 'on', brightness: 20 },
        tv: { power: 'on' },
      },
      3: { // Bedtime
        lights: { power: 'off' },
        music: { action: 'stop' },
        tv: { power: 'off' },
      },
      4: { // Party Mode
        lights: { power: 'on', brightness: 100, color: 'dynamic' },
        music: { action: 'play', volume: 80 },
      },
    };

    const scene = scenes[sceneId];
    if (!scene) {
      return res.status(400).json({ error: 'Scene not found' });
    }

    // Apply scene settings
    for (const device of devices) {
      const type = device.type?.toLowerCase() || '';
      
      if ((type.includes('light') || type.includes('bulb')) && scene.lights) {
        results.push({
          device: device.name,
          settings: scene.lights,
          status: 'applied',
        });
      }
      
      if ((type.includes('speaker') || type.includes('sonos')) && scene.music) {
        results.push({
          device: device.name,
          settings: scene.music,
          status: 'applied',
        });
      }
      
      if (type.includes('tv') && scene.tv) {
        results.push({
          device: device.name,
          settings: scene.tv,
          status: 'applied',
        });
      }
    }

    // Broadcast update
    if (global.broadcast) {
      global.broadcast({
        type: 'scene_activated',
        sceneId: sceneId,
        sceneName: name,
        results: results,
      });
    }

    res.json({
      success: true,
      scene: name,
      affected: results.length,
      results: results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
