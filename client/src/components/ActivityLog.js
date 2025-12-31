import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  PowerSettingsNew,
  Brightness4,
  VolumeUp,
  Check,
  Info,
  Warning,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Start with empty activity log
    setActivities([]);

    // WebSocket connection for real-time updates
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname;
    const wsPort = process.env.NODE_ENV === 'development' ? '5000' : window.location.port;
    const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'device_action' || data.type === 'device_updated') {
        const newActivity = {
          id: Date.now(),
          type: data.action || 'info',
          device: data.device?.name || 'Unknown Device',
          action: data.message || 'State updated',
          time: new Date(),
          icon: <Check />,
          color: '#43e97b',
        };
        setActivities(prev => [newActivity, ...prev].slice(0, 10));
      }
    };

    return () => ws.close();
  }, []);

  const formatTime = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Activity Log
        </Typography>
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {activities.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No recent activity. Listening for events...
            </Typography>
          )}
          <AnimatePresence>
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <ListItem
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    background: 'rgba(102, 126, 234, 0.05)',
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        bgcolor: activity.color,
                        width: 36,
                        height: 36,
                      }}
                    >
                      {React.cloneElement(activity.icon, {
                        sx: { fontSize: 20, color: '#fff' },
                      })}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.device}
                    secondary={activity.action}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                    }}
                  />
                  <Chip
                    label={formatTime(activity.time)}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      fontWeight: 600,
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
