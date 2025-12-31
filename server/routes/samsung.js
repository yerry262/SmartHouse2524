const express = require('express');
const router = express.Router();

let SamsungTvControl = null;

// Try to load Samsung TV package
try {
  SamsungTvControl = require('samsung-tv-control').default;
} catch (error) {
  console.log('⚠️  Samsung TV Control package not installed. Run: npm install samsung-tv-control');
}

// Discovered Samsung TVs
let discoveredTVs = [];

// Discover Samsung TVs
const discoverHandler = async (req, res) => {
  try {
    // Samsung TVs are discovered via main device discovery (SSDP)
    // Check for Samsung TV devices in the main discovery results
    res.json({
      success: true,
      message: 'Samsung TVs are discovered via SSDP in main device discovery',
      found: discoveredTVs.length,
      tvs: discoveredTVs,
      instructions: 'Samsung TVs appear automatically in main device list'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

router.get('/discover', discoverHandler);
router.post('/discover', discoverHandler);

// Get TV status
router.get('/:ip/status', async (req, res) => {
  try {
    if (!SamsungTvControl) {
      return res.json({ message: 'Samsung TV Control package not installed', online: false });
    }
    const tv = new SamsungTvControl({
      ip: req.params.ip,
      mac: req.query.mac || '',
      nameApp: 'SmartHouse2524',
      port: 8002,
      token: req.query.token || ''
    });

    const isAlive = await tv.isAvaliable();
    
    res.json({
      ip: req.params.ip,
      online: isAlive,
      message: 'First connection requires accepting prompt on TV'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send key command
router.post('/:ip/key', async (req, res) => {
  try {
    if (!SamsungTvControl) {
      return res.json({ error: 'Samsung TV Control package not installed' });
    }
    const { key } = req.body; // KEY_POWER, KEY_VOLUP, KEY_VOLDOWN, KEY_MUTE, etc.
    
    const tv = new SamsungTvControl({
      ip: req.params.ip,
      mac: req.query.mac || '',
      nameApp: 'SmartHouse2524',
      port: 8002,
      token: req.query.token || ''
    });

    await tv.sendKey(key);
    
    res.json({
      status: 'success',
      key
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Launch app
router.post('/:ip/app', async (req, res) => {
  try {
    const { appId } = req.body; // Netflix, YouTube, etc.
    
    const tv = new SamsungTvControl({
      ip: req.params.ip,
      mac: req.query.mac || '',
      nameApp: 'SmartHouse2524',
      port: 8002,
      token: req.query.token || ''
    });

    await tv.openApp(appId);
    
    res.json({
      status: 'success',
      app: appId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get installed apps
router.get('/:ip/apps', async (req, res) => {
  try {
    const tv = new SamsungTvControl({
      ip: req.params.ip,
      mac: req.query.mac || '',
      nameApp: 'SmartHouse2524',
      port: 8002,
      token: req.query.token || ''
    });

    const apps = await tv.getAppsFromTV();
    
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
