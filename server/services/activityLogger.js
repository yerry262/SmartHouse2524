// Activity Logger Service
// Broadcasts log entries to connected WebSocket clients

const LOG_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  DEVICE: 'device',
  NETWORK: 'network',
  DISCOVERY: 'discovery',
  ACTION: 'action'
};

// Store recent logs in memory (last 100)
const recentLogs = [];
const MAX_LOGS = 100;

const log = (type, category, message, details = {}) => {
  const entry = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    type,
    category,
    message,
    details,
    timestamp: new Date().toISOString()
  };

  // Add to recent logs
  recentLogs.unshift(entry);
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.pop();
  }

  // Broadcast to WebSocket clients
  if (global.broadcast) {
    global.broadcast({
      type: 'activity_log',
      entry
    });
  }

  // Also log to console with emoji
  const emoji = {
    [LOG_TYPES.INFO]: 'ℹ️',
    [LOG_TYPES.SUCCESS]: '✅',
    [LOG_TYPES.WARNING]: '⚠️',
    [LOG_TYPES.ERROR]: '❌',
    [LOG_TYPES.DEVICE]: '📱',
    [LOG_TYPES.NETWORK]: '🌐',
    [LOG_TYPES.DISCOVERY]: '🔍',
    [LOG_TYPES.ACTION]: '⚡'
  }[type] || '📝';

  console.log(`${emoji} [${category}] ${message}`);
};

// Convenience methods
const info = (category, message, details) => log(LOG_TYPES.INFO, category, message, details);
const success = (category, message, details) => log(LOG_TYPES.SUCCESS, category, message, details);
const warning = (category, message, details) => log(LOG_TYPES.WARNING, category, message, details);
const error = (category, message, details) => log(LOG_TYPES.ERROR, category, message, details);
const device = (category, message, details) => log(LOG_TYPES.DEVICE, category, message, details);
const network = (category, message, details) => log(LOG_TYPES.NETWORK, category, message, details);
const discovery = (category, message, details) => log(LOG_TYPES.DISCOVERY, category, message, details);
const action = (category, message, details) => log(LOG_TYPES.ACTION, category, message, details);

// Get recent logs
const getRecentLogs = (count = 50) => recentLogs.slice(0, count);

module.exports = {
  LOG_TYPES,
  log,
  info,
  success,
  warning,
  error,
  device,
  network,
  discovery,
  action,
  getRecentLogs
};
