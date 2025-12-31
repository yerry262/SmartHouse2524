const express = require('express');
const router = express.Router();
const axios = require('axios');
const dns = require('dns').promises;
const ModbusRTU = require('modbus-serial');

// Aurora/Power-One solar inverter communication
// These inverters typically use Aurora protocol or Modbus TCP
// For basic monitoring, many have web interfaces or REST APIs

// Store discovered inverters
let inverters = [];

// Modbus client pool
const modbusClients = new Map();

// Get all inverters
router.get('/inverters', (req, res) => {
  res.json({ inverters });
});

// Add inverter manually
router.post('/add-inverter', (req, res) => {
  const { name, ip, port, type, serialNumber } = req.body;
  
  if (!ip) {
    return res.status(400).json({ error: 'IP address required' });
  }

  const inverter = {
    id: `aurora_${Date.now()}`,
    name: name || `Aurora Inverter ${ip}`,
    ip,
    port: port || 502, // Default Modbus TCP port
    type: type || 'power-one-aurora',
    serialNumber: serialNumber || '',
    status: 'unknown',
    addedAt: new Date().toISOString(),
  };

  const existingIndex = inverters.findIndex(inv => inv.ip === ip);
  if (existingIndex >= 0) {
    inverters[existingIndex] = inverter;
  } else {
    inverters.push(inverter);
  }

  res.json({ success: true, inverter });
});

// Get inverter status (basic HTTP polling if inverter has web interface)
router.get('/inverters/:ip/status', async (req, res) => {
  try {
    const { ip } = req.params;
    const inverter = inverters.find(inv => inv.ip === ip);
    
    if (!inverter) {
      return res.status(404).json({ error: 'Inverter not found. Add it first.' });
    }

    // Try to fetch basic status from web interface
    // Many Aurora inverters have a web interface on port 80
    try {
      const response = await axios.get(`http://${ip}`, {
        timeout: 5000,
        validateStatus: () => true,
      });

      res.json({
        inverter: inverter.name,
        ip,
        online: response.status === 200,
        webInterface: response.status === 200,
        message: 'Basic connectivity check. For detailed monitoring, use Aurora Communicator software or Modbus TCP.',
      });
    } catch (error) {
      res.json({
        inverter: inverter.name,
        ip,
        online: false,
        error: 'Cannot connect to inverter',
        message: 'Ensure inverter is on same network and web interface is enabled',
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get production data via Modbus TCP
router.get('/inverters/:ip/data', async (req, res) => {
  try {
    const { ip } = req.params;
    const inverter = inverters.find(inv => inv.ip === ip);
    
    if (!inverter) {
      return res.status(404).json({ error: 'Inverter not found' });
    }

    // Try to read data via Modbus TCP
    let client = modbusClients.get(ip);
    
    if (!client) {
      client = new ModbusRTU();
      try {
        await client.connectTCP(ip, { port: inverter.port || 502 });
        client.setTimeout(5000);
        modbusClients.set(ip, client);
      } catch (error) {
        return res.json({
          message: 'Cannot connect to inverter via Modbus TCP',
          inverter: inverter.name,
          ip,
          error: error.message,
          instructions: [
            'Verify Modbus TCP is enabled on inverter',
            'Check inverter register map in documentation',
            'Common registers: 40001-40100 for status/power data',
          ],
          placeholder: {
            power: 0,
            dailyEnergy: 0,
            totalEnergy: 0,
            voltage: 0,
            current: 0,
            status: 'disconnected',
          },
        });
      }
    }
    
    try {
      // Common Modbus registers for solar inverters (may vary by model)
      // These are generic - actual register addresses depend on inverter model
      const powerData = await client.readHoldingRegisters(40001, 10);
      
      res.json({
        inverter: inverter.name,
        ip,
        connected: true,
        data: {
          power: powerData.data[0] || 0,  // W
          dailyEnergy: powerData.data[1] || 0,  // Wh
          totalEnergy: powerData.data[2] || 0,  // kWh
          voltage: powerData.data[3] || 0,  // V
          current: powerData.data[4] || 0,  // A
          status: 'online',
        },
        note: 'Register addresses may need adjustment for your inverter model. Check manufacturer documentation.',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Close bad connection
      modbusClients.delete(ip);
      client.close();
      
      res.json({
        message: 'Modbus read error - register addresses may be incorrect',
        inverter: inverter.name,
        ip,
        error: error.message,
        instructions: [
          'Check inverter documentation for correct register addresses',
          'Aurora inverters: registers vary by model (PVI-3.0 vs PVI-10.0 etc)',
          'Try Aurora Communicator software for model-specific setup',
        ],
        placeholder: {
          power: 0,
          dailyEnergy: 0,
          totalEnergy: 0,
          voltage: 0,
          current: 0,
          status: 'register_error',
        },
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get historical data
router.get('/inverters/:ip/history', async (req, res) => {
  try {
    const { ip } = req.params;
    const { period } = req.query; // day, week, month, year
    
    const inverter = inverters.find(inv => inv.ip === ip);
    
    if (!inverter) {
      return res.status(404).json({ error: 'Inverter not found' });
    }

    res.json({
      message: 'Historical data requires database and regular polling',
      inverter: inverter.name,
      period: period || 'day',
      instructions: 'Set up regular data collection and store in time-series database',
      placeholder: {
        data: [],
        summary: {
          totalEnergy: 0,
          peakPower: 0,
          averagePower: 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Discovery via network scan and hostname detection
router.post('/discover', async (req, res) => {
  try {
    const discovered = [];
    
    // Try to find inverters by common hostnames
    const hostnamePatterns = [
      'aurora', 'inverter', 'solar', 'powerone', 'abb-inverter'
    ];
    
    for (const pattern of hostnamePatterns) {
      for (const suffix of ['', '.local']) {
        const hostname = pattern + suffix;
        try {
          const addresses = await dns.resolve4(hostname);
          if (addresses && addresses.length > 0) {
            const ip = addresses[0];
            
            // Try to connect via Modbus TCP
            const client = new ModbusRTU();
            try {
              await client.connectTCP(ip, { port: 502 });
              client.setTimeout(3000);
              
              // Try to read a basic register to verify it's a Modbus device
              await client.readHoldingRegisters(0, 1);
              
              discovered.push({
                ip,
                hostname,
                type: 'Modbus TCP',
                status: 'responsive',
              });
              
              client.close();
            } catch (e) {
              // Not a Modbus device or wrong register
            }
          }
        } catch (e) {
          // Hostname not found
        }
      }
    }
    
    res.json({
      success: true,
      found: discovered.length,
      inverters: discovered,
      message: discovered.length > 0 
        ? `Found ${discovered.length} potential inverter(s)` 
        : 'No inverters found by hostname. Add manually by IP.',
      instructions: [
        'Common hostnames: aurora, inverter, solar, powerone',
        'Ensure inverter has Modbus TCP enabled',
        'Add found devices using /add-inverter endpoint',
      ],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove inverter
router.delete('/inverters/:id', (req, res) => {
  const { id } = req.params;
  const index = inverters.findIndex(inv => inv.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Inverter not found' });
  }

  inverters.splice(index, 1);
  res.json({ success: true, message: 'Inverter removed' });
});

module.exports = router;
