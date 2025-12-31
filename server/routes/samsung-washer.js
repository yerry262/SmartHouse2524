const express = require('express');
const router = express.Router();

let SamsungSmartThings = null;
let installed = false;

// Try to load Samsung SmartThings API package
try {
  SamsungSmartThings = require('@smartthings/core-sdk');
  installed = true;
  console.log('✓ Samsung SmartThings API loaded successfully');
} catch (error) {
  console.log('⚠️ SmartThings SDK not installed. Run: npm install @smartthings/core-sdk');
}

// Store devices and client
let washers = [];
let smartThingsClient = null;

// Initialize SmartThings client with token from env
const initializeClient = () => {
  if (!SamsungSmartThings || !process.env.SMARTTHINGS_TOKEN) {
    return null;
  }
  
  try {
    return new SamsungSmartThings.SmartThingsApi(
      new SamsungSmartThings.BearerTokenAuthenticator(process.env.SMARTTHINGS_TOKEN)
    );
  } catch (error) {
    console.error('Failed to initialize SmartThings client:', error);
    return null;
  }
};

// Discover Samsung washers
router.get('/discover', async (req, res) => {
  try {
    if (!installed) {
      return res.json({
        installed: false,
        message: 'SmartThings SDK not installed. Run: npm install @smartthings/core-sdk',
        washers: []
      });
    }

    if (!process.env.SMARTTHINGS_TOKEN) {
      return res.json({
        installed: true,
        tokenRequired: true,
        message: 'SmartThings Personal Access Token required in .env file (SMARTTHINGS_TOKEN=your_token)',
        washers: []
      });
    }

    smartThingsClient = initializeClient();
    if (!smartThingsClient) {
      return res.json({
        installed: true,
        error: 'Failed to initialize SmartThings client',
        washers: []
      });
    }

    // Get all devices and filter for washers
    const devicesResponse = await smartThingsClient.devices.list();
    const devices = devicesResponse || [];

    washers = devices.filter(device => {
      const capabilities = device.components?.[0]?.capabilities || [];
      const hasWasherCapability = capabilities.some(cap => 
        cap.id === 'washerMode' || 
        cap.id === 'washerOperatingState' ||
        cap.id === 'switch' // Basic on/off for simple washers
      );
      const isWasher = device.deviceTypeName?.toLowerCase().includes('washer') ||
                       device.label?.toLowerCase().includes('washer') ||
                       device.name?.toLowerCase().includes('washer');
      return hasWasherCapability || isWasher;
    });

    console.log(`Found ${washers.length} Samsung washers`);

    res.json({
      installed: true,
      success: true,
      found: washers.length,
      washers: washers.map(washer => ({
        id: washer.deviceId,
        name: washer.label || washer.name || `Samsung Washer ${washer.deviceId.slice(-4)}`,
        deviceId: washer.deviceId,
        model: washer.deviceTypeName || 'Samsung Washer',
        manufacturer: 'Samsung',
        capabilities: washer.components?.[0]?.capabilities?.map(c => c.id) || [],
        status: 'discovered'
      }))
    });

  } catch (error) {
    console.error('Samsung washer discovery error:', error);
    res.status(500).json({
      installed: true,
      error: 'Discovery failed: ' + error.message,
      washers: []
    });
  }
});

// Get all washers
router.get('/washers', async (req, res) => {
  try {
    if (!installed) {
      return res.json({
        installed: false,
        message: 'SmartThings SDK not installed',
        washers: []
      });
    }

    res.json({
      installed: true,
      washers: washers.map(washer => ({
        id: washer.deviceId,
        name: washer.label || washer.name || `Samsung Washer ${washer.deviceId.slice(-4)}`,
        deviceId: washer.deviceId,
        model: washer.deviceTypeName || 'Samsung Washer',
        manufacturer: 'Samsung',
        capabilities: washer.components?.[0]?.capabilities?.map(c => c.id) || [],
        status: 'available'
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get washer status
router.get('/washers/:deviceId/status', async (req, res) => {
  try {
    if (!smartThingsClient) {
      smartThingsClient = initializeClient();
    }
    
    if (!smartThingsClient) {
      return res.json({ error: 'SmartThings client not available' });
    }

    const deviceId = req.params.deviceId;
    const deviceStatus = await smartThingsClient.devices.getStatus(deviceId);
    
    const mainComponent = deviceStatus.components?.main || {};
    
    // Extract washer-specific states
    const status = {
      deviceId,
      power: mainComponent.switch?.switch?.value || 'unknown',
      washerMode: mainComponent.washerMode?.washerMode?.value || 'unknown',
      operatingState: mainComponent.washerOperatingState?.washerOperatingState?.value || 'unknown',
      completionTime: mainComponent.washerOperatingState?.completionTime?.value || null,
      progress: mainComponent.washerOperatingState?.progress?.value || 0,
      temperature: mainComponent.temperatureMeasurement?.temperature?.value || null,
      lastUpdate: new Date().toISOString()
    };

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Error getting washer status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Control washer power
router.post('/washers/:deviceId/power', async (req, res) => {
  try {
    if (!smartThingsClient) {
      smartThingsClient = initializeClient();
    }
    
    if (!smartThingsClient) {
      return res.json({ error: 'SmartThings client not available' });
    }

    const deviceId = req.params.deviceId;
    const { state } = req.body; // true/false or 'on'/'off'

    const command = state === true || state === 'on' ? 'on' : 'off';

    await smartThingsClient.devices.executeCommands(deviceId, [{
      component: 'main',
      capability: 'switch',
      command: command
    }]);

    res.json({
      success: true,
      deviceId,
      state: command,
      message: `Washer turned ${command}`
    });

  } catch (error) {
    console.error('Error controlling washer power:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set washer mode
router.post('/washers/:deviceId/mode', async (req, res) => {
  try {
    if (!smartThingsClient) {
      smartThingsClient = initializeClient();
    }
    
    if (!smartThingsClient) {
      return res.json({ error: 'SmartThings client not available' });
    }

    const deviceId = req.params.deviceId;
    const { mode } = req.body; // normal, delicate, heavy, quick, etc.

    await smartThingsClient.devices.executeCommands(deviceId, [{
      component: 'main',
      capability: 'washerMode',
      command: 'setWasherMode',
      arguments: [mode]
    }]);

    res.json({
      success: true,
      deviceId,
      mode,
      message: `Washer mode set to ${mode}`
    });

  } catch (error) {
    console.error('Error setting washer mode:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start washing cycle
router.post('/washers/:deviceId/start', async (req, res) => {
  try {
    if (!smartThingsClient) {
      smartThingsClient = initializeClient();
    }
    
    if (!smartThingsClient) {
      return res.json({ error: 'SmartThings client not available' });
    }

    const deviceId = req.params.deviceId;

    // First turn on the washer
    await smartThingsClient.devices.executeCommands(deviceId, [{
      component: 'main',
      capability: 'switch',
      command: 'on'
    }]);

    // Then start the cycle if the capability exists
    try {
      await smartThingsClient.devices.executeCommands(deviceId, [{
        component: 'main',
        capability: 'washerOperatingState',
        command: 'start'
      }]);
    } catch (err) {
      console.log('Start command not available on this washer model');
    }

    res.json({
      success: true,
      deviceId,
      message: 'Washing cycle started'
    });

  } catch (error) {
    console.error('Error starting washer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop washing cycle
router.post('/washers/:deviceId/stop', async (req, res) => {
  try {
    if (!smartThingsClient) {
      smartThingsClient = initializeClient();
    }
    
    if (!smartThingsClient) {
      return res.json({ error: 'SmartThings client not available' });
    }

    const deviceId = req.params.deviceId;

    // Try to pause/stop the cycle
    try {
      await smartThingsClient.devices.executeCommands(deviceId, [{
        component: 'main',
        capability: 'washerOperatingState',
        command: 'pause'
      }]);
    } catch (err) {
      // If pause doesn't work, try turning off
      await smartThingsClient.devices.executeCommands(deviceId, [{
        component: 'main',
        capability: 'switch',
        command: 'off'
      }]);
    }

    res.json({
      success: true,
      deviceId,
      message: 'Washing cycle stopped'
    });

  } catch (error) {
    console.error('Error stopping washer:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;