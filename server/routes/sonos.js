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
    if (!DeviceDiscovery || !Sonos) {
      return res.json({ 
        message: 'Sonos package not installed. Run: npm install sonos',
        devices: []
      });
    }

    const deviceMap = new Map();
    const discovery = new DeviceDiscovery();
    
    discovery.on('DeviceAvailable', async (device) => {
      // Avoid duplicates
      if (deviceMap.has(device.host)) return;
      
      try {
        const sonos = new Sonos(device.host);
        const description = await sonos.deviceDescription().catch(() => ({}));
        const currentState = await sonos.getCurrentState().catch(() => 'unknown');
        
        // Check if this is a Sub (bonded device)
        const isSub = (description.modelName || '').toLowerCase().includes('sub');
        const isBoost = (description.modelName || '').toLowerCase().includes('boost');
        
        deviceMap.set(device.host, {
          id: device.host,
          name: description.roomName || 'Sonos Device',
          model: description.modelName || 'Unknown',
          ip: device.host,
          port: device.port || 1400,
          type: 'sonos',
          state: isSub || isBoost ? 'bonded' : currentState,
          isBonded: isSub || isBoost,
          serialNumber: description.serialNum || 'Unknown',
          softwareVersion: description.softwareVersion || 'Unknown'
        });
      } catch (err) {
        deviceMap.set(device.host, {
          id: device.host,
          name: 'Sonos Device',
          ip: device.host,
          port: device.port || 1400,
          type: 'sonos',
          state: 'unknown'
        });
      }
    });

    setTimeout(() => {
      discovery.destroy();
      const deviceList = Array.from(deviceMap.values());
      console.log(`Sonos: Discovered ${deviceList.length} devices`);
      res.json(deviceList);
    }, 5000);
  } catch (error) {
    console.error('Sonos discovery error:', error);
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

// Get all zones/groups
router.get('/zones/all', async (req, res) => {
  try {
    if (!DeviceDiscovery) {
      return res.json({ message: 'Sonos package not installed', zones: [] });
    }
    
    const zones = [];
    const discovery = new DeviceDiscovery();
    
    discovery.on('DeviceAvailable', async (device) => {
      try {
        const sonos = new Sonos(device.host);
        const [groups, deviceDesc] = await Promise.all([
          sonos.getAllGroups().catch(() => []),
          sonos.deviceDescription().catch(() => ({}))
        ]);
        
        zones.push({
          ip: device.host,
          name: deviceDesc.roomName || 'Unknown Room',
          model: deviceDesc.modelName || 'Unknown',
          groups: groups.map(g => ({
            name: g.Name,
            coordinator: g.CoordinatorDevice?.host,
            members: g.ZoneGroupMember?.map(m => m.ZoneName) || []
          }))
        });
      } catch (err) {
        console.log('Error getting zone info:', err.message);
      }
    });

    setTimeout(() => {
      discovery.destroy();
      res.json({ zones });
    }, 5000);
  } catch (error) {
    res.status(500).json({ error: error.message, zones: [] });
  }
});

// Get favorites
router.get('/:ip/favorites', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed', favorites: [] });
    }
    const device = new Sonos(req.params.ip);
    const favorites = await device.getFavorites().catch(() => ({ items: [] }));
    res.json({ favorites: favorites.items || [] });
  } catch (error) {
    res.status(500).json({ error: error.message, favorites: [] });
  }
});

// Get music services
router.get('/:ip/services', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed', services: [] });
    }
    const device = new Sonos(req.params.ip);
    const services = await device.getMusicLibrary('sonos_services').catch(() => ({ items: [] }));
    res.json({ services: services.items || [] });
  } catch (error) {
    res.status(500).json({ error: error.message, services: [] });
  }
});

// Play a favorite
router.post('/:ip/favorite/:id', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed' });
    }
    const device = new Sonos(req.params.ip);
    // Get the favorite and play it
    const favorites = await device.getFavorites();
    const favorite = favorites.items?.find(f => f.id === req.params.id || f.title === req.params.id);
    
    if (favorite && favorite.uri) {
      await device.setAVTransportURI(favorite.uri);
      await device.play();
      res.json({ status: 'playing', favorite: favorite.title });
    } else {
      res.status(404).json({ error: 'Favorite not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seek to position
router.post('/:ip/seek', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed' });
    }
    const device = new Sonos(req.params.ip);
    const { seconds } = req.body;
    await device.seek(seconds);
    res.json({ status: 'seeked', position: seconds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current position info (for accurate progress)
router.get('/:ip/position', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed' });
    }
    const device = new Sonos(req.params.ip);
    // Use currentTrack which includes position and duration in seconds
    const track = await device.currentTrack().catch(() => ({}));
    res.json({
      track: track.queuePosition || 0,
      duration: track.duration || 0,
      position: track.position || 0,
      uri: track.uri || '',
      title: track.title || ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
