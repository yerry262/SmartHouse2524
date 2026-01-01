const express = require('express');
const router = express.Router();
const ringService = require('../services/ringStreaming');

/**
 * Ring Camera API Routes
 * 
 * Ring cameras are cloud-only - they don't expose local ports (no RTSP/ONVIF).
 * All video streaming goes through Ring's cloud servers.
 * 
 * To use these endpoints, you need a Ring refresh token:
 * Run: npx -p ring-client-api ring-auth-cli
 */

// Get auth status and instructions
router.get('/auth', (req, res) => {
  if (ringService.isConfigured()) {
    res.json({ 
      configured: true, 
      message: 'Ring API is configured',
      note: 'Ring cameras stream via cloud only (192.168.x.x addresses won\'t show video ports)'
    });
  } else {
    res.json({ 
      configured: false, 
      ...ringService.getAuthInstructions() 
    });
  }
});

// Get all Ring cameras
router.get('/cameras', async (req, res) => {
  try {
    if (!ringService.isConfigured()) {
      return res.status(401).json(ringService.getAuthInstructions());
    }
    const cameras = await ringService.getCameras();
    if (global.activityLog && cameras.length > 0) {
      global.activityLog.discovery('Ring', `Found ${cameras.length} camera(s)`);
    }
    res.json(cameras);
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('Ring', `Camera fetch failed: ${error.message}`);
    }
    res.status(500).json({ error: error.message });
  }
});

// Get all Ring devices (cameras + other devices)
router.get('/devices', async (req, res) => {
  try {
    if (!ringService.isConfigured()) {
      return res.status(401).json(ringService.getAuthInstructions());
    }
    const cameras = await ringService.getCameras();
    res.json(cameras);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get camera snapshot (still image)
router.get('/camera/:id/snapshot', async (req, res) => {
  try {
    if (!ringService.isConfigured()) {
      return res.status(401).json(ringService.getAuthInstructions());
    }
    
    const result = await ringService.getSnapshot(req.params.id);
    if (global.activityLog) {
      global.activityLog.action('Ring', `Captured snapshot from camera ${req.params.id}`);
    }
    
    if (req.query.format === 'json') {
      res.json({
        success: true,
        timestamp: result.timestamp,
        dataUrl: `data:image/jpeg;base64,${result.data.toString('base64')}`,
      });
    } else {
      // Return raw image
      res.set('Content-Type', 'image/jpeg');
      res.send(result.data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start live stream
router.post('/camera/:id/stream/start', async (req, res) => {
  try {
    if (!ringService.isConfigured()) {
      return res.status(401).json(ringService.getAuthInstructions());
    }
    
    const { rtspUrl, duration } = req.body;
    const result = await ringService.startLiveStream(req.params.id, { rtspUrl, duration });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop live stream
router.post('/camera/:id/stream/stop', async (req, res) => {
  try {
    const result = await ringService.stopLiveStream(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stream status
router.get('/camera/:id/stream/status', (req, res) => {
  const status = ringService.getStreamStatus(req.params.id);
  res.json(status);
});

// Get all active streams
router.get('/streams', (req, res) => {
  res.json(ringService.getActiveStreams());
});

// Get live stream URL (legacy endpoint)
router.get('/camera/:id/stream', async (req, res) => {
  try {
    if (!ringService.isConfigured()) {
      return res.status(401).json(ringService.getAuthInstructions());
    }

    const status = ringService.getStreamStatus(req.params.id);
    
    if (status.active) {
      res.json({
        deviceId: req.params.id,
        streaming: true,
        rtspUrl: status.rtspUrl,
        duration: status.duration,
      });
    } else {
      res.json({
        deviceId: req.params.id,
        streaming: false,
        message: 'No active stream. POST to /stream/start to begin streaming.',
        note: 'Ring cameras are cloud-only. Live streaming requires starting a SIP session.',
        instructions: {
          startStream: `POST /api/ring/camera/${req.params.id}/stream/start`,
          requirements: 'Requires go2rtc or rtsp-simple-server running on port 8554',
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent events for camera
router.get('/camera/:id/events', async (req, res) => {
  try {
    if (!ringService.isConfigured()) {
      return res.status(401).json(ringService.getAuthInstructions());
    }
    
    const limit = parseInt(req.query.limit) || 10;
    const events = await ringService.getEvents(req.params.id, limit);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get video URL for recorded event
router.get('/camera/:id/events/:eventId/video', async (req, res) => {
  try {
    if (!ringService.isConfigured()) {
      return res.status(401).json(ringService.getAuthInstructions());
    }
    
    const result = await ringService.getEventVideo(req.params.id, req.params.eventId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Control camera light
router.post('/camera/:id/light', async (req, res) => {
  try {
    if (!ringService.isConfigured()) {
      return res.status(401).json(ringService.getAuthInstructions());
    }
    
    const { on } = req.body;
    const result = await ringService.setLight(req.params.id, on);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Control camera siren
router.post('/camera/:id/siren', async (req, res) => {
  try {
    if (!ringService.isConfigured()) {
      return res.status(401).json(ringService.getAuthInstructions());
    }
    
    const { on } = req.body;
    const result = await ringService.setSiren(req.params.id, on);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enable/disable motion detection (legacy endpoint)
router.post('/camera/:id/motion', async (req, res) => {
  try {
    const { enabled } = req.body;
    res.json({
      deviceId: req.params.id,
      motionDetection: enabled,
      message: 'Motion detection settings updated via Ring app',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Doorbell events (legacy endpoint)
router.get('/doorbell/:id/events', async (req, res) => {
  try {
    if (!ringService.isConfigured()) {
      return res.status(401).json(ringService.getAuthInstructions());
    }
    
    const events = await ringService.getEvents(req.params.id, 10);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
