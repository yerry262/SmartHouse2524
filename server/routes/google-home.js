const express = require('express');
const router = express.Router();

let castv2Client;
let googleTTS;

// Try to load required packages
try {
  castv2Client = require('castv2-client');
  console.log('✅ castv2-client package loaded successfully');
} catch (error) {
  console.warn('⚠️  castv2-client package not installed. Install with: npm install castv2-client');
}

try {
  googleTTS = require('google-tts-api');
  console.log('✅ google-tts-api package loaded successfully');
} catch (error) {
  console.warn('⚠️  google-tts-api package not installed. Install with: npm install google-tts-api');
}

// Store discovered devices
let devices = [];

// Discover Google Home/Nest devices on the network
router.post('/discover', async (req, res) => {
  if (!castv2Client) {
    return res.json({
      installed: false,
      message: 'castv2-client package not installed. Run: npm install google-home-notifier castv2-client'
    });
  }

  try {
    const Scanner = castv2Client.Scanner;
    const scanner = new Scanner();

    const foundDevices = [];

    scanner.on('service', (service) => {
      console.log('Found device:', service.name, service.host);
      
      const device = {
        name: service.name,
        host: service.host,
        port: service.port || 8009,
        type: 'cast',
        discovered: new Date().toISOString()
      };

      // Add to found devices if not already present
      if (!foundDevices.find(d => d.host === device.host)) {
        foundDevices.push(device);
      }

      // Add to global devices list
      const existingIndex = devices.findIndex(d => d.host === device.host);
      if (existingIndex !== -1) {
        devices[existingIndex] = device;
      } else {
        devices.push(device);
      }

      // Broadcast update
      if (global.broadcast) {
        global.broadcast({
          type: 'device_discovered',
          category: 'google-home',
          device: device
        });
      }
    });

    scanner.start();

    // Stop scanner after 10 seconds
    setTimeout(() => {
      scanner.stop();
      res.json({
        success: true,
        devices: foundDevices,
        message: `Found ${foundDevices.length} device(s)`
      });
    }, 10000);

  } catch (error) {
    console.error('Error discovering devices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all discovered devices
router.get('/devices', (req, res) => {
  if (!castv2Client) {
    return res.json({
      installed: false,
      message: 'castv2-client package not installed. Run: npm install google-home-notifier castv2-client'
    });
  }

  res.json({ devices });
});

// Add device manually
router.post('/add-device', (req, res) => {
  const { name, host, port } = req.body;

  if (!host) {
    return res.status(400).json({ error: 'Host is required' });
  }

  const device = {
    name: name || host,
    host: host,
    port: port || 8009,
    type: 'cast',
    discovered: new Date().toISOString()
  };

  // Check if device already exists
  const existingIndex = devices.findIndex(d => d.host === device.host);
  if (existingIndex !== -1) {
    devices[existingIndex] = device;
  } else {
    devices.push(device);
  }

  res.json({ success: true, device });
});

// Text-to-speech announcement
router.post('/devices/:host/speak', async (req, res) => {
  if (!castv2Client) {
    return res.json({
      installed: false,
      message: 'castv2-client package not installed'
    });
  }

  try {
    const { host } = req.params;
    const { text, language } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const device = devices.find(d => d.host === host);
    if (!device) {
      return res.status(404).json({ error: 'Device not found. Add device first.' });
    }

    // Generate TTS URL
    let audioUrl;
    if (googleTTS) {
      audioUrl = await googleTTS.getAudioUrl(text, {
        lang: language || 'en',
        slow: false,
        host: 'https://translate.google.com',
      });
    } else {
      // Fallback to a simple TTS service
      audioUrl = `http://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(text)}&tl=${language || 'en'}`;
    }

    const Client = castv2Client.Client;
    const DefaultMediaReceiver = castv2Client.DefaultMediaReceiver;
    const client = new Client();

    await new Promise((resolve, reject) => {
      client.connect(host, () => {
        client.launch(DefaultMediaReceiver, (err, player) => {
          if (err) {
            client.close();
            return reject(err);
          }

          const media = {
            contentId: audioUrl,
            contentType: 'audio/mp3',
            streamType: 'BUFFERED',
          };

          player.load(media, { autoplay: true }, (err, status) => {
            client.close();
            if (err) return reject(err);
            resolve(status);
          });
        });
      });

      client.on('error', (err) => {
        client.close();
        reject(err);
      });
    });

    res.json({ success: true, message: 'Announcement sent' });
  } catch (error) {
    console.error('Error sending announcement:', error);
    res.status(500).json({ error: error.message });
  }
});

// Play media URL
router.post('/devices/:host/play', async (req, res) => {
  if (!castv2Client) {
    return res.json({
      installed: false,
      message: 'castv2-client package not installed'
    });
  }

  try {
    const { host } = req.params;
    const { url, contentType } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Media URL is required' });
    }

    const device = devices.find(d => d.host === host);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const Client = castv2Client.Client;
    const DefaultMediaReceiver = castv2Client.DefaultMediaReceiver;
    const client = new Client();

    await new Promise((resolve, reject) => {
      client.connect(host, () => {
        client.launch(DefaultMediaReceiver, (err, player) => {
          if (err) {
            client.close();
            return reject(err);
          }

          const media = {
            contentId: url,
            contentType: contentType || 'audio/mp3',
            streamType: 'BUFFERED',
          };

          player.load(media, { autoplay: true }, (err, status) => {
            client.close();
            if (err) return reject(err);
            resolve(status);
          });
        });
      });

      client.on('error', (err) => {
        client.close();
        reject(err);
      });
    });

    res.json({ success: true, message: 'Media playing' });
  } catch (error) {
    console.error('Error playing media:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set volume using castv2-client
router.post('/devices/:host/volume', async (req, res) => {
  if (!castv2Client) {
    return res.json({
      installed: false,
      message: 'castv2-client package not installed'
    });
  }

  try {
    const { host } = req.params;
    const { volume } = req.body;

    if (volume === undefined || volume < 0 || volume > 100) {
      return res.status(400).json({ error: 'Volume must be between 0 and 100' });
    }

    const device = devices.find(d => d.host === host);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const Client = castv2Client.Client;
    const DefaultMediaReceiver = castv2Client.DefaultMediaReceiver;
    const client = new Client();

    await new Promise((resolve, reject) => {
      client.connect(host, () => {
        client.getVolume((err, vol) => {
          if (err) {
            client.close();
            return reject(err);
          }

          client.setVolume({ level: volume / 100 }, (err) => {
            client.close();
            if (err) return reject(err);
            resolve();
          });
        });
      });

      client.on('error', (err) => {
        client.close();
        reject(err);
      });
    });

    res.json({ success: true, volume });
  } catch (error) {
    console.error('Error setting volume:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop playback
router.post('/devices/:host/stop', async (req, res) => {
  if (!castv2Client) {
    return res.json({
      installed: false,
      message: 'castv2-client package not installed'
    });
  }

  try {
    const { host } = req.params;

    const device = devices.find(d => d.host === host);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const Client = castv2Client.Client;
    const DefaultMediaReceiver = castv2Client.DefaultMediaReceiver;
    const client = new Client();

    await new Promise((resolve, reject) => {
      client.connect(host, () => {
        client.launch(DefaultMediaReceiver, (err, player) => {
          if (err) {
            client.close();
            return reject(err);
          }

          player.stop((err) => {
            client.close();
            if (err) return reject(err);
            resolve();
          });
        });
      });

      client.on('error', (err) => {
        client.close();
        reject(err);
      });
    });

    res.json({ success: true, message: 'Playback stopped' });
  } catch (error) {
    console.error('Error stopping playback:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get device status
router.get('/devices/:host/status', async (req, res) => {
  if (!castv2Client) {
    return res.json({
      installed: false,
      message: 'castv2-client package not installed'
    });
  }

  try {
    const { host } = req.params;

    const device = devices.find(d => d.host === host);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const Client = castv2Client.Client;
    const client = new Client();

    const status = await new Promise((resolve, reject) => {
      client.connect(host, () => {
        client.getStatus((err, status) => {
          if (err) {
            client.close();
            return reject(err);
          }

          client.getVolume((err, volume) => {
            client.close();
            if (err) {
              resolve({ ...status, volume: null });
            } else {
              resolve({ ...status, volume });
            }
          });
        });
      });

      client.on('error', (err) => {
        client.close();
        reject(err);
      });
    });

    res.json({
      device: device,
      status: status
    });
  } catch (error) {
    console.error('Error getting device status:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
