const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const WebSocket = require('ws');
const http = require('http');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Activity Logger
const activityLogger = require('./services/activityLogger');
global.activityLog = activityLogger;

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket connection for real-time updates
wss.on('connection', (ws) => {
  console.log('WebSocket: New client connected');
  
  // Send recent logs to new client
  const recentLogs = activityLogger.getRecentLogs(20);
  ws.send(JSON.stringify({ type: 'activity_log_history', logs: recentLogs }));
  
  ws.on('message', (message) => {
    console.log('Received:', message);
  });
  
  ws.on('close', () => {
    console.log('WebSocket: Client disconnected');
  });
});

// Broadcast function for real-time updates
global.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Import routes
const deviceRoutes = require('./routes/devices');
const eeroRoutes = require('./routes/eero');
const sonosRoutes = require('./routes/sonos');
const appleTvRoutes = require('./routes/appletv');
const ringRoutes = require('./routes/ring');
const samsungRoutes = require('./routes/samsung');
const cameraRoutes = require('./routes/cameras');
const hueRoutes = require('./routes/hue');
const tplinkRoutes = require('./routes/tplink');
const lgRoutes = require('./routes/lg');
const lifxRoutes = require('./routes/lifx');
const nanoleafRoutes = require('./routes/nanoleaf');
const wyzeRoutes = require('./routes/wyze');
const miioRoutes = require('./routes/miio');
const alexaRoutes = require('./routes/alexa');
const googleHomeRoutes = require('./routes/google-home');
const auroraRoutes = require('./routes/aurora');
const wemoRoutes = require('./routes/wemo');
const epsonRoutes = require('./routes/epson');
const samsungWasherRoutes = require('./routes/samsung-washer');
const geAppliancesRoutes = require('./routes/ge-appliances');
const samsungAppliancesRoutes = require('./routes/samsung-appliances');
const smartThingsRoutes = require('./routes/smartthings');

// Routes
app.use('/api/devices', deviceRoutes);
app.use('/api/eero', eeroRoutes);
app.use('/api/sonos', sonosRoutes);
app.use('/api/appletv', appleTvRoutes);
app.use('/api/ring', ringRoutes);
app.use('/api/samsung', samsungRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/hue', hueRoutes);
app.use('/api/tplink', tplinkRoutes);
app.use('/api/lg', lgRoutes);
app.use('/api/lifx', lifxRoutes);
app.use('/api/nanoleaf', nanoleafRoutes);
app.use('/api/wyze', wyzeRoutes);
app.use('/api/miio', miioRoutes);
app.use('/api/alexa', alexaRoutes);
app.use('/api/google-home', googleHomeRoutes);
app.use('/api/aurora', auroraRoutes);
app.use('/api/wemo', wemoRoutes);
app.use('/api/epson', epsonRoutes);
app.use('/api/samsung-washer', samsungWasherRoutes);
app.use('/api/ge-appliances', geAppliancesRoutes);
app.use('/api/samsung-appliances', samsungAppliancesRoutes);
app.use('/api/smartthings', smartThingsRoutes);

// Activity Log API
app.get('/api/activity', (req, res) => {
  const count = parseInt(req.query.count) || 50;
  res.json({ logs: activityLogger.getRecentLogs(count) });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  activityLogger.success('Server', `SmartHouse server running on port ${PORT}`);
  activityLogger.info('Server', `WebSocket server running on ws://localhost:${PORT}`);
});
