const express = require('express');
const router = express.Router();

let Alexa;
let alexaClient;

// Try to load alexa-remote2 package
try {
  Alexa = require('alexa-remote2');
  console.log('✅ alexa-remote2 package loaded successfully');
} catch (error) {
  console.warn('⚠️  alexa-remote2 package not installed. Install with: npm install alexa-remote2');
}

// Get or initialize Alexa client
async function getAlexaClient() {
  if (!Alexa) {
    throw new Error('alexa-remote2 package not installed');
  }

  if (!alexaClient) {
    const email = process.env.ALEXA_EMAIL;
    const password = process.env.ALEXA_PASSWORD;

    if (!email || !password) {
      throw new Error('ALEXA_EMAIL and ALEXA_PASSWORD must be set in .env file');
    }

    alexaClient = new Alexa();
    
    // Initialize connection
    await new Promise((resolve, reject) => {
      alexaClient.init({
        cookie: '',
        email: email,
        password: password,
        proxyOnly: false,
        proxyOwnIp: '',
        proxyPort: 0,
        bluetooth: true,
        logger: console.log,
        alexaServiceHost: 'pitangui.amazon.com',
        amazonPage: 'amazon.com',
        acceptLanguage: 'en-US',
        userAgent: '',
        useWsMqtt: true,
        cookieRefreshInterval: 7 * 24 * 60 * 60 * 1000
      }, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log('✅ Alexa client initialized');
          resolve();
        }
      });
    });
  }

  return alexaClient;
}

// Get all Echo devices
router.get('/devices', async (req, res) => {
  if (!Alexa) {
    return res.json({
      installed: false,
      message: 'alexa-remote2 package not installed. Run: npm install alexa-remote2'
    });
  }

  try {
    const client = await getAlexaClient();
    const devices = client.serialNumbers || {};
    
    const deviceList = Object.keys(devices).map(serial => ({
      serialNumber: serial,
      name: devices[serial].accountName,
      family: devices[serial].deviceFamily,
      type: devices[serial].deviceType,
      online: devices[serial].online,
      capabilities: devices[serial].capabilities
    }));

    res.json({ devices: deviceList });
  } catch (error) {
    console.error('Error getting Alexa devices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send text-to-speech command
router.post('/devices/:serialNumber/speak', async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const client = await getAlexaClient();
    await client.sendSequenceCommand(serialNumber, 'speak', text);

    res.json({ success: true, message: 'Command sent' });
  } catch (error) {
    console.error('Error sending speak command:', error);
    res.status(500).json({ error: error.message });
  }
});

// Play music
router.post('/devices/:serialNumber/play', async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const { query } = req.body;

    const client = await getAlexaClient();
    
    if (query) {
      await client.sendSequenceCommand(serialNumber, 'music', query);
    } else {
      await client.sendSequenceCommand(serialNumber, 'play');
    }

    res.json({ success: true, message: 'Play command sent' });
  } catch (error) {
    console.error('Error sending play command:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pause playback
router.post('/devices/:serialNumber/pause', async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const client = await getAlexaClient();
    
    await client.sendSequenceCommand(serialNumber, 'pause');

    res.json({ success: true, message: 'Pause command sent' });
  } catch (error) {
    console.error('Error sending pause command:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set volume
router.post('/devices/:serialNumber/volume', async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const { volume } = req.body;

    if (volume === undefined || volume < 0 || volume > 100) {
      return res.status(400).json({ error: 'Volume must be between 0 and 100' });
    }

    const client = await getAlexaClient();
    await client.sendCommand(serialNumber, 'volume', volume);

    res.json({ success: true, message: 'Volume set' });
  } catch (error) {
    console.error('Error setting volume:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send custom command/routine
router.post('/devices/:serialNumber/command', async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const client = await getAlexaClient();
    await client.sendSequenceCommand(serialNumber, 'text', command);

    res.json({ success: true, message: 'Command sent' });
  } catch (error) {
    console.error('Error sending command:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get device status
router.get('/devices/:serialNumber/status', async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const client = await getAlexaClient();
    
    const devices = client.serialNumbers || {};
    const device = devices[serialNumber];

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Get player state
    const playerInfo = await client.getPlayerInfo(serialNumber);

    res.json({
      serialNumber,
      name: device.accountName,
      online: device.online,
      volume: device.volume,
      player: playerInfo
    });
  } catch (error) {
    console.error('Error getting device status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get notifications
router.get('/notifications', async (req, res) => {
  try {
    const client = await getAlexaClient();
    const notifications = await client.getNotifications();

    res.json({ notifications });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get routines
router.get('/routines', async (req, res) => {
  try {
    const client = await getAlexaClient();
    const routines = await client.getAutomationRoutines();

    res.json({ routines });
  } catch (error) {
    console.error('Error getting routines:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute routine
router.post('/routines/:utteranceId/execute', async (req, res) => {
  try {
    const { utteranceId } = req.params;
    const client = await getAlexaClient();
    
    await client.executeAutomationRoutine(utteranceId);

    res.json({ success: true, message: 'Routine executed' });
  } catch (error) {
    console.error('Error executing routine:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
