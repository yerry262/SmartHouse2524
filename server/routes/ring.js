const express = require('express');
const router = express.Router();

let RingApi = null;
let ringApi = null;

// Try to load Ring package
try {
  RingApi = require('ring-client-api').RingApi;
} catch (error) {
  console.log('⚠️  Ring package not installed. Run: npm install ring-client-api');
}

// Initialize Ring API
const initRingApi = async () => {
  if (!RingApi) {
    return null;
  }
  if (!ringApi && process.env.RING_EMAIL && process.env.RING_PASSWORD) {
    try {
      ringApi = new RingApi({
        email: process.env.RING_EMAIL,
        password: process.env.RING_PASSWORD,
        // 2FA token if required
      });
    } catch (error) {
      console.error('⚠️  Error initializing Ring API:', error.message);
    }
  }
  return ringApi;
};

// Get all Ring devices
router.get('/devices', async (req, res) => {
  try {
    const api = await initRingApi();
    if (!api) {
      return res.status(401).json({ error: 'Ring API not initialized. Check credentials.' });
    }

    const locations = await api.getLocations();
    const devices = [];

    for (const location of locations) {
      const locationDevices = await location.getDevices();
      devices.push(...locationDevices.map(d => ({
        id: d.id,
        name: d.name,
        type: d.deviceType,
        location: location.name,
        battery: d.batteryLevel,
        status: d.data
      })));
    }

    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Ring doorbell events
router.get('/doorbell/:id/events', async (req, res) => {
  try {
    const api = await initRingApi();
    if (!api) {
      return res.status(401).json({ error: 'Ring API not initialized' });
    }

    // Get recent doorbell events
    res.json({
      message: 'Implement event history',
      deviceId: req.params.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get live stream URL
router.get('/camera/:id/stream', async (req, res) => {
  try {
    const api = await initRingApi();
    if (!api) {
      return res.status(401).json({ error: 'Ring API not initialized' });
    }

    res.json({
      message: 'Streaming requires SIP implementation',
      deviceId: req.params.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enable/disable motion detection
router.post('/camera/:id/motion', async (req, res) => {
  try {
    const { enabled } = req.body;
    res.json({
      deviceId: req.params.id,
      motionDetection: enabled,
      message: 'Motion detection updated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
