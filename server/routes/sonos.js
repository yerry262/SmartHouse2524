const express = require('express');
const router = express.Router();

let Sonos = null;
let DeviceDiscovery = null;

// Try to load Sonos package - gracefully handle if not installed
try {
  const sonosModule = require('sonos');
  Sonos = sonosModule.Sonos;
  DeviceDiscovery = sonosModule.DeviceDiscovery;
} catch (error) {
  console.log('⚠️  Sonos package not installed. Run: npm install sonos');
}

// Discover Sonos devices
router.get('/discover', async (req, res) => {
  try {
    if (!DeviceDiscovery) {
      return res.json({ 
        message: 'Sonos package not installed. Run: npm install sonos',
        devices: []
      });
    }

    const deviceList = [];
    const discovery = new DeviceDiscovery();
    
    discovery.on('DeviceAvailable', (device) => {
      deviceList.push({
        id: device.host,
        name: device.name || 'Sonos Device',
        ip: device.host,
        port: device.port,
        type: 'sonos'
      });
    });

    setTimeout(() => {
      discovery.destroy();
      res.json(deviceList);
    }, 5000);
  } catch (error) {
    res.status(500).json({ error: error.message, devices: [] });
  }
});

// Get Sonos device info
router.get('/:ip', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed', ip: req.params.ip });
    }

    const device = new Sonos(req.params.ip);
    const [volume, state, track] = await Promise.all([
      device.getVolume().catch(() => 0),
      device.getCurrentState().catch(() => 'unknown'),
      device.currentTrack().catch(() => ({}))
    ]);

    res.json({ ip: req.params.ip, volume, state, track });
  } catch (error) {
    res.status(500).json({ error: error.message, ip: req.params.ip });
  }
});

// Control Sonos device
router.post('/:ip/play', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed', status: 'unavailable' });
    }
    const device = new Sonos(req.params.ip);
    await device.play();
    res.json({ status: 'playing' });
  } catch (error) {
    res.status(500).json({ error: error.message, status: 'error' });
  }
});

router.post('/:ip/pause', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed', status: 'unavailable' });
    }
    const device = new Sonos(req.params.ip);
    await device.pause();
    res.json({ status: 'paused' });
  } catch (error) {
    res.status(500).json({ error: error.message, status: 'error' });
  }
});

router.post('/:ip/volume', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed', volume: 0 });
    }
    const device = new Sonos(req.params.ip);
    const { level } = req.body;
    await device.setVolume(level);
    res.json({ volume: level });
  } catch (error) {
    res.status(500).json({ error: error.message, volume: 0 });
  }
});

router.post('/:ip/next', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed', status: 'unavailable' });
    }
    const device = new Sonos(req.params.ip);
    await device.next();
    res.json({ status: 'next track' });
  } catch (error) {
    res.status(500).json({ error: error.message, status: 'error' });
  }
});

router.post('/:ip/previous', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed', status: 'unavailable' });
    }
    const device = new Sonos(req.params.ip);
    await device.previous();
    res.json({ status: 'previous track' });
  } catch (error) {
    res.status(500).json({ error: error.message, status: 'error' });
  }
});

// Get comprehensive device status with current track info
router.get('/:ip/status', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed' });
    }

    const device = new Sonos(req.params.ip);
    const [volume, state, track, deviceInfo] = await Promise.all([
      device.getVolume().catch(() => 0),
      device.getCurrentState().catch(() => 'stopped'),
      device.currentTrack().catch(() => ({})),
      device.deviceDescription().catch(() => ({}))
    ]);

    res.json({
      ip: req.params.ip,
      volume,
      state,
      track: {
        title: track.title || 'Unknown',
        artist: track.artist || 'Unknown Artist',
        album: track.album || 'Unknown Album',
        duration: track.duration || '0:00',
        position: track.position || '0:00',
        albumArtURI: track.albumArtURI || null,
        uri: track.uri || null
      },
      device: {
        name: deviceInfo.roomName || 'Sonos Device',
        model: deviceInfo.modelName || 'Unknown Model',
        softwareVersion: deviceInfo.softwareVersion || 'Unknown',
        serialNumber: deviceInfo.serialNum || 'Unknown'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mute/Unmute
router.post('/:ip/mute', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed' });
    }
    const device = new Sonos(req.params.ip);
    await device.setMuted(true);
    res.json({ status: 'muted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:ip/unmute', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed' });
    }
    const device = new Sonos(req.params.ip);
    await device.setMuted(false);
    res.json({ status: 'unmuted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop playback
router.post('/:ip/stop', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed' });
    }
    const device = new Sonos(req.params.ip);
    await device.stop();
    res.json({ status: 'stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get queue
router.get('/:ip/queue', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed', queue: [] });
    }
    const device = new Sonos(req.params.ip);
    const queue = await device.getQueue();
    res.json({ queue: queue.items || [] });
  } catch (error) {
    res.status(500).json({ error: error.message, queue: [] });
  }
});

module.exports = router;
