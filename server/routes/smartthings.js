const express = require('express');
const router = express.Router();
const axios = require('axios');

let smartThingsApi = null;

// Try to load SmartThings package (if available)
try {
  smartThingsApi = require('@smartthings/core-sdk');
  console.log('✓ SmartThings API available');
} catch (error) {
  console.log('⚠️  SmartThings package not installed. Run: npm install @smartthings/core-sdk');
}

// SmartThings configuration
const SMARTTHINGS_API_URL = 'https://api.smartthings.com/v1';

// Get SmartThings token from request header or environment
const getToken = (req) => {
  // First check for token in request header (from frontend linked accounts)
  const headerToken = req?.headers?.['x-smartthings-token'];
  if (headerToken) {
    return headerToken;
  }
  // Fall back to environment variable
  return process.env.SMARTTHINGS_TOKEN || null;
};

// Discover SmartThings devices
const discoverHandler = async (req, res) => {
  try {
    const token = getToken(req);
    
    if (!token) {
      return res.json({
        success: false,
        message: 'SmartThings Personal Access Token not configured',
        instructions: 'Set SMARTTHINGS_TOKEN environment variable',
        devices: []
      });
    }

    // Get devices from SmartThings API
    const response = await axios.get(`${SMARTTHINGS_API_URL}/devices`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const devices = response.data.items || [];
    
    // Transform devices to our format
    const transformedDevices = devices.map(device => ({
      id: device.deviceId,
      name: device.label || device.name,
      type: device.type || 'smartthings-device',
      manufacturer: device.deviceManufacturerCode || 'SmartThings',
      model: device.deviceTypeName,
      roomId: device.roomId,
      status: device.status || 'unknown',
      capabilities: device.components?.[0]?.capabilities || [],
      lastActivity: device.lastActivityTime
    }));

    // Log discovery
    if (global.activityLog && transformedDevices.length > 0) {
      global.activityLog.discovery('SmartThings', `Discovered ${transformedDevices.length} device(s)`);
    }

    res.json({
      success: true,
      message: `Discovered ${transformedDevices.length} SmartThings devices`,
      devices: transformedDevices,
      total: transformedDevices.length
    });
    
  } catch (error) {
    console.error('SmartThings discovery error:', error.response?.data || error.message);
    if (global.activityLog) {
      global.activityLog.error('SmartThings', `Discovery failed: ${error.message}`);
    }
    res.status(500).json({ 
      success: false,
      error: error.response?.data?.message || error.message,
      devices: []
    });
  }
};

router.get('/discover', discoverHandler);
router.post('/discover', discoverHandler);

// Get device status
router.get('/:deviceId/status', async (req, res) => {
  try {
    const token = getToken(req);
    
    if (!token) {
      return res.json({ error: 'SmartThings token not configured' });
    }

    const response = await axios.get(
      `${SMARTTHINGS_API_URL}/devices/${req.params.deviceId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    res.json(response.data);
    
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

// Control device (execute command)
router.post('/:deviceId/command', async (req, res) => {
  try {
    const token = getToken(req);
    const { capability, command, arguments: args = [] } = req.body;
    
    if (!token) {
      return res.json({ error: 'SmartThings token not configured' });
    }

    const payload = {
      commands: [{
        component: 'main',
        capability,
        command,
        arguments: args
      }]
    };

    const response = await axios.post(
      `${SMARTTHINGS_API_URL}/devices/${req.params.deviceId}/commands`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true, result: response.data });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.response?.data?.message || error.message 
    });
  }
});

// Get locations
router.get('/locations', async (req, res) => {
  try {
    const token = getToken(req);
    
    if (!token) {
      return res.json({ error: 'SmartThings token not configured' });
    }

    const response = await axios.get(`${SMARTTHINGS_API_URL}/locations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
    
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

// Get rooms for a location
router.get('/locations/:locationId/rooms', async (req, res) => {
  try {
    const token = getToken(req);
    
    if (!token) {
      return res.json({ error: 'SmartThings token not configured' });
    }

    const response = await axios.get(
      `${SMARTTHINGS_API_URL}/locations/${req.params.locationId}/rooms`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    res.json(response.data);
    
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

module.exports = router;