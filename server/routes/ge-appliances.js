const express = require('express');
const router = express.Router();

let GeHome = null;

// Try to load GE Home package or local service
try {
  try {
    GeHome = require('ge-home');
    console.log('✓ GE Home appliances package loaded successfully');
  } catch (e) {
    // If npm package fails, try local service
    GeHome = require('../services/ge-home');
    console.log('✓ GE Home local service loaded successfully');
  }
} catch (error) {
  console.log('⚠️  GE Home package not installed. Run: npm install ge-home');
}

// Store client instance
let geClient = null;
let appliances = [];

// Initialize GE client with credentials
const initializeClient = async () => {
  if (!GeHome) return null;
  
  const username = process.env.GE_USERNAME;
  const password = process.env.GE_PASSWORD;
  
  if (!username || !password) {
    throw new Error('GE_USERNAME and GE_PASSWORD must be set in .env file');
  }
  
  if (!geClient) {
    geClient = new GeHome.Client(username, password);
    await geClient.login();
  }
  
  return geClient;
};

// Get all appliances
router.get('/appliances', async (req, res) => {
  try {
    if (!GeHome) {
      return res.status(503).json({
        error: 'GE Home package not installed',
        message: 'Install with: npm install ge-home',
        installed: false
      });
    }

    const client = await initializeClient();
    appliances = await client.getAppliances();
    
    const formatted = appliances.map(app => ({
      id: app.applianceId,
      name: app.nickname || app.type,
      type: app.type,
      model: app.model,
      serial: app.serial,
      online: app.online,
      details: app
    }));
    
    // Log discovery
    if (global.activityLog && formatted.length > 0) {
      global.activityLog.discovery('GE Appliances', `Found ${formatted.length} appliance(s)`);
    }
    
    res.json({ appliances: formatted });
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('GE Appliances', `Fetch failed: ${error.message}`);
    }
    res.status(500).json({ error: error.message });
  }
});

// Get refrigerators only
router.get('/refrigerators', async (req, res) => {
  try {
    if (!GeHome) {
      return res.status(503).json({
        error: 'GE Home package not installed',
        installed: false
      });
    }

    const client = await initializeClient();
    appliances = await client.getAppliances();
    
    const fridges = appliances.filter(app => 
      app.type.toLowerCase().includes('fridge') || 
      app.type.toLowerCase().includes('refrigerator')
    ).map(app => ({
      id: app.applianceId,
      name: app.nickname || 'GE Refrigerator',
      model: app.model,
      serial: app.serial,
      online: app.online,
      temperature: app.temperature || {},
      doorStatus: app.doorStatus || 'unknown',
      filterStatus: app.filterStatus || 'unknown',
      details: app
    }));
    
    res.json({ refrigerators: fridges });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific appliance details
router.get('/appliances/:id', async (req, res) => {
  try {
    if (!GeHome) {
      return res.status(503).json({ error: 'Package not installed' });
    }

    const client = await initializeClient();
    const appliance = await client.getAppliance(req.params.id);
    
    res.json({
      id: appliance.applianceId,
      name: appliance.nickname || appliance.type,
      type: appliance.type,
      model: appliance.model,
      online: appliance.online,
      status: appliance.status || {},
      details: appliance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set refrigerator temperature
router.post('/refrigerators/:id/temperature', async (req, res) => {
  try {
    if (!GeHome) {
      return res.status(503).json({ error: 'Package not installed' });
    }

    const { compartment, temperature } = req.body; // compartment: 'fridge' or 'freezer'
    const client = await initializeClient();
    const appliance = await client.getAppliance(req.params.id);
    
    await appliance.setTemperature(compartment, temperature);
    
    res.json({
      status: 'success',
      message: `${compartment} temperature set to ${temperature}°F`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set ice maker mode
router.post('/refrigerators/:id/icemaker', async (req, res) => {
  try {
    if (!GeHome) {
      return res.status(503).json({ error: 'Package not installed' });
    }

    const { mode } = req.body; // 'on', 'off', or 'max'
    const client = await initializeClient();
    const appliance = await client.getAppliance(req.params.id);
    
    await appliance.setIceMaker(mode);
    
    res.json({
      status: 'success',
      message: `Ice maker set to ${mode}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set turbo mode (rapid cooling)
router.post('/refrigerators/:id/turbo', async (req, res) => {
  try {
    if (!GeHome) {
      return res.status(503).json({ error: 'Package not installed' });
    }

    const { enabled } = req.body;
    const client = await initializeClient();
    const appliance = await client.getAppliance(req.params.id);
    
    await appliance.setTurboMode(enabled);
    
    res.json({
      status: 'success',
      message: `Turbo mode ${enabled ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ovens
router.get('/ovens', async (req, res) => {
  try {
    if (!GeHome) {
      return res.status(503).json({ error: 'Package not installed' });
    }

    const client = await initializeClient();
    appliances = await client.getAppliances();
    
    const ovens = appliances.filter(app => 
      app.type.toLowerCase().includes('oven') || 
      app.type.toLowerCase().includes('range')
    ).map(app => ({
      id: app.applianceId,
      name: app.nickname || 'GE Oven',
      model: app.model,
      online: app.online,
      status: app.status || {},
      details: app
    }));
    
    res.json({ ovens });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Control oven
router.post('/ovens/:id/control', async (req, res) => {
  try {
    if (!GeHome) {
      return res.status(503).json({ error: 'Package not installed' });
    }

    const { action, temperature, mode } = req.body;
    const client = await initializeClient();
    const appliance = await client.getAppliance(req.params.id);
    
    if (action === 'preheat') {
      await appliance.preheat(temperature, mode);
      res.json({ status: 'success', message: `Preheating to ${temperature}°F` });
    } else if (action === 'off') {
      await appliance.turnOff();
      res.json({ status: 'success', message: 'Oven turned off' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dishwashers
router.get('/dishwashers', async (req, res) => {
  try {
    if (!GeHome) {
      return res.status(503).json({ error: 'Package not installed' });
    }

    const client = await initializeClient();
    appliances = await client.getAppliances();
    
    const dishwashers = appliances.filter(app => 
      app.type.toLowerCase().includes('dishwasher')
    ).map(app => ({
      id: app.applianceId,
      name: app.nickname || 'GE Dishwasher',
      model: app.model,
      online: app.online,
      status: app.status || {},
      details: app
    }));
    
    res.json({ dishwashers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get washers/dryers
router.get('/laundry', async (req, res) => {
  try {
    if (!GeHome) {
      return res.status(503).json({ error: 'Package not installed' });
    }

    const client = await initializeClient();
    appliances = await client.getAppliances();
    
    const laundry = appliances.filter(app => 
      app.type.toLowerCase().includes('washer') || 
      app.type.toLowerCase().includes('dryer')
    ).map(app => ({
      id: app.applianceId,
      name: app.nickname || app.type,
      model: app.model,
      online: app.online,
      status: app.status || {},
      details: app
    }));
    
    res.json({ laundry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
