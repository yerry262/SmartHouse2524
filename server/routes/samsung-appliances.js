const express = require('express');
const router = express.Router();
const axios = require('axios');

// Samsung SmartThings API configuration
const SMARTTHINGS_API = 'https://api.smartthings.com/v1';
let accessToken = process.env.SAMSUNG_SMARTTHINGS_TOKEN;

// Get headers for SmartThings API
const getHeaders = () => ({
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
});

// Check if SmartThings is configured
router.get('/status', (req, res) => {
  res.json({
    configured: !!accessToken,
    message: accessToken ? 'SmartThings configured' : 'Set SAMSUNG_SMARTTHINGS_TOKEN in .env'
  });
});

// Get all devices
router.get('/devices', async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(503).json({
        error: 'Samsung SmartThings not configured',
        message: 'Set SAMSUNG_SMARTTHINGS_TOKEN in .env file',
        configured: false
      });
    }

    const response = await axios.get(`${SMARTTHINGS_API}/devices`, {
      headers: getHeaders()
    });

    const devices = response.data.items || [];
    
    res.json({ devices });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Get refrigerators only
router.get('/refrigerators', async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(503).json({
        error: 'Samsung SmartThings not configured',
        configured: false
      });
    }

    const response = await axios.get(`${SMARTTHINGS_API}/devices`, {
      headers: getHeaders()
    });

    const devices = response.data.items || [];
    const refrigerators = devices.filter(device => {
      const type = device.type?.toLowerCase() || '';
      const name = device.label?.toLowerCase() || '';
      return type.includes('refriger') || name.includes('fridge') || name.includes('refriger');
    });

    // Get status for each refrigerator
    const fridgesWithStatus = await Promise.all(
      refrigerators.map(async (fridge) => {
        try {
          const statusResponse = await axios.get(
            `${SMARTTHINGS_API}/devices/${fridge.deviceId}/status`,
            { headers: getHeaders() }
          );
          
          return {
            id: fridge.deviceId,
            name: fridge.label || 'Samsung Refrigerator',
            model: fridge.name,
            roomId: fridge.roomId,
            online: statusResponse.data.components?.main?.healthCheck?.DeviceWatch?.deviceWatch?.value === 'online',
            temperature: statusResponse.data.components?.main?.temperatureMeasurement?.temperature?.value,
            temperatureUnit: statusResponse.data.components?.main?.temperatureMeasurement?.temperature?.unit,
            doorStatus: statusResponse.data.components?.main?.contactSensor?.contact?.value,
            status: statusResponse.data,
            capabilities: fridge.components?.[0]?.capabilities || []
          };
        } catch (err) {
          return {
            id: fridge.deviceId,
            name: fridge.label || 'Samsung Refrigerator',
            model: fridge.name,
            online: false,
            error: 'Failed to get status'
          };
        }
      })
    );

    res.json({ refrigerators: fridgesWithStatus });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Get specific device details
router.get('/devices/:id', async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(503).json({ error: 'Not configured' });
    }

    const deviceResponse = await axios.get(
      `${SMARTTHINGS_API}/devices/${req.params.id}`,
      { headers: getHeaders() }
    );

    const statusResponse = await axios.get(
      `${SMARTTHINGS_API}/devices/${req.params.id}/status`,
      { headers: getHeaders() }
    );

    res.json({
      device: deviceResponse.data,
      status: statusResponse.data
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Execute device command
router.post('/devices/:id/command', async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(503).json({ error: 'Not configured' });
    }

    const { capability, command, arguments: args } = req.body;

    const response = await axios.post(
      `${SMARTTHINGS_API}/devices/${req.params.id}/commands`,
      {
        commands: [{
          component: 'main',
          capability,
          command,
          arguments: args || []
        }]
      },
      { headers: getHeaders() }
    );

    res.json({
      status: 'success',
      result: response.data
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Set refrigerator temperature
router.post('/refrigerators/:id/temperature', async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(503).json({ error: 'Not configured' });
    }

    const { temperature } = req.body;

    const response = await axios.post(
      `${SMARTTHINGS_API}/devices/${req.params.id}/commands`,
      {
        commands: [{
          component: 'main',
          capability: 'temperatureMeasurement',
          command: 'setTemperature',
          arguments: [temperature]
        }]
      },
      { headers: getHeaders() }
    );

    res.json({
      status: 'success',
      message: `Temperature set to ${temperature}°`,
      result: response.data
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Get ovens
router.get('/ovens', async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(503).json({ error: 'Not configured' });
    }

    const response = await axios.get(`${SMARTTHINGS_API}/devices`, {
      headers: getHeaders()
    });

    const devices = response.data.items || [];
    const ovens = devices.filter(device => {
      const type = device.type?.toLowerCase() || '';
      const name = device.label?.toLowerCase() || '';
      return type.includes('oven') || name.includes('oven') || type.includes('range');
    });

    res.json({ ovens });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get washers/dryers
router.get('/laundry', async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(503).json({ error: 'Not configured' });
    }

    const response = await axios.get(`${SMARTTHINGS_API}/devices`, {
      headers: getHeaders()
    });

    const devices = response.data.items || [];
    const laundry = devices.filter(device => {
      const type = device.type?.toLowerCase() || '';
      const name = device.label?.toLowerCase() || '';
      return type.includes('washer') || type.includes('dryer') || 
             name.includes('washer') || name.includes('dryer');
    });

    res.json({ laundry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
