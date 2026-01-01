const express = require('express');
const router = express.Router();

let LGTV = null;

// Try to load LG TV package
try {
  LGTV = require('lgtv2');
  console.log('✓ LG webOS TV package loaded successfully');
} catch (error) {
  console.log('⚠️  LG webOS TV package not installed. Run: npm install lgtv2');
}

// Store active TV connections
const tvConnections = new Map();

// Helper function to get or create TV connection
function getTVConnection(ip) {
  if (!LGTV) {
    throw new Error('LG TV package not installed');
  }

  if (tvConnections.has(ip)) {
    return tvConnections.get(ip);
  }

  const tv = LGTV({
    url: `ws://${ip}:3000`,
    timeout: 15000,
    reconnect: 5000
  });

  tvConnections.set(ip, tv);

  tv.on('error', (err) => {
    if (global.activityLog) {
      global.activityLog.error('LG TV', `${ip}: ${err.message}`);
    }
  });

  tv.on('close', () => {
    if (global.activityLog) {
      global.activityLog.network('LG TV', `${ip} disconnected`);
    }
    tvConnections.delete(ip);
  });

  tv.on('connect', () => {
    if (global.activityLog) {
      global.activityLog.success('LG TV', `Connected to ${ip}`);
    }
  });

  return tv;
}

// Discover LG TVs (manual IP entry for now)
router.get('/discover', async (req, res) => {
  try {
    if (!LGTV) {
      return res.status(503).json({
        error: 'LG TV package not installed',
        message: 'Install with: npm install lgtv2',
        installed: false
      });
    }

    res.json({
      message: 'LG webOS TVs require manual IP entry. Enter your TV IP address below.',
      note: 'Make sure "LG Connect Apps" is enabled on your TV',
      tvs: Array.from(tvConnections.keys()).map(ip => ({ ip }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect to TV
router.post('/connect', async (req, res) => {
  try {
    if (!LGTV) {
      return res.status(503).json({
        error: 'LG TV package not installed',
        installed: false
      });
    }

    const { ip } = req.body;

    if (!ip) {
      return res.status(400).json({ error: 'IP address required' });
    }

    const tv = getTVConnection(ip);

    // Wait for connection
    const connected = await new Promise((resolve) => {
      let resolved = false;

      tv.on('connect', () => {
        if (!resolved) {
          resolved = true;
          resolve(true);
        }
      });

      tv.on('prompt', () => {
        if (!resolved) {
          resolved = true;
          resolve('prompt');
        }
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }, 10000);
    });

    if (connected === 'prompt') {
      res.json({
        status: 'prompt',
        message: 'Please accept the connection request on your TV',
        ip
      });
    } else if (connected) {
      res.json({
        status: 'connected',
        message: 'Successfully connected to TV',
        ip
      });
    } else {
      res.status(408).json({
        error: 'Connection timeout',
        message: 'Could not connect to TV. Make sure TV is on and "LG Connect Apps" is enabled.'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get TV status
router.get('/:ip/status', async (req, res) => {
  try {
    if (!LGTV) {
      return res.json({ installed: false, online: false });
    }

    const tv = getTVConnection(req.params.ip);

    // Request current software info to check if connected
    tv.request('ssap://com.webos.service.update/getCurrentSWInformation', (err, response) => {
      if (err) {
        res.json({
          ip: req.params.ip,
          online: false,
          error: err.message
        });
      } else {
        res.json({
          ip: req.params.ip,
          online: true,
          info: response
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get volume
router.get('/:ip/volume', async (req, res) => {
  try {
    if (!LGTV) {
      return res.json({ error: 'LG TV package not installed' });
    }

    const tv = getTVConnection(req.params.ip);

    tv.request('ssap://audio/getVolume', (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          volume: response.volume,
          muted: response.muted
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set volume
router.post('/:ip/volume', async (req, res) => {
  try {
    if (!LGTV) {
      return res.json({ error: 'LG TV package not installed' });
    }

    const { volume } = req.body;

    if (volume < 0 || volume > 100) {
      return res.status(400).json({ error: 'Volume must be between 0 and 100' });
    }

    const tv = getTVConnection(req.params.ip);

    tv.request('ssap://audio/setVolume', { volume }, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          status: 'success',
          volume
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mute/Unmute
router.post('/:ip/mute', async (req, res) => {
  try {
    if (!LGTV) {
      return res.json({ error: 'LG TV package not installed' });
    }

    const { mute } = req.body;

    const tv = getTVConnection(req.params.ip);

    tv.request('ssap://audio/setMute', { mute }, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          status: 'success',
          muted: mute
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Power off
router.post('/:ip/power', async (req, res) => {
  try {
    if (!LGTV) {
      return res.json({ error: 'LG TV package not installed' });
    }

    const { state } = req.body;

    const tv = getTVConnection(req.params.ip);

    if (state === false || state === 'off') {
      tv.request('ssap://system/turnOff', (err, response) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json({
            status: 'success',
            message: 'TV turning off'
          });
        }
      });
    } else {
      res.json({
        message: 'LG TVs cannot be powered on remotely. Use Wake-on-LAN if supported.'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Launch app
router.post('/:ip/app', async (req, res) => {
  try {
    if (!LGTV) {
      return res.json({ error: 'LG TV package not installed' });
    }

    const { appId } = req.body;

    const tv = getTVConnection(req.params.ip);

    tv.request('ssap://system.launcher/launch', { id: appId }, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          status: 'success',
          app: appId
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get apps list
router.get('/:ip/apps', async (req, res) => {
  try {
    if (!LGTV) {
      return res.json({ error: 'LG TV package not installed' });
    }

    const tv = getTVConnection(req.params.ip);

    tv.request('ssap://com.webos.applicationManager/listLaunchPoints', (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          apps: response.launchPoints
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Media controls
router.post('/:ip/media/:command', async (req, res) => {
  try {
    if (!LGTV) {
      return res.json({ error: 'LG TV package not installed' });
    }

    const { command } = req.params;
    const validCommands = ['play', 'pause', 'stop', 'rewind', 'fastForward'];

    if (!validCommands.includes(command)) {
      return res.status(400).json({ error: 'Invalid command' });
    }

    const tv = getTVConnection(req.params.ip);

    tv.request(`ssap://media.controls/${command}`, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          status: 'success',
          command
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Channel controls
router.post('/:ip/channel/:direction', async (req, res) => {
  try {
    if (!LGTV) {
      return res.json({ error: 'LG TV package not installed' });
    }

    const { direction } = req.params;

    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({ error: 'Direction must be up or down' });
    }

    const tv = getTVConnection(req.params.ip);
    const command = direction === 'up' ? 'ssap://tv/channelUp' : 'ssap://tv/channelDown';

    tv.request(command, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          status: 'success',
          direction
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current channel
router.get('/:ip/channel', async (req, res) => {
  try {
    if (!LGTV) {
      return res.json({ error: 'LG TV package not installed' });
    }

    const tv = getTVConnection(req.params.ip);

    tv.request('ssap://tv/getCurrentChannel', (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(response);
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Show toast notification
router.post('/:ip/toast', async (req, res) => {
  try {
    if (!LGTV) {
      return res.json({ error: 'LG TV package not installed' });
    }

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const tv = getTVConnection(req.params.ip);

    tv.request('ssap://system.notifications/createToast', { message }, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          status: 'success',
          message
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
