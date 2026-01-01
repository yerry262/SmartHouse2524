const express = require('express');
const router = express.Router();

// Gracefully load WeMo package
let Wemo = null;
try {
  Wemo = require('wemo-client');
  console.log('✓ WeMo package loaded successfully');
} catch (error) {
  console.log('⚠️ WeMo package (wemo-client) not installed. Run: npm install wemo-client');
}

// Global client instance
let wemo = null;
const discoveredDevices = new Map(); // Map<host, { info: Object, client: Object }>

// Initialize client if package is available
if (Wemo) {
  wemo = new Wemo();
  
  // Start discovery
  // WeMo discovery is continuous once started
  try {
    wemo.discover((err, deviceInfo) => {
      if (err) {
        if (global.activityLog) global.activityLog.error('WeMo', `Discovery error: ${err.message}`);
        return;
      }

      if (global.activityLog) {
        global.activityLog.discovery('WeMo', `Found device: ${deviceInfo.friendlyName}`, { ip: deviceInfo.host });
      }
      
      // Create a client for the device
      const client = wemo.client(deviceInfo);
      
      // Handle errors to prevent crashes
      client.on('error', (err) => {
        if (global.activityLog) global.activityLog.warning('WeMo', `${deviceInfo.friendlyName}: ${err.code || err.message}`);
      });

      // Store device info and client
      discoveredDevices.set(deviceInfo.host, {
        info: deviceInfo,
        client: client,
        state: { binaryState: 0 } // Default state
      });

      // Listen for state changes
      client.on('binaryState', (value) => {
        const stateName = value === '1' || value === 1 ? 'ON' : 'OFF';
        if (global.activityLog) {
          global.activityLog.device('WeMo', `${deviceInfo.friendlyName} turned ${stateName}`, { ip: deviceInfo.host, state: value });
        }
        if (discoveredDevices.has(deviceInfo.host)) {
          discoveredDevices.get(deviceInfo.host).state.binaryState = value;
        }
        
        if (global.broadcast) {
          global.broadcast({
            type: 'wemo_device_update',
            device: {
              host: deviceInfo.host,
              friendlyName: deviceInfo.friendlyName,
              binaryState: value
            }
          });
        }
      });

      // Get initial state
      client.getBinaryState((err, value) => {
        if (!err && discoveredDevices.has(deviceInfo.host)) {
          discoveredDevices.get(deviceInfo.host).state.binaryState = value;
        }
      });

      if (global.broadcast) {
        global.broadcast({
          type: 'wemo_device_discovered',
          device: {
            host: deviceInfo.host,
            friendlyName: deviceInfo.friendlyName,
            modelName: deviceInfo.modelName,
            binaryState: 0
          }
        });
      }
    });
  } catch (e) {
    console.log('Error starting WeMo discovery:', e);
  }
}

// POST endpoint for manual discovery trigger (re-scan not really applicable for WeMo as it's continuous, but we can return current list)
router.post('/discover', async (req, res) => {
  if (!Wemo) {
    return res.status(503).json({
      error: 'WeMo package not installed',
      message: 'Install with: npm install wemo-client',
      installed: false
    });
  }

  // Return currently discovered devices
  const devices = Array.from(discoveredDevices.values()).map(d => ({
    host: d.info.host,
    port: d.info.port,
    friendlyName: d.info.friendlyName,
    modelName: d.info.modelName,
    serialNumber: d.info.serialNumber,
    binaryState: d.state.binaryState
  }));

  res.json({
    success: true,
    found: devices.length,
    devices
  });
});

/**
 * @route   GET /api/wemo/discover
 * @desc    Get all discovered WeMo devices
 */
router.get('/discover', async (req, res) => {
  if (!Wemo) {
    return res.status(503).json({
      error: 'WeMo package not installed',
      message: 'Install with: npm install wemo-client',
      installed: false
    });
  }

  const devices = Array.from(discoveredDevices.values()).map(d => ({
    host: d.info.host,
    port: d.info.port,
    friendlyName: d.info.friendlyName,
    modelName: d.info.modelName,
    serialNumber: d.info.serialNumber,
    binaryState: d.state.binaryState
  }));

  res.json({
    success: true,
    count: devices.length,
    devices
  });
});

/**
 * @route   POST /api/wemo/:host/power
 * @desc    Toggle power state
 */
router.post('/:host/power', async (req, res) => {
  const { host } = req.params;
  const { state } = req.body; // true/false or 1/0

  const device = discoveredDevices.get(host);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  try {
    const binaryState = state ? 1 : 0;
    device.client.setBinaryState(binaryState, (err, response) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Update local state
      device.state.binaryState = binaryState;
      
      res.json({
        success: true,
        state: binaryState
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/wemo/:host/info
 * @desc    Get device info
 */
router.get('/:host/info', async (req, res) => {
  const { host } = req.params;
  const device = discoveredDevices.get(host);
  
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  res.json({
    ...device.info,
    binaryState: device.state.binaryState
  });
});

// Get device status and details
router.get('/:host/status', async (req, res) => {
  if (!Wemo) {
    return res.status(503).json({
      error: 'WeMo package not installed'
    });
  }

  const host = req.params.host;
  if (!discoveredDevices.has(host)) {
    return res.status(404).json({ error: 'Device not found' });
  }

  try {
    const deviceData = discoveredDevices.get(host);
    const { client, info, state } = deviceData;
    
    // Get fresh state
    client.getBinaryState((err, value) => {
      if (!err) {
        deviceData.state.binaryState = value;
      }
      
      res.json({
        host: info.host,
        friendlyName: info.friendlyName,
        modelName: info.modelName,
        deviceType: info.deviceType,
        serialNumber: info.serialNumber,
        manufacturer: info.manufacturer,
        binaryState: state.binaryState,
        lastUpdate: new Date().toISOString()
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all devices with current status
router.get('/status/all', async (req, res) => {
  if (!Wemo) {
    return res.status(503).json({
      error: 'WeMo package not installed',
      devices: []
    });
  }

  const devicesStatus = [];
  
  for (const [host, deviceData] of discoveredDevices.entries()) {
    const { info, state } = deviceData;
    devicesStatus.push({
      host: info.host,
      friendlyName: info.friendlyName,
      modelName: info.modelName,
      deviceType: info.deviceType,
      binaryState: state.binaryState,
      online: true
    });
  }
  
  res.json({
    devices: devicesStatus,
    count: devicesStatus.length
  });
});

module.exports = router;
