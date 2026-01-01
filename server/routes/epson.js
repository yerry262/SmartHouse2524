const express = require('express');
const router = express.Router();
const axios = require('axios');

// Get all Epson printers
router.get('/discover', async (req, res) => {
  try {
    // In a real implementation, we might use a specific discovery protocol
    // For now, we rely on the main device discovery service
    const devices = await req.app.locals.deviceDiscovery.getAllDevices();
    const printers = devices.filter(d => d.type === 'printer' || (d.vendor && d.vendor.includes('Epson')));
    
    if (global.activityLog && printers.length > 0) {
      global.activityLog.discovery('Epson', `Found ${printers.length} printer(s)`);
    }
    
    res.json(printers);
  } catch (error) {
    if (global.activityLog) {
      global.activityLog.error('Epson', `Discovery failed: ${error.message}`);
    }
    res.status(500).json({ error: 'Failed to discover printers' });
  }
});

// Get printer status (mocked or via simple HTTP check)
router.get('/:ip/status', async (req, res) => {
  const { ip } = req.params;
  
  try {
    // Try to fetch the main page of the printer to check if it's online
    // Most Epson printers have a web interface at port 80 or 443
    const response = await axios.get(`http://${ip}`, { timeout: 2000 });
    
    res.json({
      status: 'online',
      message: 'Printer is reachable',
      details: {
        statusCode: response.status,
        server: response.headers.server
      }
    });
  } catch (error) {
    res.json({
      status: 'offline',
      message: 'Printer is not reachable',
      error: error.message
    });
  }
});

module.exports = router;
