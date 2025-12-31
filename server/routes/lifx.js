const express = require('express');
const router = express.Router();

let LifxClient = null;
let client = null;

// Try to load LIFX package
try {
  LifxClient = require('lifx-lan-client').Client;
  client = new LifxClient();
  console.log('✓ LIFX package loaded successfully');
} catch (error) {
  console.log('⚠️ LIFX package not installed. Run: npm install lifx-lan-client');
}

// Store discovered lights
const lightsMap = new Map();

// Initialize client if available
if (client) {
  client.on('light-new', (light) => {
    console.log(`New LIFX light discovered: ${light.label || light.id}`);
    lightsMap.set(light.id, light);
    
    // Broadcast to WebSocket clients
    if (global.broadcast) {
      global.broadcast({
        type: 'lifx-light-discovered',
        light: {
          id: light.id,
          label: light.label,
          address: light.address
        }
      });
    }
  });

  client.on('light-offline', (light) => {
    console.log(`LIFX light offline: ${light.label || light.id}`);
    lightsMap.delete(light.id);
  });

  client.on('light-online', (light) => {
    console.log(`LIFX light online: ${light.label || light.id}`);
    lightsMap.set(light.id, light);
  });

  // Start discovery
  client.init({
    startDiscovery: true,
    discoveryInterval: 5000
  });
}

// Helper to get light by ID or label
function getLight(identifier) {
  if (!client) return null;
  
  // Try by ID first
  if (lightsMap.has(identifier)) {
    return lightsMap.get(identifier);
  }
  
  // Try by label or address
  for (const light of lightsMap.values()) {
    if (light.label === identifier || light.address === identifier) {
      return light;
    }
  }
  
  return null;
}

// Discover LIFX lights
router.get('/discover', async (req, res) => {
  try {
    if (!LifxClient) {
      return res.status(503).json({
        error: 'LIFX package not installed',
        message: 'Install with: npm install lifx-lan-client',
        installed: false
      });
    }

    const lights = Array.from(lightsMap.values()).map(light => ({
      id: light.id,
      label: light.label,
      address: light.address
    }));

    res.json({
      success: true,
      count: lights.length,
      lights: lights,
      message: 'LIFX lights are discovered automatically. Discovery runs every 5 seconds.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Also support POST for discover
router.post('/discover', async (req, res) => {
  try {
    if (!LifxClient) {
      return res.status(503).json({
        error: 'LIFX package not installed',
        message: 'Install with: npm install lifx-lan-client',
        installed: false
      });
    }

    const lights = Array.from(lightsMap.values()).map(light => ({
      id: light.id,
      label: light.label,
      address: light.address
    }));

    // Broadcast discoveries
    if (global.broadcast && lights.length > 0) {
      lights.forEach(light => {
        global.broadcast({
          type: 'device_discovered',
          device: {
            id: `lifx_${light.id}`,
            name: light.label || `LIFX Light ${light.id}`,
            ip: light.address,
            type: 'LIFX Bulb',
            category: 'light',
          }
        });
      });
    }

    res.json({
      success: true,
      found: lights.length,
      lights: lights,
      message: 'LIFX lights are discovered automatically. Discovery runs every 5 seconds.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all lights
router.get('/lights', async (req, res) => {
  try {
    if (!client) {
      return res.json({ error: 'LIFX package not installed', lights: [] });
    }

    const lights = Array.from(lightsMap.values()).map(light => ({
      id: light.id,
      label: light.label,
      address: light.address
    }));

    res.json({ lights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific light state
router.get('/lights/:id/state', async (req, res) => {
  try {
    if (!client) {
      return res.json({ error: 'LIFX package not installed' });
    }

    const light = getLight(req.params.id);
    if (!light) {
      return res.status(404).json({ error: 'Light not found' });
    }

    light.getState((err, data) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          id: light.id,
          label: light.label,
          power: data.power,
          color: data.color
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Turn light on
router.post('/lights/:id/on', async (req, res) => {
  try {
    if (!client) {
      return res.json({ error: 'LIFX package not installed' });
    }

    const { duration } = req.body;
    const light = getLight(req.params.id);
    
    if (!light) {
      return res.status(404).json({ error: 'Light not found' });
    }

    light.on(duration || 0, (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          success: true,
          message: 'Light turned on',
          id: light.id
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Turn light off
router.post('/lights/:id/off', async (req, res) => {
  try {
    if (!client) {
      return res.json({ error: 'LIFX package not installed' });
    }

    const { duration } = req.body;
    const light = getLight(req.params.id);
    
    if (!light) {
      return res.status(404).json({ error: 'Light not found' });
    }

    light.off(duration || 0, (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          success: true,
          message: 'Light turned off',
          id: light.id
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set light color (HSB)
router.post('/lights/:id/color', async (req, res) => {
  try {
    if (!client) {
      return res.json({ error: 'LIFX package not installed' });
    }

    const { hue, saturation, brightness, kelvin, duration } = req.body;
    const light = getLight(req.params.id);
    
    if (!light) {
      return res.status(404).json({ error: 'Light not found' });
    }

    // Validate parameters
    if (hue === undefined || saturation === undefined || brightness === undefined) {
      return res.status(400).json({ 
        error: 'Missing required parameters: hue, saturation, brightness' 
      });
    }

    light.color(
      hue, 
      saturation, 
      brightness, 
      kelvin || 3500, 
      duration || 0, 
      (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json({
            success: true,
            message: 'Color set',
            id: light.id,
            color: { hue, saturation, brightness, kelvin: kelvin || 3500 }
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set light color (RGB)
router.post('/lights/:id/color-rgb', async (req, res) => {
  try {
    if (!client) {
      return res.json({ error: 'LIFX package not installed' });
    }

    const { red, green, blue, duration } = req.body;
    const light = getLight(req.params.id);
    
    if (!light) {
      return res.status(404).json({ error: 'Light not found' });
    }

    if (red === undefined || green === undefined || blue === undefined) {
      return res.status(400).json({ 
        error: 'Missing required parameters: red, green, blue' 
      });
    }

    light.colorRgb(red, green, blue, duration || 0, (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          success: true,
          message: 'Color set',
          id: light.id,
          rgb: { red, green, blue }
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set light color (Hex)
router.post('/lights/:id/color-hex', async (req, res) => {
  try {
    if (!client) {
      return res.json({ error: 'LIFX package not installed' });
    }

    const { hex, duration } = req.body;
    const light = getLight(req.params.id);
    
    if (!light) {
      return res.status(404).json({ error: 'Light not found' });
    }

    if (!hex) {
      return res.status(400).json({ error: 'Missing required parameter: hex' });
    }

    light.colorRgbHex(hex, duration || 0, (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          success: true,
          message: 'Color set',
          id: light.id,
          hex: hex
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set light label
router.post('/lights/:id/label', async (req, res) => {
  try {
    if (!client) {
      return res.json({ error: 'LIFX package not installed' });
    }

    const { label } = req.body;
    const light = getLight(req.params.id);
    
    if (!light) {
      return res.status(404).json({ error: 'Light not found' });
    }

    if (!label) {
      return res.status(400).json({ error: 'Missing required parameter: label' });
    }

    light.setLabel(label, (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          success: true,
          message: 'Label updated',
          id: light.id,
          label: label
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply waveform effect
router.post('/lights/:id/waveform', async (req, res) => {
  try {
    if (!client) {
      return res.json({ error: 'LIFX package not installed' });
    }

    const {
      hue,
      saturation,
      brightness,
      kelvin,
      transient,
      period,
      cycles,
      skewRatio,
      waveform
    } = req.body;
    
    const light = getLight(req.params.id);
    
    if (!light) {
      return res.status(404).json({ error: 'Light not found' });
    }

    light.waveform(
      hue || 0,
      saturation || 100,
      brightness || 50,
      kelvin || 3500,
      transient || false,
      period || 500,
      cycles || 5,
      skewRatio || 0.5,
      waveform || 1, // SINE
      (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json({
            success: true,
            message: 'Waveform effect applied',
            id: light.id
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get light hardware version
router.get('/lights/:id/hardware', async (req, res) => {
  try {
    if (!client) {
      return res.json({ error: 'LIFX package not installed' });
    }

    const light = getLight(req.params.id);
    
    if (!light) {
      return res.status(404).json({ error: 'Light not found' });
    }

    light.getHardwareVersion((err, data) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(data);
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
