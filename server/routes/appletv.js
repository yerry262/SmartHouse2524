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
// Use env variable for path, fallback to default locations
const atvremotePath = process.env.ATVREMOTE_PATH || (process.platform === 'win32' 
  ? 'atvremote.exe' 
  : 'atvremote');

// Check by trying to scan (--version returns exit code 1)
execPromise(`"${atvremotePath}" scan`, { timeout: 5000, windowsHide: true }).then(() => {
  pyatvInstalled = true;
  console.log(`✅ pyatv is installed (using: ${atvremotePath})`);
}).catch((err) => {
  // If the error is just timeout, pyatv is installed but scan takes time
  if (err.killed || err.message.includes('scan')) {
    pyatvInstalled = true;
    console.log(`✅ pyatv is installed (using: ${atvremotePath})`);
  } else {
    console.log('⚠️  pyatv not installed. Run: pip install pyatv');
    console.log('   Set ATVREMOTE_PATH in .env to custom path if needed');
    console.log('   Error:', err.message);
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
      const { stdout } = await execPromise(`"${atvremotePath}" scan`, { timeout: 20000, windowsHide: true });
      // Parse pyatv scan output - split by lines that start with "Name:"
      // This handles devices separated by varying amounts of whitespace
      const lines = stdout.split('\n');
      let currentDevice = null;
      const parsedDevices = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('Name:')) {
          // Start of a new device - save previous if exists
          if (currentDevice && currentDevice.name && currentDevice.ip) {
            parsedDevices.push(currentDevice);
          }
          currentDevice = {
            name: trimmed.split('Name:')[1]?.trim() || '',
            ip: '',
            model: '',
            mac: ''
          };
        } else if (currentDevice) {
          if (trimmed.startsWith('Address:')) {
            currentDevice.ip = trimmed.split('Address:')[1]?.trim() || '';
          } else if (trimmed.startsWith('Model/SW:')) {
            currentDevice.model = trimmed.split('Model/SW:')[1]?.trim() || '';
          } else if (trimmed.startsWith('MAC:')) {
            currentDevice.mac = trimmed.split('MAC:')[1]?.trim() || '';
          }
        }
      }
      // Don't forget the last device
      if (currentDevice && currentDevice.name && currentDevice.ip) {
        parsedDevices.push(currentDevice);
      }
      
      // Now filter the parsed devices
      for (const { name, ip, model, mac } of parsedDevices) {
        // Only add actual Apple TVs (not Macs, HomePods, or speakers)
        if (ip && name) {
          // Filter out Macs and other AirPlay devices
          const isAppleTV = model && (
            model.toLowerCase().includes('apple tv') || 
            model.toLowerCase().includes('appletv') ||
            model.toLowerCase().startsWith('gen') // Gen4K, Gen3, etc
          );
          
          // Skip if it's clearly not an Apple TV
          const isMac = model && (
            model.toLowerCase().includes('mac') ||
            model.toLowerCase().includes('imac') ||
            model.toLowerCase().includes('macbook')
          );
          
          const isHomePod = name.toLowerCase().includes('homepod');
          
          if (isAppleTV && !isMac && !isHomePod) {
            // Check if not already in list
            if (!devices.find(d => d.ip === ip)) {
              // Try to get hostname from stored devices
              let hostname = null;
              try {
                const fs = require('fs');
                const path = require('path');
                const devicesPath = path.join(__dirname, '../data/devices.json');
                if (fs.existsSync(devicesPath)) {
                  const storedDevices = JSON.parse(fs.readFileSync(devicesPath, 'utf8'));
                  const storedDevice = storedDevices.find(d => 
                    d.ip === ip || 
                    (d.metadata && d.metadata.addresses && d.metadata.addresses.includes(ip))
                  );
                  if (storedDevice && storedDevice.hostname) {
                    hostname = storedDevice.hostname;
                  }
                }
              } catch (err) {
                // Ignore errors reading stored devices
              }
              
              devices.push({
                id: `appletv_${ip.replace(/\./g, '_')}`,
                name,
                ip,
                type: 'appletv',
                model,
                mac,
                hostname,
                discoveredBy: 'pyatv',
              });
            }
          }
        }
      }
      console.log(`Apple TV: Discovered ${devices.length} devices via pyatv`);
      if (global.activityLog && devices.length > 0) {
        global.activityLog.discovery('Apple TV', `Discovered ${devices.length} device(s) via pyatv`);
      }
    } catch (error) {
      console.log('pyatv scan error:', error.message);
      if (global.activityLog) {
        global.activityLog.warning('Apple TV', `pyatv scan failed: ${error.message}`);
      }
    }
  }
  
  return devices;
};

// Get all Apple TVs (from pyatv scan + stored devices.json)
router.get('/devices', async (req, res) => {
  try {
    // Get devices from pyatv scan
    const scannedDevices = await discoverAppleTVs();
    
    // Also get Apple TVs from stored devices.json
    const fs = require('fs');
    const path = require('path');
    const devicesPath = path.join(__dirname, '../data/devices.json');
    let storedAppleTVs = [];
    
    if (fs.existsSync(devicesPath)) {
      try {
        const allDevices = JSON.parse(fs.readFileSync(devicesPath, 'utf8'));
        storedAppleTVs = allDevices
          .filter(d => d.type === 'appletv')
          .map(d => ({
            id: d.id || `appletv_${(d.ip || '').replace(/\./g, '_')}`,
            name: d.name || d.hostname || `Apple TV (${d.ip})`,
            ip: d.ip || d.ipAddress,
            type: 'appletv',
            model: d.model || d.metadata?.model || '',
            mac: d.mac || d.metadata?.mac || '',
            hostname: d.hostname || '',
            discoveredBy: 'devices.json',
          }));
      } catch (err) {
        console.log('Error reading devices.json for Apple TVs:', err.message);
      }
    }
    
    // Merge: prefer scanned devices, add stored ones that aren't duplicates
    const allDevices = [...scannedDevices];
    for (const stored of storedAppleTVs) {
      const exists = allDevices.some(d => d.ip === stored.ip);
      if (!exists && stored.ip) {
        allDevices.push(stored);
      }
    }
    
    discoveredAppleTVs = allDevices;
    console.log(`Apple TV: Returning ${allDevices.length} devices (${scannedDevices.length} scanned, ${storedAppleTVs.length} stored)`);
    res.json({ devices: allDevices, pyatvInstalled });
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
    const { stdout } = await execPromise(`"${atvremotePath}" -s ${device.ip} playing`, { timeout: 5000, windowsHide: true });
    
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
        const { stdout: scanOutput } = await execPromise(`"${atvremotePath}" scan`, { timeout: 15000, windowsHide: true });
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
      const { stdout: playingOutput } = await execPromise(`"${atvremotePath}" -s ${ip} playing`, { timeout: 10000, windowsHide: true });
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
        mac: deviceInfo?.mac || null,
        hostname: deviceInfo?.hostname || null
      },
      playing: playingStatus,
      online: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message, ip: req.params.ip });
  }
});

// Start pairing with Apple TV
router.post('/:ip/pair', async (req, res) => {
  try {
    const { ip } = req.params;
    
    if (!pyatvInstalled) {
      return res.status(503).json({ 
        error: 'pyatv not installed',
        message: 'Install pyatv: pip install pyatv'
      });
    }
    
    // Start pairing process - this will show a PIN on the Apple TV
    const { stdout } = await execPromise(`"${atvremotePath}" -s ${ip} pair`, { timeout: 30000, windowsHide: true });
    
    if (global.activityLog) {
      global.activityLog.action('Apple TV', `Pairing started with ${ip}`);
    }
    
    res.json({ 
      success: true,
      message: 'Pairing started - check your Apple TV for PIN',
      output: stdout,
      ip
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      message: 'Pairing failed - make sure Apple TV is on and accessible'
    });
  }
});

// Send command to Apple TV
router.post('/:ip/command', async (req, res) => {
  try {
    const { ip } = req.params;
    const { command } = req.body;
    
    if (!pyatvInstalled) {
      return res.status(503).json({ 
        error: 'pyatv not installed',
        message: 'Install pyatv: pip install pyatv'
      });
    }
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    // Map common commands to pyatv commands
    const commandMap = {
      'up': 'up',
      'down': 'down',
      'left': 'left',
      'right': 'right',
      'select': 'select',
      'menu': 'menu',
      'home': 'home',
      'play': 'play',
      'pause': 'pause',
      'play_pause': 'play_pause',
      'stop': 'stop',
      'next': 'next',
      'previous': 'previous',
      'volume_up': 'volume_up',
      'volume_down': 'volume_down'
    };
    
    const atvCommand = commandMap[command.toLowerCase()];
    if (!atvCommand) {
      return res.status(400).json({ error: `Unknown command: ${command}` });
    }
    
    // Send command via atvremote
    await execPromise(`"${atvremotePath}" -s ${ip} ${atvCommand}`, { timeout: 5000, windowsHide: true });
    
    if (global.activityLog) {
      global.activityLog.action('Apple TV', `Sent ${command} to ${ip}`);
    }
    
    res.json({ 
      success: true,
      command: atvCommand,
      ip
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
