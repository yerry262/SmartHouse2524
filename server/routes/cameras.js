const express = require('express');
const router = express.Router();

// Camera URLs from environment
let cameras = [];

const initCameras = () => {
  const urls = (process.env.CAMERA_URLS || '').split(',').filter(url => url);
  cameras = urls.map((url, index) => ({
    id: `camera_${index}`,
    name: `Camera ${index + 1}`,
    url: url.trim(),
    type: 'camera',
    protocol: url.includes('rtsp') ? 'RTSP' : 'HTTP'
  }));
};

initCameras();

// Get all cameras
router.get('/', (req, res) => {
  res.json(cameras);
});

// Get camera stream URL
router.get('/:id/stream', (req, res) => {
  const camera = cameras.find(c => c.id === req.params.id);
  if (!camera) {
    return res.status(404).json({ error: 'Camera not found' });
  }
  
  res.json({
    id: camera.id,
    streamUrl: camera.url,
    protocol: camera.protocol,
    message: 'Use RTSP player or convert to HLS for web playback'
  });
});

// Get camera snapshot
router.get('/:id/snapshot', async (req, res) => {
  try {
    const camera = cameras.find(c => c.id === req.params.id);
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    res.json({
      message: 'Implement snapshot capture using ONVIF or camera-specific API',
      cameraId: req.params.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PTZ Control (Pan-Tilt-Zoom)
router.post('/:id/ptz', async (req, res) => {
  try {
    const { direction, speed } = req.body; // up, down, left, right, zoom_in, zoom_out
    
    res.json({
      message: 'PTZ control requires ONVIF implementation',
      cameraId: req.params.id,
      command: { direction, speed }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new camera
router.post('/', (req, res) => {
  const { name, url, username, password } = req.body;
  
  const newCamera = {
    id: `camera_${cameras.length}`,
    name,
    url,
    type: 'camera',
    protocol: url.includes('rtsp') ? 'RTSP' : 'HTTP'
  };
  
  cameras.push(newCamera);
  res.json(newCamera);
});

// Remove camera
router.delete('/:id', (req, res) => {
  cameras = cameras.filter(c => c.id !== req.params.id);
  res.json({ message: 'Camera removed' });
});

module.exports = router;
