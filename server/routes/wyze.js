const express = require('express');
const router = express.Router();

let Wyze = null;
let wyzeClient = null;

// Try to load Wyze package
try {
  Wyze = require('wyze-node');
  console.log('✓ Wyze package loaded successfully');
} catch (error) {
  console.log('⚠️ Wyze package not installed. Run: npm install wyze-node');
}

// Initialize client with credentials
function getWyzeClient() {
  if (!Wyze) return null;
  
  if (wyzeClient) return wyzeClient;
  
  const username = process.env.WYZE_EMAIL;
  const password = process.env.WYZE_PASSWORD;
  
  if (!username || !password) {
    throw new Error('WYZE_EMAIL and WYZE_PASSWORD must be set in .env file');
  }
  
  wyzeClient = new Wyze({ username, password });
  return wyzeClient;
}

// Get all Wyze devices
router.get('/devices', async (req, res) => {
  try {
    if (!Wyze) {
      return res.status(503).json({
        error: 'Wyze package not installed',
        message: 'Install with: npm install wyze-node',
        installed: false
      });
    }
    
    const client = getWyzeClient();
    const devices = await client.getDeviceList();

    // Log discovery
    if (global.activityLog && devices.length > 0) {
      global.activityLog.discovery('Wyze', `Found ${devices.length} device(s)`);
    }

    res.json({
      success: true,
      count: devices.length,
      devices: devices.map(device => ({
        mac: device.mac,
        nickname: device.nickname,
        type: device.product_type,
        model: device.product_model,
        online: device.device_params?.power_state !== undefined
      }))
    });
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('Wyze', `Device fetch failed: ${error.message}`);
    }
    res.status(500).json({ 
      error: error.message,
      hint: 'Check WYZE_EMAIL and WYZE_PASSWORD in .env file'
    });
  }
});

// Get device by name
router.get('/devices/name/:name', async (req, res) => {
  try {
    if (!Wyze) {
      return res.json({ error: 'Wyze package not installed' });
    }
    
    const client = getWyzeClient();
    const device = await client.getDeviceByName(req.params.name);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get devices by type
router.get('/devices/type/:type', async (req, res) => {
  try {
    if (!Wyze) {
      return res.json({ error: 'Wyze package not installed' });
    }
    
    const client = getWyzeClient();
    const devices = await client.getDevicesByType(req.params.type);
    
    res.json({
      type: req.params.type,
      count: devices.length,
      devices
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get device state
router.get('/devices/:mac/state', async (req, res) => {
  try {
    if (!Wyze) {
      return res.json({ error: 'Wyze package not installed' });
    }
    
    const client = getWyzeClient();
    const devices = await client.getDeviceList();
    const device = devices.find(d => d.mac === req.params.mac);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const state = await client.getDeviceState(device);
    
    res.json({
      mac: device.mac,
      nickname: device.nickname,
      state
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get device status (detailed)
router.get('/devices/:mac/status', async (req, res) => {
  try {
    if (!Wyze) {
      return res.json({ error: 'Wyze package not installed' });
    }
    
    const client = getWyzeClient();
    const devices = await client.getDeviceList();
    const device = devices.find(d => d.mac === req.params.mac);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const status = await client.getDeviceStatus(device);
    
    res.json({
      mac: device.mac,
      nickname: device.nickname,
      status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Turn device on
router.post('/devices/:mac/on', async (req, res) => {
  try {
    if (!Wyze) {
      return res.json({ error: 'Wyze package not installed' });
    }
    
    const client = getWyzeClient();
    const devices = await client.getDeviceList();
    const device = devices.find(d => d.mac === req.params.mac);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const result = await client.turnOn(device);
    
    res.json({
      success: true,
      message: 'Device turned on',
      mac: device.mac,
      nickname: device.nickname,
      result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Turn device off
router.post('/devices/:mac/off', async (req, res) => {
  try {
    if (!Wyze) {
      return res.json({ error: 'Wyze package not installed' });
    }
    
    const client = getWyzeClient();
    const devices = await client.getDeviceList();
    const device = devices.find(d => d.mac === req.params.mac);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const result = await client.turnOff(device);
    
    res.json({
      success: true,
      message: 'Device turned off',
      mac: device.mac,
      nickname: device.nickname,
      result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cameras
router.get('/cameras', async (req, res) => {
  try {
    if (!Wyze) {
      return res.json({ error: 'Wyze package not installed' });
    }
    
    const client = getWyzeClient();
    const devices = await client.getDevicesByType('Camera');
    
    res.json({
      count: devices.length,
      cameras: devices
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bulbs
router.get('/bulbs', async (req, res) => {
  try {
    if (!Wyze) {
      return res.json({ error: 'Wyze package not installed' });
    }
    
    const client = getWyzeClient();
    const devices = await client.getDevicesByType('Light');
    
    res.json({
      count: devices.length,
      bulbs: devices
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get plugs
router.get('/plugs', async (req, res) => {
  try {
    if (!Wyze) {
      return res.json({ error: 'Wyze package not installed' });
    }
    
    const client = getWyzeClient();
    const devices = await client.getDevicesByType('Plug');
    
    res.json({
      count: devices.length,
      plugs: devices
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sensors
router.get('/sensors', async (req, res) => {
  try {
    if (!Wyze) {
      return res.json({ error: 'Wyze package not installed' });
    }
    
    const client = getWyzeClient();
    const devices = await client.getDeviceList();
    const sensors = devices.filter(d => 
      d.product_type === 'ContactSensor' || 
      d.product_type === 'MotionSensor' ||
      d.product_type === 'Sensor'
    );
    
    res.json({
      count: sensors.length,
      sensors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
