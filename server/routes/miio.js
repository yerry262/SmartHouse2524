const express = require('express');
const router = express.Router();

let miio = null;
let devicesManager = null;

// Try to load miio package
try {
  miio = require('miio');
  console.log('✓ miio package loaded successfully');
} catch (error) {
  console.log('⚠️ miio package not installed. Run: npm install miio');
}

// Store discovered devices
const discoveredDevices = new Map();

// Initialize device discovery
if (miio) {
  devicesManager = miio.devices({
    cacheTime: 300, // 5 minutes
    useTokenStorage: true
  });

  devicesManager.on('available', reg => {
    console.log(`miio device discovered: ${reg.id}`);
    if (global.activityLog) {
      global.activityLog.discovery('miio', `Device discovered: ${reg.id}`);
    }
    
    if (!reg.token) {
      console.log(`Device ${reg.id} hides its token - manual configuration needed`);
      if (global.activityLog) {
        global.activityLog.warning('miio', `Device ${reg.id} requires manual token`);
      }
      discoveredDevices.set(reg.id, {
        id: reg.id,
        address: reg.address,
        needsToken: true
      });
      return;
    }

    const device = reg.device;
    if (device) {
      discoveredDevices.set(reg.id, {
        id: reg.id,
        device: device,
        address: reg.address,
        type: device.miioModel || 'unknown',
        capabilities: device.capabilities || []
      });
    }
  });

  devicesManager.on('unavailable', reg => {
    console.log(`miio device unavailable: ${reg.id}`);
    if (global.activityLog) {
      global.activityLog.warning('miio', `Device unavailable: ${reg.id}`);
    }
    discoveredDevices.delete(reg.id);
  });

  devicesManager.on('error', err => {
    console.error('miio device error:', err);
    if (global.activityLog) {
      global.activityLog.error('miio', `Device error: ${err.message || err}`);
    }
  });
}

// Discover devices
router.get('/discover', async (req, res) => {
  try {
    if (!miio) {
      return res.status(503).json({
        error: 'miio package not installed',
        message: 'Install with: npm install miio',
        installed: false
      });
    }

    const devices = Array.from(discoveredDevices.values()).map(d => ({
      id: d.id,
      address: d.address,
      type: d.type,
      needsToken: d.needsToken || false,
      capabilities: d.capabilities
    }));

    res.json({
      success: true,
      count: devices.length,
      devices,
      message: 'Devices are discovered automatically. Some devices may require manual token configuration.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect to a device manually with token
router.post('/connect', async (req, res) => {
  try {
    if (!miio) {
      return res.json({ error: 'miio package not installed' });
    }

    const { address, token } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    const device = await miio.device({ address, token });

    const deviceInfo = {
      id: device.id,
      address: address,
      type: device.miioModel || 'unknown',
      capabilities: device.capabilities || []
    };

    discoveredDevices.set(device.id, {
      ...deviceInfo,
      device: device
    });

    res.json({
      success: true,
      message: 'Device connected successfully',
      device: deviceInfo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all robot vacuums
router.get('/vacuums', async (req, res) => {
  try {
    if (!miio) {
      return res.json({ error: 'miio package not installed', vacuums: [] });
    }

    const vacuums = Array.from(discoveredDevices.values())
      .filter(d => d.device && (
        d.device.matches('type:vaccuum') ||
        d.device.matches('cap:vacuum')
      ))
      .map(d => ({
        id: d.id,
        address: d.address,
        type: d.type
      }));

    res.json({ vacuums });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vacuum state
router.get('/vacuums/:id/state', async (req, res) => {
  try {
    if (!miio) {
      return res.json({ error: 'miio package not installed' });
    }

    const deviceInfo = discoveredDevices.get(req.params.id);
    if (!deviceInfo || !deviceInfo.device) {
      return res.status(404).json({ error: 'Vacuum not found' });
    }

    const device = deviceInfo.device;
    const state = {
      id: device.id,
      state: device.property('state'),
      battery: device.property('batteryLevel'),
      charging: device.property('charging')
    };

    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start cleaning
router.post('/vacuums/:id/clean', async (req, res) => {
  try {
    if (!miio) {
      return res.json({ error: 'miio package not installed' });
    }

    const deviceInfo = discoveredDevices.get(req.params.id);
    if (!deviceInfo || !deviceInfo.device) {
      return res.status(404).json({ error: 'Vacuum not found' });
    }

    const device = deviceInfo.device;
    
    if (device.matches('cap:vacuum')) {
      await device.activateCleaning();
      res.json({ success: true, message: 'Cleaning started' });
    } else {
      res.status(400).json({ error: 'Device does not support vacuum cleaning' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop cleaning / Pause
router.post('/vacuums/:id/stop', async (req, res) => {
  try {
    if (!miio) {
      return res.json({ error: 'miio package not installed' });
    }

    const deviceInfo = discoveredDevices.get(req.params.id);
    if (!deviceInfo || !deviceInfo.device) {
      return res.status(404).json({ error: 'Vacuum not found' });
    }

    const device = deviceInfo.device;
    
    if (device.matches('cap:vacuum')) {
      await device.deactivateCleaning();
      res.json({ success: true, message: 'Cleaning stopped' });
    } else {
      res.status(400).json({ error: 'Device does not support vacuum cleaning' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Return to dock/charge
router.post('/vacuums/:id/dock', async (req, res) => {
  try {
    if (!miio) {
      return res.json({ error: 'miio package not installed' });
    }

    const deviceInfo = discoveredDevices.get(req.params.id);
    if (!deviceInfo || !deviceInfo.device) {
      return res.status(404).json({ error: 'Vacuum not found' });
    }

    const device = deviceInfo.device;
    
    if (device.matches('cap:vacuum-cleaning')) {
      await device.activateCharging();
      res.json({ success: true, message: 'Returning to dock' });
    } else {
      res.status(400).json({ error: 'Device does not support docking' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get air purifiers
router.get('/purifiers', async (req, res) => {
  try {
    if (!miio) {
      return res.json({ error: 'miio package not installed', purifiers: [] });
    }

    const purifiers = Array.from(discoveredDevices.values())
      .filter(d => d.device && d.device.matches('type:air-purifier'))
      .map(d => ({
        id: d.id,
        address: d.address,
        type: d.type
      }));

    res.json({ purifiers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Control air purifier power
router.post('/purifiers/:id/power', async (req, res) => {
  try {
    if (!miio) {
      return res.json({ error: 'miio package not installed' });
    }

    const { state } = req.body;
    const deviceInfo = discoveredDevices.get(req.params.id);
    
    if (!deviceInfo || !deviceInfo.device) {
      return res.status(404).json({ error: 'Purifier not found' });
    }

    const device = deviceInfo.device;
    
    if (device.matches('cap:power')) {
      await device.setPower(state);
      res.json({ success: true, power: state });
    } else {
      res.status(400).json({ error: 'Device does not support power control' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get device info
router.get('/devices/:id', async (req, res) => {
  try {
    if (!miio) {
      return res.json({ error: 'miio package not installed' });
    }

    const deviceInfo = discoveredDevices.get(req.params.id);
    if (!deviceInfo) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const device = deviceInfo.device;
    const info = {
      id: deviceInfo.id,
      address: deviceInfo.address,
      type: deviceInfo.type,
      capabilities: deviceInfo.capabilities,
      properties: {}
    };

    // Get common properties if device is available
    if (device) {
      if (device.matches('cap:power')) {
        info.properties.power = device.property('power');
      }
      if (device.matches('cap:mode')) {
        info.properties.mode = device.property('mode');
      }
      if (device.matches('cap:temperature')) {
        info.properties.temperature = device.property('temperature');
      }
    }

    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
