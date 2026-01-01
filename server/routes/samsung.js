const express = require('express');
const router = express.Router();
const http = require('http');

let SamsungTvControl = null;

// Try to load Samsung TV package
try {
  SamsungTvControl = require('samsung-tv-control').default;
  console.log('✓ Samsung TV Control package loaded');
} catch (error) {
  console.log('⚠️  Samsung TV Control package not installed. Run: npm install samsung-tv-control');
}

// Discovered Samsung TVs
let discoveredTVs = [];

// Store tokens and MACs for persistent connections
const tvTokens = new Map();
const tvMacs = new Map();

// Helper to check if TV is reachable via HTTP
const checkTvReachable = (ip, port = 8001) => {
  return new Promise((resolve) => {
    const req = http.get(`http://${ip}:${port}/api/v2/`, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ online: true, info: JSON.parse(data) });
        } catch {
          resolve({ online: true, info: null });
        }
      });
    });
    req.on('error', () => resolve({ online: false, info: null }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ online: false, info: null });
    });
  });
};

// Helper to create TV instance with stored token
const createTvInstance = (ip, mac = '') => {
  if (!SamsungTvControl) return null;
  
  const storedToken = tvTokens.get(ip) || '';
  const storedMac = tvMacs.get(ip) || mac || '00:00:00:00:00:00';
  return new SamsungTvControl({
    ip,
    mac: storedMac,
    nameApp: 'SmartHouse2524',
    port: 8002,
    token: storedToken
  });
};

// Discover Samsung TVs
const discoverHandler = async (req, res) => {
  try {
    // Also scan for any manually registered TVs that are online
    const onlineTVs = [];
    for (const tv of discoveredTVs) {
      const check = await checkTvReachable(tv.ip);
      onlineTVs.push({
        ...tv,
        online: check.online,
        info: check.info
      });
    }
    
    res.json({
      success: true,
      message: 'Samsung TVs list',
      found: onlineTVs.length,
      tvs: onlineTVs,
      instructions: 'Add TVs manually using POST /api/samsung/register or they will be auto-discovered via SSDP',
      packageInstalled: !!SamsungTvControl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

router.get('/discover', discoverHandler);
router.post('/discover', discoverHandler);

// Register a TV manually
router.post('/register', async (req, res) => {
  try {
    const { ip, name, mac } = req.body;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }
    
    // Check if TV is reachable
    const check = await checkTvReachable(ip);
    
    // Store MAC if provided
    if (mac) {
      tvMacs.set(ip, mac);
    }
    
    // Add to discovered list if not already there
    const existingIndex = discoveredTVs.findIndex(tv => tv.ip === ip);
    const tvData = {
      ip,
      name: name || check.info?.device?.name || `Samsung TV - ${ip}`,
      mac: mac || check.info?.device?.wifiMac || null,
      model: check.info?.device?.modelName || null,
      online: check.online,
      manual: true,
      addedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      discoveredTVs[existingIndex] = { ...discoveredTVs[existingIndex], ...tvData };
    } else {
      discoveredTVs.push(tvData);
    }
    
    // Log the registration
    if (global.activityLog) {
      const status = check.online ? 'online' : 'offline';
      global.activityLog.discovery('Samsung TV', `Registered ${tvData.name} (${status})`, { ip, online: check.online });
    }
    
    res.json({
      success: true,
      message: check.online ? 'TV registered and online' : 'TV registered but currently offline',
      tv: tvData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a TV
router.delete('/register/:ip', async (req, res) => {
  try {
    const ip = req.params.ip;
    const index = discoveredTVs.findIndex(tv => tv.ip === ip);
    
    if (index >= 0) {
      discoveredTVs.splice(index, 1);
      tvTokens.delete(ip);
      tvMacs.delete(ip);
      if (global.activityLog) {
        global.activityLog.info('Samsung TV', `Removed TV at ${ip}`);
      }
    }
    
    res.json({ success: true, message: 'TV removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get TV status
router.get('/:ip/status', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // First try HTTP API check (works without MAC)
    const httpCheck = await checkTvReachable(req.params.ip);
    const responseTime = Date.now() - startTime;
    
    if (httpCheck.online) {
      // Extract device info if available
      const deviceInfo = httpCheck.info?.device || httpCheck.info;
      
      return res.json({
        ip: req.params.ip,
        online: true,
        responseTime,
        name: deviceInfo?.name || deviceInfo?.ModelName || 'Samsung TV',
        model: deviceInfo?.modelName || deviceInfo?.ModelName,
        id: deviceInfo?.id,
        wifiMac: deviceInfo?.wifiMac,
        deviceInfo: deviceInfo,
        message: 'TV is online and responding',
        packageInstalled: !!SamsungTvControl,
        timestamp: new Date().toISOString()
      });
    }
    
    // TV not reachable via HTTP
    res.json({
      ip: req.params.ip,
      online: false,
      responseTime,
      message: 'TV is offline or not reachable. Make sure TV is on and connected to the network.',
      packageInstalled: !!SamsungTvControl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      ip: req.params.ip,
      online: false
    });
  }
});

// Send key command
router.post('/:ip/key', async (req, res) => {
  try {
    if (!SamsungTvControl) {
      return res.status(400).json({ error: 'Samsung TV Control package not installed' });
    }
    const { key } = req.body; // KEY_POWER, KEY_VOLUP, KEY_VOLDOWN, KEY_MUTE, etc.
    
    if (!key) {
      return res.status(400).json({ error: 'Key parameter is required' });
    }
    
    const tv = createTvInstance(req.params.ip, req.query.mac);

    await tv.sendKey(key);
    
    // Log the action
    if (global.activityLog) {
      const keyName = key.replace('KEY_', '');
      global.activityLog.action('Samsung TV', `Sent ${keyName} command`, { ip: req.params.ip, key });
    }
    
    res.json({
      success: true,
      status: 'sent',
      key,
      ip: req.params.ip,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      key: req.body.key,
      ip: req.params.ip
    });
  }
});

// Launch app
router.post('/:ip/app', async (req, res) => {
  try {
    if (!SamsungTvControl) {
      return res.status(400).json({ error: 'Samsung TV Control package not installed' });
    }
    const { appId } = req.body; // Netflix, YouTube, etc.
    
    if (!appId) {
      return res.status(400).json({ error: 'appId parameter is required' });
    }
    
    const tv = createTvInstance(req.params.ip, req.query.mac);

    await tv.openApp(appId);
    
    // Log the action
    if (global.activityLog) {
      global.activityLog.action('Samsung TV', `📺 Launched app: ${appId}`, { ip: req.params.ip });
    }
    
    res.json({
      success: true,
      status: 'launched',
      appId,
      ip: req.params.ip,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('Samsung TV', `App launch failed: ${error.message}`);
    }
    res.status(500).json({ 
      error: error.message,
      appId: req.body.appId,
      ip: req.params.ip
    });
  }
});

// Get installed apps
router.get('/:ip/apps', async (req, res) => {
  try {
    if (!SamsungTvControl) {
      return res.status(400).json({ error: 'Samsung TV Control package not installed' });
    }
    
    const tv = createTvInstance(req.params.ip, req.query.mac);

    const apps = await tv.getAppsFromTV();
    
    res.json({
      success: true,
      apps: apps || [],
      count: apps?.length || 0,
      ip: req.params.ip,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      ip: req.params.ip,
      apps: []
    });
  }
});

// Wake on LAN (if TV supports it)
router.post('/:ip/wake', async (req, res) => {
  try {
    const { mac } = req.body;
    
    if (!mac) {
      return res.status(400).json({ error: 'MAC address is required for Wake on LAN' });
    }
    
    // Samsung TVs can be woken via WoL if enabled
    const wol = require('wake_on_lan');
    
    wol.wake(mac, (error) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json({
        success: true,
        message: 'Wake on LAN packet sent',
        mac,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      message: 'Wake on LAN requires wake_on_lan package: npm install wake_on_lan'
    });
  }
});

// Store/update token for a TV
router.post('/:ip/token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (token) {
      tvTokens.set(req.params.ip, token);
    }
    
    res.json({
      success: true,
      message: token ? 'Token stored' : 'Token cleared',
      ip: req.params.ip
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
