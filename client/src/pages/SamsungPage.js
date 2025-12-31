import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  IconButton,
} from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import { motion } from 'framer-motion';

const SamsungPage = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [tvStatus, setTvStatus] = useState(null);

  useEffect(() => {
    discoverDevices();
  }, []);

  const discoverDevices = async () => {
    try {
      const response = await axios.get('/api/samsung/discover');
      setDevices(response.data.tvs || []);
    } catch (error) {
      console.error('Error discovering Samsung TVs:', error);
    }
  };

  const getTvStatus = async (ip) => {
    try {
      const response = await axios.get(`/api/samsung/${ip}/status`);
      setTvStatus(response.data);
    } catch (error) {
      console.error('Error getting TV status:', error);
    }
  };

  const sendKey = async (key) => {
    if (!selectedDevice) return;
    try {
      await axios.post(`/api/samsung/${selectedDevice}/key`, { key });
    } catch (error) {
      console.error('Error sending key:', error);
    }
  };

  const launchApp = async (appId) => {
    if (!selectedDevice) return;
    try {
      await axios.post(`/api/samsung/${selectedDevice}/app`, { appId });
    } catch (error) {
      console.error('Error launching app:', error);
    }
  };

  const apps = [
    { name: 'Netflix', id: '11101200001' },
    { name: 'YouTube', id: '111299001912' },
    { name: 'Prime Video', id: '3201512006785' },
    { name: 'Disney+', id: '3201901017640' },
  ];

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Samsung Smart TVs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Control your Samsung televisions
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={discoverDevices}
          >
            Discover
          </Button>
        </Box>

        <Card sx={{ mb: 3, background: 'rgba(255, 193, 7, 0.1)' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              📺 First time connecting? You'll need to accept the connection prompt on your TV.
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Device List */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Available TVs
                </Typography>
                {devices.length === 0 ? (
                  <Typography color="text.secondary">
                    No Samsung TVs found. Ensure they are on the same network.
                  </Typography>
                ) : (
                  devices.map((device, index) => (
                    <Button
                      key={index}
                      fullWidth
                      variant={selectedDevice === device.ip ? 'contained' : 'outlined'}
                      sx={{ mb: 1, justifyContent: 'flex-start', textTransform: 'none' }}
                      onClick={() => {
                        setSelectedDevice(device.ip);
                        getTvStatus(device.ip);
                      }}
                    >
                      {device.name || `Samsung TV - ${device.ip}`}
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Control Panel */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                {!selectedDevice ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Select a TV to control
                  </Typography>
                ) : (
                  <>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Basic Controls
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                      <Button
                        variant="contained"
                        startIcon={<PowerSettingsNewIcon />}
                        onClick={() => sendKey('KEY_POWER')}
                        color="error"
                      >
                        Power
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<VolumeUpIcon />}
                        onClick={() => sendKey('KEY_VOLUP')}
                      >
                        Vol +
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<VolumeDownIcon />}
                        onClick={() => sendKey('KEY_VOLDOWN')}
                      >
                        Vol -
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<VolumeMuteIcon />}
                        onClick={() => sendKey('KEY_MUTE')}
                      >
                        Mute
                      </Button>
                    </Box>

                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Quick Launch Apps
                    </Typography>

                    <Grid container spacing={2}>
                      {apps.map((app) => (
                        <Grid item xs={6} sm={3} key={app.id}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => launchApp(app.id)}
                            sx={{ py: 2 }}
                          >
                            {app.name}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default SamsungPage;
