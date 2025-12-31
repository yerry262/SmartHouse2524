const express = require('express');
const router = express.Router();

// Gracefully load TP-Link package
let Client = null;
try {
  const tplink = require('tplink-smarthome-api');
  Client = tplink.Client;
  console.log('✓ TP-Link Smart Home package loaded successfully');
} catch (error) {
  console.log('⚠️ TP-Link package (tplink-smarthome-api) not installed. Run: npm install tplink-smarthome-api');
}

// Global client instance
let tplinkClient = null;
const discoveredDevices = new Map();

// Initialize client if package is available
if (Client) {
  tplinkClient = new Client();
  
  // Start discovery and maintain device list
  tplinkClient.startDiscovery({
    deviceTypes: ['plug', 'bulb'],
    discoveryInterval: 10000,
    offlineTolerance: 3
  });

  tplinkClient.on('device-new', (device) => {
    console.log(`TP-Link: New device found - ${device.alias} (${device.host})`);
    discoveredDevices.set(device.host, device);
    
    if (global.broadcast) {
      global.broadcast({
        type: 'tplink_device_discovered',
        device: {
          host: device.host,
          alias: device.alias,
          deviceType: device.deviceType,
          model: device.model
        }
      });
    }
  });

  tplinkClient.on('device-online', (device) => {
    console.log(`TP-Link: Device online - ${device.alias}`);
    discoveredDevices.set(device.host, device);
  });
}

// POST endpoint for manual discovery trigger
router.post('/discover', async (req, res) => {
  if (!tplinkClient) {
    return res.status(503).json({
      error: 'TP-Link package not installed',
      message: 'Install with: npm install tplink-smarthome-api',
      installed: false
    });
  }

  try {
    // Trigger a discovery scan
    await tplinkClient.startDiscovery({
      deviceTypes: ['plug', 'bulb'],
      discoveryTimeout: 5000
    });

    // Wait a bit for devices to respond
    await new Promise(resolve => setTimeout(resolve, 6000));

    const devices = Array.from(discoveredDevices.values()).map(device => ({
      host: device.host,
      alias: device.alias,
      deviceType: device.deviceType,
      model: device.model
    }));

    res.json({
      success: true,
      found: devices.length,
      devices
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

if (Client) {

  tplinkClient.on('device-offline', (device) => {
    console.log(`TP-Link: Device offline - ${device.alias}`);
  });
}

/**
 * @route   GET /api/tplink/discover
 * @desc    Get all discovered TP-Link devices
 */
router.get('/discover', async (req, res) => {
  if (!Client) {
    return res.status(503).json({
      error: 'TP-Link package not installed',
      message: 'Install with: npm install tplink-smarthome-api',
      installed: false
    });
  }

  try {
    const devices = Array.from(discoveredDevices.values()).map(device => ({
      host: device.host,
      alias: device.alias,
      deviceType: device.deviceType,
      model: device.model,
      deviceId: device.deviceId,
      softwareVersion: device.softwareVersion,
      hardwareVersion: device.hardwareVersion
    }));

    res.json({
      success: true,
      count: devices.length,
      devices: devices
    });
  } catch (error) {
    console.error('Error discovering TP-Link devices:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/tplink/:host
 * @desc    Get device info by host/IP
 */
router.get('/:host', async (req, res) => {
  if (!tplinkClient) {
    return res.status(503).json({ error: 'TP-Link package not installed', installed: false });
  }

  const { host } = req.params;

  try {
    const device = await tplinkClient.getDevice({ host });
    const sysInfo = await device.getSysInfo();

    res.json({
      success: true,
      device: {
        host: device.host,
        alias: device.alias,
        deviceType: device.deviceType,
        model: device.model,
        sysInfo: sysInfo
      }
    });
  } catch (error) {
    console.error('Error getting TP-Link device:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/tplink/:host/power
 * @desc    Turn device on/off
 * @body    { state: true/false }
 */
router.post('/:host/power', async (req, res) => {
  if (!tplinkClient) {
    return res.status(503).json({ error: 'TP-Link package not installed', installed: false });
  }

  const { host } = req.params;
  const { state } = req.body;

  if (typeof state !== 'boolean') {
    return res.status(400).json({ error: 'State must be boolean (true/false)' });
  }

  try {
    const device = await tplinkClient.getDevice({ host });
    await device.setPowerState(state);

    if (global.broadcast) {
      global.broadcast({
        type: 'tplink_power_update',
        host: host,
        state: state
      });
    }

    res.json({
      success: true,
      host: host,
      alias: device.alias,
      powerState: state
    });
  } catch (error) {
    console.error('Error setting TP-Link power state:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/tplink/:host/brightness
 * @desc    Set bulb brightness (0-100)
 * @body    { brightness: 0-100 }
 */
router.post('/:host/brightness', async (req, res) => {
  if (!tplinkClient) {
    return res.status(503).json({ error: 'TP-Link package not installed', installed: false });
  }

  const { host } = req.params;
  const { brightness } = req.body;

  if (typeof brightness !== 'number' || brightness < 0 || brightness > 100) {
    return res.status(400).json({ error: 'Brightness must be between 0 and 100' });
  }

  try {
    const device = await tplinkClient.getDevice({ host });
    
    if (device.deviceType !== 'bulb') {
      return res.status(400).json({ error: 'This device is not a bulb' });
    }

    await device.lighting.setLightState({ brightness: brightness });

    res.json({
      success: true,
      host: host,
      alias: device.alias,
      brightness: brightness
    });
  } catch (error) {
    console.error('Error setting TP-Link brightness:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/tplink/:host/color
 * @desc    Set bulb color (hue, saturation, brightness)
 * @body    { hue: 0-360, saturation: 0-100, brightness: 0-100 }
 */
router.post('/:host/color', async (req, res) => {
  if (!tplinkClient) {
    return res.status(503).json({ error: 'TP-Link package not installed', installed: false });
  }

  const { host } = req.params;
  const { hue, saturation, brightness } = req.body;

  try {
    const device = await tplinkClient.getDevice({ host });
    
    if (device.deviceType !== 'bulb') {
      return res.status(400).json({ error: 'This device is not a bulb' });
    }

    const colorState = {};
    if (typeof hue === 'number') colorState.hue = hue;
    if (typeof saturation === 'number') colorState.saturation = saturation;
    if (typeof brightness === 'number') colorState.brightness = brightness;

    await device.lighting.setLightState(colorState);

    res.json({
      success: true,
      host: host,
      alias: device.alias,
      color: colorState
    });
  } catch (error) {
    console.error('Error setting TP-Link color:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/tplink/:host/temperature
 * @desc    Set bulb color temperature in Kelvin
 * @body    { temperature: 2500-9000 }
 */
router.post('/:host/temperature', async (req, res) => {
  if (!tplinkClient) {
    return res.status(503).json({ error: 'TP-Link package not installed', installed: false });
  }

  const { host } = req.params;
  const { temperature } = req.body;

  try {
    const device = await tplinkClient.getDevice({ host });
    
    if (device.deviceType !== 'bulb') {
      return res.status(400).json({ error: 'This device is not a bulb' });
    }

    await device.lighting.setLightState({ color_temp: temperature });

    res.json({
      success: true,
      host: host,
      alias: device.alias,
      temperature: temperature
    });
  } catch (error) {
    console.error('Error setting TP-Link color temperature:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/tplink/:host/emeter
 * @desc    Get energy meter data (for plugs with energy monitoring)
 */
router.get('/:host/emeter', async (req, res) => {
  if (!tplinkClient) {
    return res.status(503).json({ error: 'TP-Link package not installed', installed: false });
  }

  const { host } = req.params;

  try {
    const device = await tplinkClient.getDevice({ host });
    
    if (!device.emeter) {
      return res.status(400).json({ error: 'This device does not have energy monitoring' });
    }

    const realtime = await device.emeter.getRealtime();
    const dayStats = await device.emeter.getDayStats(new Date().getFullYear(), new Date().getMonth() + 1);

    res.json({
      success: true,
      host: host,
      alias: device.alias,
      realtime: realtime,
      dayStats: dayStats
    });
  } catch (error) {
    console.error('Error getting TP-Link energy data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/tplink/:host/led
 * @desc    Turn device LED indicator on/off
 * @body    { state: true/false }
 */
router.post('/:host/led', async (req, res) => {
  if (!tplinkClient) {
    return res.status(503).json({ error: 'TP-Link package not installed', installed: false });
  }

  const { host } = req.params;
  const { state } = req.body;

  if (typeof state !== 'boolean') {
    return res.status(400).json({ error: 'State must be boolean (true/false)' });
  }

  try {
    const device = await tplinkClient.getDevice({ host });
    await device.setLedState(state);

    res.json({
      success: true,
      host: host,
      alias: device.alias,
      ledState: state
    });
  } catch (error) {
    console.error('Error setting TP-Link LED state:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
