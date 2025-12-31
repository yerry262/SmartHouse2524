const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const util = require('util');
const dns = require('dns').promises;
const execPromise = util.promisify(exec);

// Store discovered Apple TVs
let discoveredAppleTVs = [];

// Check if pyatv is installed
let pyatvInstalled = false;
execPromise('pyatv --version').then(() => {
  pyatvInstalled = true;
  console.log('✅ pyatv is installed');
}).catch(() => {
  console.log('⚠️  pyatv not installed. Run: pip install pyatv');
});

// Dynamic discovery of Apple TVs
const discoverAppleTVs = async () => {
  const devices = [];
  
  // Try to find Apple TVs by hostname patterns
  const hostnamePatterns = [
    'appletv', 'apple-tv', 'atv', 'livingroom-tv', 'bedroom-tv'
  ];
  
  for (const pattern of hostnamePatterns) {
    try {
      // Try both with and without .local
      for (const suffix of ['', '.local']) {
        const hostname = pattern + suffix;
        try {
          const addresses = await dns.resolve4(hostname);
          if (addresses && addresses.length > 0) {
            const ip = addresses[0];
            devices.push({
              id: `appletv_${ip.replace(/\./g, '_')}`,
              name: hostname,
              ip,
              type: 'Apple TV',
              discoveredBy: 'hostname',
            });
          }
        } catch (e) {
          // Hostname not found, continue
        }
      }
    } catch (error) {
      // Continue to next pattern
    }
  }
  
  // Also try pyatv scan if installed
  if (pyatvInstalled) {
    try {
      const { stdout } = await execPromise('atvremote scan', { timeout: 5000 });
      // Parse pyatv scan output
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('Name:')) {
          const name = line.split('Name:')[1]?.trim();
          const ipMatch = lines.find(l => l.includes('Address:'));
          if (ipMatch) {
            const ip = ipMatch.split('Address:')[1]?.trim();
            if (ip && name) {
              devices.push({
                id: `appletv_${ip.replace(/\./g, '_')}`,
                name,
                ip,
                type: 'Apple TV',
                discoveredBy: 'pyatv',
              });
            }
          }
        }
      }
    } catch (error) {
      // pyatv scan failed
    }
  }
  
  return devices;
};

// Get all Apple TVs
router.get('/devices', async (req, res) => {
  try {
    const devices = await discoverAppleTVs();
    discoveredAppleTVs = devices;
    res.json({ devices, pyatvInstalled });
  } catch (error) {
    res.status(500).json({ error: error.message, devices: [] });
  }
});

// Discover Apple TVs on demand
router.post('/discover', async (req, res) => {
  try {
    const devices = await discoverAppleTVs();
    discoveredAppleTVs = devices;
    
    if (global.broadcast) {
      devices.forEach(device => {
        global.broadcast({
          type: 'device_discovered',
          device: {
            ...device,
            category: 'display',
          },
        });
      });
    }
    
    res.json({ 
      success: true, 
      found: devices.length,
      devices,
      pyatvInstalled,
      message: pyatvInstalled ? 'Discovery complete' : 'Install pyatv for full control: pip install pyatv'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Apple TV status
router.get('/devices/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const device = discoveredAppleTVs.find(d => d.id === id);
    
    if (!device) {
      return res.status(404).json({ error: 'Apple TV not found' });
    }
    
    if (!pyatvInstalled) {
      return res.json({ 
        status: 'pyatv_not_installed',
        message: 'Install pyatv: pip install pyatv',
        device: device.name,
      });
    }
    
    // Use pyatv to get status
    const { stdout } = await execPromise(`atvremote -s ${device.ip} playing`, { timeout: 5000 });
    
    res.json({ 
      device: device.name,
      ip: device.ip,
      status: stdout,
      online: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
