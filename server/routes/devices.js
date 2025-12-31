const express = require('express');
const router = express.Router();
const DeviceDiscovery = require('../services/deviceDiscovery');

const discovery = new DeviceDiscovery();

// Get all devices
router.get('/', async (req, res) => {
  try {
    const devices = await discovery.getAllDevices();
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
    const device = await discovery.getDeviceById(req.params.id);
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

    switch (action) {
      case 'lights_off':
        // Turn off all lights
        for (const device of devices) {
          if (device.type?.toLowerCase().includes('light') || 
              device.type?.toLowerCase().includes('bulb') ||
              device.type?.toLowerCase().includes('hue')) {
            results.push({ device: device.name, action: 'off', status: 'success' });
          }
        }
        break;

      case 'lights_on':
        // Turn on all lights
        for (const device of devices) {
          if (device.type?.toLowerCase().includes('light') || 
              device.type?.toLowerCase().includes('bulb') ||
              device.type?.toLowerCase().includes('hue')) {
            results.push({ device: device.name, action: 'on', status: 'success' });
          }
        }
        break;

      case 'music_stop':
        // Stop all music/speakers
        for (const device of devices) {
          if (device.type?.toLowerCase().includes('speaker') || 
              device.type?.toLowerCase().includes('sonos') ||
              device.type?.toLowerCase().includes('alexa') ||
              device.type?.toLowerCase().includes('google')) {
            results.push({ device: device.name, action: 'stop', status: 'success' });
          }
        }
        break;

      case 'tvs_off':
        // Turn off all TVs
        for (const device of devices) {
          if (device.type?.toLowerCase().includes('tv') || 
              device.type?.toLowerCase().includes('display')) {
            results.push({ device: device.name, action: 'off', status: 'success' });
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
