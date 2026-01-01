import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  PowerSettingsNew,
  Brightness4,
  VolumeUp,
  Check,
  Info,
  Warning,
  Error as ErrorIcon,
  Wifi,
  Search,
  Tv,
  LightbulbOutlined,
  Router,
  Refresh,
  Delete,
  FlashOn,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname;
    const wsPort = process.env.NODE_ENV === 'development' ? '5000' : window.location.port;
    const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      setConnected(true);
    };
    
    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = () => {
      setConnected(false);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle log history (sent on connection)
        if (data.type === 'activity_log_history' && data.logs) {
          const formattedLogs = data.logs.map(log => formatLogEntry(log));
          setActivities(formattedLogs);
        }
        
        // Handle new log entry
        if (data.type === 'activity_log' && data.entry) {
          const newActivity = formatLogEntry(data.entry);
          setActivities(prev => [newActivity, ...prev].slice(0, 50));
        }
        
        // Handle device events (legacy support)
        if (data.type === 'device_action' || data.type === 'device_updated') {
          const newActivity = {
            id: Date.now(),
            type: 'device',
            category: 'Device',
            message: data.message || 'State updated',
            device: data.device?.name || 'Unknown Device',
            time: new Date(),
            icon: <Check />,
            color: '#43e97b',
          };
          setActivities(prev => [newActivity, ...prev].slice(0, 50));
        }
        
        // Handle WeMo device updates
        if (data.type === 'wemo_device_update') {
          const state = data.device?.binaryState === '1' || data.device?.binaryState === 1 ? 'ON' : 'OFF';
          const newActivity = {
            id: Date.now(),
            type: 'device',
            category: 'WeMo',
            message: `Turned ${state}`,
            device: data.device?.friendlyName || 'WeMo Device',
            time: new Date(),
            icon: <PowerSettingsNew />,
            color: state === 'ON' ? '#43e97b' : '#6c757d',
          };
          setActivities(prev => [newActivity, ...prev].slice(0, 50));
        }
        
        // Handle WeMo device discovery
        if (data.type === 'wemo_device_discovered') {
          const newActivity = {
            id: Date.now(),
            type: 'discovery',
            category: 'WeMo',
            message: 'Device discovered',
            device: data.device?.friendlyName || 'WeMo Device',
            time: new Date(),
            icon: <Search />,
            color: '#667eea',
          };
          setActivities(prev => [newActivity, ...prev].slice(0, 50));
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
  };

  const formatLogEntry = (log) => {
    const iconMap = {
      info: <Info />,
      success: <Check />,
      warning: <Warning />,
      error: <ErrorIcon />,
      device: <PowerSettingsNew />,
      network: <Router />,
      discovery: <Search />,
      action: <FlashOn />,
    };

    const colorMap = {
      info: '#667eea',
      success: '#43e97b',
      warning: '#ffc107',
      error: '#f44336',
      device: '#9c27b0',
      network: '#00bcd4',
      discovery: '#3f51b5',
      action: '#ff9800',
    };

    return {
      id: log.id || Date.now(),
      type: log.type || 'info',
      category: log.category || 'System',
      message: log.message || '',
      device: log.category || 'System',
      details: log.details || {},
      time: new Date(log.timestamp || Date.now()),
      icon: iconMap[log.type] || <Info />,
      color: colorMap[log.type] || '#667eea',
    };
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleTimeString();
  };

  const clearLog = () => {
    setActivities([]);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Activity Log
            </Typography>
            <Tooltip title={connected ? 'Connected to server' : 'Disconnected - Reconnecting...'}>
              <Badge 
                variant="dot" 
                color={connected ? 'success' : 'error'}
                sx={{ '& .MuiBadge-badge': { right: -3, top: 3 } }}
              >
                <Wifi fontSize="small" color={connected ? 'success' : 'disabled'} />
              </Badge>
            </Tooltip>
          </Box>
          <Box>
            <Tooltip title="Clear log">
              <IconButton size="small" onClick={clearLog}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {activities.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Info sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No recent activity
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Events will appear here as they happen
              </Typography>
            </Box>
          )}
          <AnimatePresence>
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.02 }}
              >
                <ListItem
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    py: 1,
                    background: 'rgba(102, 126, 234, 0.05)',
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 44 }}>
                    <Avatar
                      sx={{
                        bgcolor: activity.color,
                        width: 32,
                        height: 32,
                      }}
                    >
                      {React.cloneElement(activity.icon, {
                        sx: { fontSize: 16, color: '#fff' },
                      })}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {activity.device}
                        </Typography>
                        <Chip 
                          label={activity.category} 
                          size="small" 
                          sx={{ 
                            height: 18, 
                            fontSize: '0.65rem',
                            bgcolor: `${activity.color}22`,
                            color: activity.color,
                            fontWeight: 600
                          }} 
                        />
                      </Box>
                    }
                    secondary={activity.message}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                      sx: { mt: 0.25 }
                    }}
                  />
                  <Chip
                    label={formatTime(activity.time)}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      fontWeight: 500,
                      fontSize: '0.65rem',
                      height: 20,
                    }}
                  />
                </ListItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </List>
      </CardContent>
    </Card>
  );
};

export default ActivityLog;
