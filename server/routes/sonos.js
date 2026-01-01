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

// Discover Sonos devices with enhanced bonded device info
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
    let groupInfo = null;
    
    discovery.on('DeviceAvailable', async (device) => {
      // Avoid duplicates
      if (deviceMap.has(device.host)) return;
      
      try {
        const sonos = new Sonos(device.host);
        const description = await sonos.deviceDescription().catch(() => ({}));
        const currentState = await sonos.getCurrentState().catch(() => 'unknown');
        
        // Log discovery
        if (global.activityLog) {
          global.activityLog.discovery('Sonos', `Found: ${description.roomName || 'Unknown'} (${description.modelName || 'Unknown'})`, { ip: device.host });
        }
        
        // Get group info from first device we find (they all report same groups)
        if (!groupInfo) {
          try {
            const groups = await sonos.getAllGroups();
            groupInfo = groups;
          } catch (e) {}
        }
        
        // Check if this is a Sub, Boost, or Surround (bonded devices)
        const modelLower = (description.modelName || '').toLowerCase();
        const isSub = modelLower.includes('sub');
        const isBoost = modelLower.includes('boost');
        const isSurround = modelLower.includes('surround') || modelLower.includes('one sl');
        const isBonded = isSub || isBoost;
        
        // Get topology info for bonded devices
        let bondedTo = null;
        let topology = null;
        
        if (isBonded || isSurround) {
          try {
            const zoneAttrs = await sonos.getZoneAttrs().catch(() => ({}));
            topology = zoneAttrs;
          } catch (e) {}
        }
        
        // Find coordinator for bonded devices (same room name)
        const roomName = description.roomName || '';
        
        deviceMap.set(device.host, {
          id: device.host,
          name: description.roomName || 'Sonos Device',
          model: description.modelName || 'Unknown',
          ip: device.host,
          port: device.port || 1400,
          type: 'sonos',
          state: isBonded ? 'bonded' : currentState,
          isBonded: isBonded,
          isSub: isSub,
          isBoost: isBoost,
          isSurround: isSurround,
          bondedRole: isSub ? 'Subwoofer' : isBoost ? 'WiFi Boost' : isSurround ? 'Surround' : null,
          roomName: roomName,
          serialNumber: description.serialNum || 'Unknown',
          softwareVersion: description.softwareVersion || 'Unknown',
          hardwareVersion: description.hardwareVersion || 'Unknown',
          macAddress: description.MACAddress || 'Unknown'
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

    setTimeout(async () => {
      discovery.destroy();
      const deviceList = Array.from(deviceMap.values());
      
      // Get group info from any device
      let allGroups = [];
      const firstPlayableSpeaker = deviceList.find(d => !d.isBonded);
      if (firstPlayableSpeaker) {
        try {
          const sonos = new Sonos(firstPlayableSpeaker.ip);
          allGroups = await sonos.getAllGroups();
        } catch (e) {}
      }
      
      // Link bonded devices to their parent speakers
      deviceList.forEach(device => {
        if (device.isBonded && device.roomName) {
          // Find the main speaker in the same room (not bonded)
          const parentSpeaker = deviceList.find(d => 
            d.roomName === device.roomName && 
            !d.isBonded && 
            d.ip !== device.ip
          );
          if (parentSpeaker) {
            device.bondedTo = {
              name: parentSpeaker.name,
              ip: parentSpeaker.ip,
              model: parentSpeaker.model
            };
            // Add bonded device info to parent
            if (!parentSpeaker.bondedDevices) {
              parentSpeaker.bondedDevices = [];
            }
            parentSpeaker.bondedDevices.push({
              name: device.name,
              ip: device.ip,
              model: device.model,
              role: device.bondedRole
            });
          }
        }
      });
      
      // Add group info to each device
      deviceList.forEach(device => {
        if (!device.isBonded) {
          const myGroup = allGroups.find(g => 
            g.ZoneGroupMember?.some(m => m.ZoneName === device.roomName)
          );
          
          if (myGroup) {
            const groupMembers = myGroup.ZoneGroupMember?.filter(m => {
              // Exclude bonded devices from group member list
              const memberDevice = deviceList.find(d => d.roomName === m.ZoneName);
              return !memberDevice?.isBonded;
            }).map(m => ({
              name: m.ZoneName,
              ip: m.Location ? m.Location.match(/(\d+\.\d+\.\d+\.\d+)/)?.[1] : null,
              isCoordinator: m.UUID === myGroup.CoordinatorDevice?.UUID
            })) || [];
            
            device.group = {
              name: myGroup.Name,
              members: groupMembers,
              isGrouped: groupMembers.length > 1,
              isCoordinator: myGroup.ZoneGroupMember?.find(m => m.ZoneName === device.roomName)?.UUID === myGroup.CoordinatorDevice?.UUID
            };
          }
        }
      });
      
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
    const desc = await device.deviceDescription().catch(() => ({}));
    await device.play();
    if (global.activityLog) {
      global.activityLog.action('Sonos', `▶️ Play: ${desc.roomName || req.params.ip}`);
    }
    res.json({ status: 'playing' });
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('Sonos', `Play failed (${req.params.ip}): ${error.message}`);
    }
    res.status(500).json({ error: error.message, status: 'error' });
  }
});

router.post('/:ip/pause', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed', status: 'unavailable' });
    }
    const device = new Sonos(req.params.ip);
    const desc = await device.deviceDescription().catch(() => ({}));
    await device.pause();
    if (global.activityLog) {
      global.activityLog.action('Sonos', `⏸️ Pause: ${desc.roomName || req.params.ip}`);
    }
    res.json({ status: 'paused' });
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('Sonos', `Pause failed (${req.params.ip}): ${error.message}`);
    }
    res.status(500).json({ error: error.message, status: 'error' });
  }
});

router.post('/:ip/volume', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed', volume: 0 });
    }
    const device = new Sonos(req.params.ip);
    const desc = await device.deviceDescription().catch(() => ({}));
    const { level } = req.body;
    await device.setVolume(level);
    if (global.activityLog) {
      global.activityLog.action('Sonos', `🔊 Volume ${level}%: ${desc.roomName || req.params.ip}`);
    }
    res.json({ volume: level });
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('Sonos', `Volume failed (${req.params.ip}): ${error.message}`);
    }
    res.status(500).json({ error: error.message, volume: 0 });
  }
});

router.post('/:ip/next', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed', status: 'unavailable' });
    }
    const device = new Sonos(req.params.ip);
    const desc = await device.deviceDescription().catch(() => ({}));
    await device.next();
    if (global.activityLog) {
      global.activityLog.action('Sonos', `⏭️ Next track: ${desc.roomName || req.params.ip}`);
    }
    res.json({ status: 'next track' });
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('Sonos', `Next track failed (${req.params.ip}): ${error.message}`);
    }
    res.status(500).json({ error: error.message, status: 'error' });
  }
});

router.post('/:ip/previous', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed', status: 'unavailable' });
    }
    const device = new Sonos(req.params.ip);
    const desc = await device.deviceDescription().catch(() => ({}));
    await device.previous();
    if (global.activityLog) {
      global.activityLog.action('Sonos', `⏮️ Previous track: ${desc.roomName || req.params.ip}`);
    }
    res.json({ status: 'previous track' });
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('Sonos', `Previous track failed (${req.params.ip}): ${error.message}`);
    }
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
    const desc = await device.deviceDescription().catch(() => ({}));
    await device.setMuted(true);
    if (global.activityLog) {
      global.activityLog.action('Sonos', `🔇 Muted: ${desc.roomName || req.params.ip}`);
    }
    res.json({ status: 'muted' });
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('Sonos', `Mute failed (${req.params.ip}): ${error.message}`);
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/:ip/unmute', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed' });
    }
    const device = new Sonos(req.params.ip);
    const desc = await device.deviceDescription().catch(() => ({}));
    await device.setMuted(false);
    if (global.activityLog) {
      global.activityLog.action('Sonos', `🔊 Unmuted: ${desc.roomName || req.params.ip}`);
    }
    res.json({ status: 'unmuted' });
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('Sonos', `Unmute failed (${req.params.ip}): ${error.message}`);
    }
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
    const desc = await device.deviceDescription().catch(() => ({}));
    await device.stop();
    if (global.activityLog) {
      global.activityLog.action('Sonos', `⏹️ Stopped: ${desc.roomName || req.params.ip}`);
    }
    res.json({ status: 'stopped' });
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('Sonos', `Stop failed (${req.params.ip}): ${error.message}`);
    }
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

// Get all groups with detailed info
router.get('/groups/all', async (req, res) => {
  try {
    if (!DeviceDiscovery || !Sonos) {
      return res.json({ message: 'Sonos package not installed', groups: [] });
    }
    
    // Find any Sonos device to query groups from
    const deviceMap = new Map();
    const discovery = new DeviceDiscovery();
    let groupsData = null;
    
    discovery.on('DeviceAvailable', async (device) => {
      if (groupsData) return; // Already got groups
      
      try {
        const sonos = new Sonos(device.host);
        const [groups, description] = await Promise.all([
          sonos.getAllGroups(),
          sonos.deviceDescription().catch(() => ({}))
        ]);
        
        deviceMap.set(device.host, {
          ip: device.host,
          name: description.roomName,
          model: description.modelName
        });
        
        if (!groupsData && groups) {
          groupsData = groups;
        }
      } catch (err) {}
    });

    setTimeout(async () => {
      discovery.destroy();
      
      if (!groupsData) {
        return res.json({ groups: [], devices: Array.from(deviceMap.values()) });
      }
      
      // Process groups to a cleaner format
      const processedGroups = groupsData.map(group => ({
        name: group.Name || 'Unknown Group',
        coordinator: group.host || null,
        members: (group.ZoneGroupMember || []).map(m => ({
          name: m.ZoneName,
          uuid: m.UUID,
          ip: m.Location ? m.Location.match(/(\d+\.\d+\.\d+\.\d+)/)?.[1] : null,
          isCoordinator: m.UUID === group.CoordinatorDevice?.UUID
        }))
      }));
      
      res.json({ 
        groups: processedGroups,
        devices: Array.from(deviceMap.values())
      });
    }, 4000);
  } catch (error) {
    res.status(500).json({ error: error.message, groups: [] });
  }
});

// Join a device to another device's group
router.post('/:ip/join/:targetIp', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed' });
    }
    
    const device = new Sonos(req.params.ip);
    const targetDevice = new Sonos(req.params.targetIp);
    const deviceDesc = await device.deviceDescription().catch(() => ({}));
    
    // Get target device's group coordinator
    const targetDesc = await targetDevice.deviceDescription();
    const rinconUri = `x-rincon:RINCON_${targetDesc.serialNum?.replace(/[:-]/g, '').slice(0, 12)}0${targetDevice.port || 1400}`;
    
    // Alternative: use joinGroup method if available
    try {
      await device.joinGroup(targetDesc.roomName);
      if (global.activityLog) {
        global.activityLog.action('Sonos', `🔗 ${deviceDesc.roomName || req.params.ip} joined group: ${targetDesc.roomName}`);
      }
      res.json({ 
        status: 'joined', 
        message: `${req.params.ip} joined group with ${targetDesc.roomName}` 
      });
    } catch (e) {
      // Fallback: set AV transport to rincon URI
      await device.setAVTransportURI(rinconUri);
      if (global.activityLog) {
        global.activityLog.action('Sonos', `🔗 ${deviceDesc.roomName || req.params.ip} joined group: ${targetDesc.roomName}`);
      }
      res.json({ 
        status: 'joined', 
        message: `${req.params.ip} joined group with ${targetDesc.roomName}` 
      });
    }
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('Sonos', `Join group failed (${req.params.ip}): ${error.message}`);
    }
    res.status(500).json({ error: error.message });
  }
});

// Leave current group (become standalone)
router.post('/:ip/leave', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed' });
    }
    
    const device = new Sonos(req.params.ip);
    const desc = await device.deviceDescription().catch(() => ({}));
    
    try {
      await device.leaveGroup();
      if (global.activityLog) {
        global.activityLog.action('Sonos', `🔓 ${desc.roomName || req.params.ip} left group (standalone)`);
      }
      res.json({ 
        status: 'left', 
        message: `${req.params.ip} is now playing independently` 
      });
    } catch (e) {
      // Fallback: become coordinator of own group
      await device.becomeCoordinatorOfStandaloneGroup();
      if (global.activityLog) {
        global.activityLog.action('Sonos', `🔓 ${desc.roomName || req.params.ip} left group (standalone)`);
      }
      res.json({ 
        status: 'left', 
        message: `${req.params.ip} is now playing independently` 
      });
    }
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('Sonos', `Leave group failed (${req.params.ip}): ${error.message}`);
    }
    res.status(500).json({ error: error.message });
  }
});

// Get group members for a specific device
router.get('/:ip/group', async (req, res) => {
  try {
    if (!Sonos) {
      return res.json({ message: 'Sonos package not installed' });
    }
    
    const device = new Sonos(req.params.ip);
    const [groups, deviceDesc] = await Promise.all([
      device.getAllGroups(),
      device.deviceDescription()
    ]);
    
    // Find the group this device belongs to
    const myGroup = groups.find(g => 
      g.ZoneGroupMember?.some(m => m.ZoneName === deviceDesc.roomName)
    );
    
    if (myGroup) {
      const members = myGroup.ZoneGroupMember?.map(m => ({
        name: m.ZoneName,
        uuid: m.UUID,
        ip: m.Location ? m.Location.match(/(\d+\.\d+\.\d+\.\d+)/)?.[1] : null,
        isCoordinator: m.UUID === myGroup.CoordinatorDevice?.UUID
      })) || [];
      
      res.json({
        groupName: myGroup.Name,
        coordinator: myGroup.CoordinatorDevice?.ZoneName,
        members,
        isGrouped: members.length > 1
      });
    } else {
      res.json({
        groupName: deviceDesc.roomName,
        coordinator: deviceDesc.roomName,
        members: [{ name: deviceDesc.roomName, ip: req.params.ip, isCoordinator: true }],
        isGrouped: false
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
