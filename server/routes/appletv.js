const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const util = require('util');
const dns = require('dns').promises;
const execPromise = util.promisify(exec);

// Store discovered Apple TVs
let discoveredAppleTVs = [];

// Check if pyatv is installed - checking at startup
let pyatvInstalled = false;
const atvremotePath = process.platform === 'win32' 
  ? 'atvremote.exe' 
  : 'atvremote';

// Check by trying to scan (--version returns exit code 1)
execPromise(`${atvremotePath} scan`, { timeout: 3000 }).then(() => {
  pyatvInstalled = true;
  console.log('✅ pyatv is installed');
}).catch((err) => {
  // If the error is just timeout, pyatv is installed but scan takes time
  if (err.killed || err.message.includes('scan')) {
    pyatvInstalled = true;
    console.log('✅ pyatv is installed');
  } else {
    console.log('⚠️  pyatv not installed. Run: pip install pyatv');
  }
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
      const { stdout } = await execPromise('atvremote scan', { timeout: 15000 });
      // Parse pyatv scan output - each device block is separated by blank lines
      const deviceBlocks = stdout.split('\n\n').filter(block => block.includes('Name:'));
      
      for (const block of deviceBlocks) {
        const lines = block.split('\n');
        let name = '', ip = '', model = '', mac = '';
        
        for (const line of lines) {
          if (line.includes('Name:')) {
            name = line.split('Name:')[1]?.trim() || '';
          } else if (line.includes('Address:')) {
            ip = line.split('Address:')[1]?.trim() || '';
          } else if (line.includes('Model/SW:')) {
            model = line.split('Model/SW:')[1]?.trim() || '';
          } else if (line.includes('MAC:')) {
            mac = line.split('MAC:')[1]?.trim() || '';
          }
        }
        
        // Only add actual Apple TVs (not Macs or speakers)
        if (ip && name && model.toLowerCase().includes('apple tv')) {
          // Check if not already in list
          if (!devices.find(d => d.ip === ip)) {
            devices.push({
              id: `appletv_${ip.replace(/\./g, '_')}`,
              name,
              ip,
              type: 'appletv',
              model,
              mac,
              discoveredBy: 'pyatv',
            });
          }
        }
      }
      console.log(`Apple TV: Discovered ${devices.length} devices via pyatv`);
    } catch (error) {
      console.log('pyatv scan error:', error.message);
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

// Get Apple TV status by device id
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

// Get Apple TV status by IP address (for DeviceDetails page)
router.get('/:ip/status', async (req, res) => {
  try {
    const { ip } = req.params;
    
    // First, try to scan for this specific device to get its name
    let deviceInfo = discoveredAppleTVs.find(d => d.ip === ip);
    
    if (!deviceInfo) {
      // Do a quick scan to get device info
      try {
        const { stdout: scanOutput } = await execPromise('atvremote scan', { timeout: 15000 });
        // Mark pyatv as installed since the command worked
        pyatvInstalled = true;
        
        // Split by the separator line pattern (blank line followed by device block)
        // Each device block starts with "       Name:" 
        const deviceBlocks = scanOutput.split(/\n\s*\n/).filter(block => block.trim().length > 0);
        
        for (const block of deviceBlocks) {
          // Check if this block contains our IP address (with flexible whitespace)
          if (block.match(new RegExp(`Address:\\s*${ip.replace(/\./g, '\\.')}\\s*$`, 'm'))) {
            const lines = block.split('\n');
            let name = '', model = '', mac = '';
            
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('Name:')) {
                name = trimmedLine.split('Name:')[1]?.trim() || '';
              } else if (trimmedLine.startsWith('Model/SW:')) {
                model = trimmedLine.split('Model/SW:')[1]?.trim() || '';
              } else if (trimmedLine.startsWith('MAC:')) {
                mac = trimmedLine.split('MAC:')[1]?.trim() || '';
              }
            }
            
            if (name) {
              deviceInfo = { name, model, mac, ip };
              // Cache it for future requests
              if (!discoveredAppleTVs.find(d => d.ip === ip)) {
                discoveredAppleTVs.push(deviceInfo);
              }
              break;
            }
          }
        }
      } catch (scanError) {
        console.log('Quick scan failed:', scanError.message);
      }
    }
    
    // Try to get playing status
    let playingStatus = null;
    try {
      const { stdout: playingOutput } = await execPromise(`atvremote -s ${ip} playing`, { timeout: 10000 });
      playingStatus = playingOutput;
    } catch (playError) {
      // Device may require pairing
      playingStatus = 'Unable to get status - device may need pairing';
    }
    
    res.json({ 
      ip,
      device: {
        name: deviceInfo?.name || 'Apple TV',
        model: deviceInfo?.model || 'Unknown',
        mac: deviceInfo?.mac || null
      },
      playing: playingStatus,
      online: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message, ip: req.params.ip });
  }
});

module.exports = router;
