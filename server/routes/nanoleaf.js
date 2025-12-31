const express = require('express');
const router = express.Router();

// Gracefully load Nanoleaf package
let NanoleafClient = null;
try {
  const nanoleaf = require('nanoleaf-client-multi');
  NanoleafClient = nanoleaf.NanoleafClient;
  console.log('✓ Nanoleaf package loaded successfully');
} catch (error) {
  console.log('⚠️ Nanoleaf package (nanoleaf-client-multi) not installed. Run: npm install nanoleaf-client-multi');
}

// In-memory storage for discovered devices and authenticated clients
const discoveredDevices = [];
const authenticatedClients = new Map();

/**
 * @route   GET /api/nanoleaf/discover
 * @desc    Discover Nanoleaf devices on the network
 */
router.get('/discover', async (req, res) => {
  if (!NanoleafClient) {
    return res.status(503).json({
      error: 'Nanoleaf package not installed',
      message: 'Install with: npm install nanoleaf-client-multi',
      installed: false
    });
  }

  try {
    const client = new NanoleafClient();
    let devices = [];
    
    try {
      devices = await client.discoverNanoleaf();
    } catch (discoveryError) {
      console.warn('Nanoleaf discovery failed:', discoveryError.message);
      // Return empty results instead of error
      devices = [];
    }
    
    discoveredDevices.length = 0;
    if (devices && devices.length > 0) {
      discoveredDevices.push(...devices);
    }

    const formattedDevices = devices.map(device => ({
      name: device.name || `Nanoleaf ${device.model}`,
      ip: device.host,
      port: device.port || 16021,
      model: device.model,
      serialNo: device.nl_serial
    }));

    res.json({
      success: true,
      count: formattedDevices.length,
      devices: formattedDevices,
      message: formattedDevices.length === 0 ? 'No Nanoleaf devices found. Make sure your devices are connected to the same network.' : undefined
    });
  } catch (error) {
    console.error('Error discovering Nanoleaf devices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Also support POST for discover
router.post('/discover', async (req, res) => {
  if (!NanoleafClient) {
    return res.status(503).json({
      error: 'Nanoleaf package not installed',
      message: 'Install with: npm install nanoleaf-client-multi',
      installed: false
    });
  }

  try {
    const client = new NanoleafClient();
    let devices = [];
    
    try {
      devices = await client.discoverNanoleaf();
    } catch (discoveryError) {
      console.warn('Nanoleaf discovery failed:', discoveryError.message);
      devices = [];
    }
    
    discoveredDevices.length = 0;
    if (devices && devices.length > 0) {
      discoveredDevices.push(...devices);
    }

    const formattedDevices = devices.map(device => ({
      name: device.name || `Nanoleaf ${device.model}`,
      ip: device.host,
      port: device.port || 16021,
      model: device.model,
      serialNo: device.nl_serial
    }));

    // Broadcast discoveries
    if (global.broadcast && formattedDevices.length > 0) {
      formattedDevices.forEach(device => {
        global.broadcast({
          type: 'device_discovered',
          device: {
            id: `nanoleaf_${device.ip.replace(/\./g, '_')}`,
            name: device.name,
            ip: device.ip,
            type: 'Nanoleaf Device',
            category: 'light',
          }
        });
      });
    }

    res.json({
      success: true,
      found: formattedDevices.length,
      devices: formattedDevices,
      message: formattedDevices.length === 0 ? 'No Nanoleaf devices found. Make sure your devices are connected to the same network.' : undefined
    });
  } catch (error) {
    console.error('Error discovering Nanoleaf devices:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/nanoleaf/authenticate
 * @desc    Authenticate with a Nanoleaf device (requires touch link)
 */
router.post('/authenticate', async (req, res) => {
  if (!NanoleafClient) {
    return res.status(503).json({
      error: 'Nanoleaf package not installed',
      message: 'Install with: npm install nanoleaf-client-multi'
    });
  }

  const { ip, port = 16021 } = req.body;
  
  if (!ip) {
    return res.status(400).json({ error: 'IP address is required' });
  }

  try {
    const client = new NanoleafClient();
    const authToken = await client.authorize(ip, port);
    
    // Store authenticated client
    const authenticatedClient = new NanoleafClient(authToken, ip, port);
    authenticatedClients.set(ip, authenticatedClient);

    res.json({
      success: true,
      authToken: authToken,
      message: 'Authentication successful! Device is now connected.'
    });
  } catch (error) {
    console.error('Nanoleaf authentication error:', error);
    res.status(400).json({ 
      error: 'Authentication failed. Make sure to hold the power button on your Nanoleaf device for 5-7 seconds until the LED starts flashing, then try again within 30 seconds.' 
    });
  }
});

/**
 * @route   POST /api/nanoleaf/connect
 * @desc    Connect with existing auth token
 */
router.post('/connect', async (req, res) => {
  if (!NanoleafClient) {
    return res.status(503).json({
      error: 'Nanoleaf package not installed'
    });
  }

  const { ip, authToken, port = 16021 } = req.body;
  
  if (!ip || !authToken) {
    return res.status(400).json({ error: 'IP address and auth token are required' });
  }

  try {
    const client = new NanoleafClient(authToken, ip, port);
    
    // Test connection
    await client.getAllPanelInfo();
    
    // Store authenticated client
    authenticatedClients.set(ip, client);

    res.json({
      success: true,
      message: 'Connected successfully!'
    });
  } catch (error) {
    console.error('Nanoleaf connection error:', error);
    res.status(400).json({ error: 'Connection failed. Please check your IP and auth token.' });
  }
});

/**
 * @route   GET /api/nanoleaf/:ip/info
 * @desc    Get device information
 */
router.get('/:ip/info', async (req, res) => {
  const { ip } = req.params;
  const client = authenticatedClients.get(ip);
  
  if (!client) {
    return res.status(401).json({ error: 'Device not authenticated. Please authenticate first.' });
  }

  try {
    const info = await client.getAllPanelInfo();
    res.json({ success: true, info });
  } catch (error) {
    console.error('Error getting device info:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/nanoleaf/:ip/state
 * @desc    Get current device state
 */
router.get('/:ip/state', async (req, res) => {
  const { ip } = req.params;
  const client = authenticatedClients.get(ip);
  
  if (!client) {
    return res.status(401).json({ error: 'Device not authenticated. Please authenticate first.' });
  }

  try {
    const state = await client.getPowerStatus();
    const brightness = await client.getBrightness();
    const hue = await client.getHue();
    const saturation = await client.getSaturation();
    const colorTemp = await client.getColorTemperature();
    const currentEffect = await client.getCurrentEffect();
    
    res.json({ 
      success: true, 
      state: {
        power: state.value,
        brightness: brightness.value,
        hue: hue.value,
        saturation: saturation.value,
        colorTemperature: colorTemp.value,
        currentEffect: currentEffect
      }
    });
  } catch (error) {
    console.error('Error getting device state:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/nanoleaf/:ip/power
 * @desc    Control device power
 */
router.post('/:ip/power', async (req, res) => {
  const { ip } = req.params;
  const { state } = req.body;
  const client = authenticatedClients.get(ip);
  
  if (!client) {
    return res.status(401).json({ error: 'Device not authenticated. Please authenticate first.' });
  }

  try {
    await client.setPowerStatus(state);
    res.json({ success: true, message: `Device turned ${state ? 'on' : 'off'}` });
  } catch (error) {
    console.error('Error setting power state:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/nanoleaf/:ip/brightness
 * @desc    Set device brightness
 */
router.post('/:ip/brightness', async (req, res) => {
  const { ip } = req.params;
  const { brightness, duration = 0 } = req.body;
  const client = authenticatedClients.get(ip);
  
  if (!client) {
    return res.status(401).json({ error: 'Device not authenticated. Please authenticate first.' });
  }

  if (brightness < 0 || brightness > 100) {
    return res.status(400).json({ error: 'Brightness must be between 0 and 100' });
  }

  try {
    await client.setBrightness(brightness, duration);
    res.json({ success: true, brightness });
  } catch (error) {
    console.error('Error setting brightness:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/nanoleaf/:ip/color
 * @desc    Set device color (HSL)
 */
router.post('/:ip/color', async (req, res) => {
  const { ip } = req.params;
  const { hue, saturation, lightness, duration = 0 } = req.body;
  const client = authenticatedClients.get(ip);
  
  if (!client) {
    return res.status(401).json({ error: 'Device not authenticated. Please authenticate first.' });
  }

  try {
    if (hue !== undefined) {
      await client.setHue(hue, duration);
    }
    if (saturation !== undefined) {
      await client.setSaturation(saturation, duration);
    }
    if (lightness !== undefined) {
      await client.setBrightness(lightness, duration);
    }
    
    res.json({ success: true, color: { hue, saturation, lightness } });
  } catch (error) {
    console.error('Error setting color:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/nanoleaf/:ip/color-temp
 * @desc    Set color temperature
 */
router.post('/:ip/color-temp', async (req, res) => {
  const { ip } = req.params;
  const { temperature, duration = 0 } = req.body;
  const client = authenticatedClients.get(ip);
  
  if (!client) {
    return res.status(401).json({ error: 'Device not authenticated. Please authenticate first.' });
  }

  if (temperature < 1200 || temperature > 6500) {
    return res.status(400).json({ error: 'Color temperature must be between 1200K and 6500K' });
  }

  try {
    await client.setColorTemperature(temperature, duration);
    res.json({ success: true, temperature });
  } catch (error) {
    console.error('Error setting color temperature:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/nanoleaf/:ip/effects
 * @desc    Get available effects
 */
router.get('/:ip/effects', async (req, res) => {
  const { ip } = req.params;
  const client = authenticatedClients.get(ip);
  
  if (!client) {
    return res.status(401).json({ error: 'Device not authenticated. Please authenticate first.' });
  }

  try {
    const effects = await client.getAllEffects();
    const currentEffect = await client.getCurrentEffect();
    
    res.json({ 
      success: true, 
      effects: effects.animName,
      currentEffect 
    });
  } catch (error) {
    console.error('Error getting effects:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/nanoleaf/:ip/effects/:effectName
 * @desc    Apply an effect
 */
router.post('/:ip/effects/:effectName', async (req, res) => {
  const { ip, effectName } = req.params;
  const client = authenticatedClients.get(ip);
  
  if (!client) {
    return res.status(401).json({ error: 'Device not authenticated. Please authenticate first.' });
  }

  try {
    await client.setCurrentEffect(effectName);
    res.json({ success: true, effect: effectName });
  } catch (error) {
    console.error('Error setting effect:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/nanoleaf/:ip/identify
 * @desc    Identify device (flash)
 */
router.post('/:ip/identify', async (req, res) => {
  const { ip } = req.params;
  const client = authenticatedClients.get(ip);
  
  if (!client) {
    return res.status(401).json({ error: 'Device not authenticated. Please authenticate first.' });
  }

  try {
    await client.identify();
    res.json({ success: true, message: 'Device is flashing to identify itself' });
  } catch (error) {
    console.error('Error identifying device:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;