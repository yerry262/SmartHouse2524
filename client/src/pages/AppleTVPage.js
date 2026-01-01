import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  CircularProgress,
  Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import { motion } from 'framer-motion';

const AppleTVPage = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pyatvInstalled, setPyatvInstalled] = useState(false);
  const [playingStatus, setPlayingStatus] = useState({});

  useEffect(() => {
    fetchDevices();
    // Auto-refresh devices every 30 seconds
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (devices.length > 0) {
      devices.forEach(device => {
        fetchPlayingStatus(device.ip);
      });
      // Auto-refresh playing status every 5 seconds
      const interval = setInterval(() => {
        devices.forEach(device => {
          fetchPlayingStatus(device.ip);
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [devices]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/appletv/devices');
      setDevices(response.data.devices || []);
      setPyatvInstalled(response.data.pyatvInstalled || false);
    } catch (error) {
      console.error('Error fetching Apple TV devices:', error);
    }
    setLoading(false);
  };

  const fetchPlayingStatus = async (ip) => {
    try {
      const response = await axios.get(`/api/appletv/${ip}/status`);
      setPlayingStatus(prev => ({ ...prev, [ip]: response.data }));
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const handleCommand = async (ip, command) => {
    try {
      await axios.post(`/api/appletv/${ip}/command`, { command });
      // Refresh status after command
      setTimeout(() => fetchPlayingStatus(ip), 500);
    } catch (error) {
      console.error('Error sending command:', error);
      // If error suggests pairing needed, update device state
      if (error.response?.data?.error?.includes('pair')) {
        alert('This Apple TV needs to be paired first. Click the "Pair Device" button.');
      }
    }
  };

  const handlePair = async (ip) => {
    try {
      const response = await axios.post(`/api/appletv/${ip}/pair`);
      alert(`Pairing started! Check your Apple TV for a PIN code.\n\n${response.data.message}`);
      // Refresh devices after pairing
      setTimeout(fetchDevices, 2000);
    } catch (error) {
      console.error('Error pairing:', error);
      alert(`Pairing failed: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Apple TV Control
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Control your Apple TV devices
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={fetchDevices}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        <Grid container spacing={3}>
          {devices.map((device) => {
            // Prefer hostname if available and different from device name
            let displayName = device.name;
            if (device.hostname) {
              const cleanHostname = device.hostname.replace('.local', '').replace(/-/g, ' ');
              // Use hostname if it's different from the device name
              if (cleanHostname.toLowerCase() !== device.name?.toLowerCase()) {
                displayName = cleanHostname;
              }
            }
            // Fallback: if name starts with generic 'Apple TV', use hostname
            if (device.name?.startsWith('Apple TV (') && device.hostname) {
              displayName = device.hostname.replace('.local', '').replace(/-/g, ' ');
            }

            return (
              <Grid item xs={12} md={6} lg={4} key={device.ip}>
                <Card
                  sx={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { background: 'rgba(255, 255, 255, 0.08)' },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                        {displayName}
                      </Typography>
                      <Chip
                        label={device.type === 'appletv' ? 'Apple TV' : device.type}
                        color="primary"
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>IP:</strong> {device.ip}
                    </Typography>
                    {device.model && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Model:</strong> {device.model}
                      </Typography>
                    )}
                    {device.mac && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        <strong>MAC:</strong> {device.mac}
                      </Typography>
                    )}

                    {/* Pair Button */}
                    <Button
                      variant="outlined"
                      color="warning"
                      fullWidth
                      onClick={() => handlePair(device.ip)}
                      sx={{ mb: 2 }}
                    >
                      🔗 Pair Device
                    </Button>

                    {playingStatus[device.ip] && (
                      <Box
                        sx={{
                          mb: 2,
                          p: 2,
                          background: 'rgba(33, 150, 243, 0.1)',
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                          Status:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                          {playingStatus[device.ip].playing || 'No status available'}
                        </Typography>
                      </Box>
                    )}

                    {/* Remote Control Buttons */}
                    <Box sx={{ mt: 2 }}>
                      {/* D-Pad Navigation */}
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <Box />
                        <Button
                          variant="contained"
                          onClick={() => handleCommand(device.ip, 'up')}
                          sx={{ minWidth: 0, aspectRatio: '1' }}
                        >
                          ↑
                        </Button>
                        <Box />
                        <Button
                          variant="contained"
                          onClick={() => handleCommand(device.ip, 'left')}
                          sx={{ minWidth: 0, aspectRatio: '1' }}
                        >
                          ←
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleCommand(device.ip, 'select')}
                          sx={{ minWidth: 0, aspectRatio: '1', fontWeight: 600 }}
                        >
                          OK
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => handleCommand(device.ip, 'right')}
                          sx={{ minWidth: 0, aspectRatio: '1' }}
                        >
                          →
                        </Button>
                        <Box />
                        <Button
                          variant="contained"
                          onClick={() => handleCommand(device.ip, 'down')}
                          sx={{ minWidth: 0, aspectRatio: '1' }}
                        >
                          ↓
                        </Button>
                        <Box />
                      </Box>

                      {/* Menu and Home Buttons */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={() => handleCommand(device.ip, 'menu')}
                          fullWidth
                        >
                          Menu
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => handleCommand(device.ip, 'home')}
                          fullWidth
                        >
                          Home
                        </Button>
                      </Box>

                      {/* Playback Controls */}
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <Button
                          variant="outlined"
                          onClick={() => handleCommand(device.ip, 'previous')}
                          sx={{ minWidth: 0 }}
                        >
                          ⏮
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleCommand(device.ip, 'play_pause')}
                          sx={{ minWidth: 0 }}
                        >
                          ⏯
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => handleCommand(device.ip, 'stop')}
                          sx={{ minWidth: 0 }}
                        >
                          ⏹
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => handleCommand(device.ip, 'next')}
                          sx={{ minWidth: 0 }}
                        >
                          ⏭
                        </Button>
                      </Box>

                      {/* Volume Controls */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={() => handleCommand(device.ip, 'volume_down')}
                          fullWidth
                        >
                          Vol -
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => handleCommand(device.ip, 'volume_up')}
                          fullWidth
                        >
                          Vol +
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}

          {devices.length === 0 && (
            <Grid item xs={12}>
              <Card sx={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" align="center">
                    No Apple TV devices found. Make sure your devices are on the same network and discoverable.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </motion.div>
    </Container>
  );
};

export default AppleTVPage;
