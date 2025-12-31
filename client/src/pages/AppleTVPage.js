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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import axios from 'axios';
import { motion } from 'framer-motion';

const AppleTVPage = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await axios.get('/api/appletv');
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching Apple TV devices:', error);
    }
  };

  const sendCommand = async (command) => {
    if (!selectedDevice) return;
    try {
      await axios.post(`/api/appletv/${selectedDevice}/command`, { command });
    } catch (error) {
      console.error('Error sending command:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Apple TV Control
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Control your Apple TV devices
          </Typography>
        </Box>

        <Card sx={{ mb: 3, background: 'rgba(255, 193, 7, 0.1)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              ⚠️ Setup Required
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Apple TV control requires pyatv to be installed. Install it with:
              <Box
                component="code"
                sx={{
                  display: 'block',
                  mt: 1,
                  p: 2,
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 1,
                }}
              >
                pip install pyatv
              </Box>
              Then pair your Apple TV using: atvremote --id [IP_ADDRESS] pair
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Device List */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Available Devices
                </Typography>
                {devices.length === 0 ? (
                  <Typography color="text.secondary">
                    Configure Apple TV IPs in .env file
                  </Typography>
                ) : (
                  devices.map((device) => (
                    <Button
                      key={device.id}
                      fullWidth
                      variant={selectedDevice === device.ip ? 'contained' : 'outlined'}
                      sx={{ mb: 1, justifyContent: 'flex-start', textTransform: 'none' }}
                      onClick={() => setSelectedDevice(device.ip)}
                    >
                      Apple TV - {device.ip}
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Remote Control */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                {!selectedDevice ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Select a device to control
                  </Typography>
                ) : (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                      Remote Control
                    </Typography>

                    {/* D-Pad */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                      <IconButton
                        onClick={() => sendCommand('up')}
                        sx={{ mb: 1, background: 'rgba(102, 126, 234, 0.1)' }}
                        size="large"
                      >
                        <ArrowUpwardIcon />
                      </IconButton>
                      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                        <IconButton
                          onClick={() => sendCommand('left')}
                          sx={{ background: 'rgba(102, 126, 234, 0.1)' }}
                          size="large"
                        >
                          <ArrowBackIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => sendCommand('select')}
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            width: 64,
                            height: 64,
                          }}
                          size="large"
                        >
                          OK
                        </IconButton>
                        <IconButton
                          onClick={() => sendCommand('right')}
                          sx={{ background: 'rgba(102, 126, 234, 0.1)' }}
                          size="large"
                        >
                          <ArrowForwardIcon />
                        </IconButton>
                      </Box>
                      <IconButton
                        onClick={() => sendCommand('down')}
                        sx={{ background: 'rgba(102, 126, 234, 0.1)' }}
                        size="large"
                      >
                        <ArrowDownwardIcon />
                      </IconButton>
                    </Box>

                    {/* Playback Controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
                      <Button
                        variant="outlined"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => sendCommand('play')}
                      >
                        Play
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<PauseIcon />}
                        onClick={() => sendCommand('pause')}
                      >
                        Pause
                      </Button>
                    </Box>

                    {/* Menu Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<MenuIcon />}
                        onClick={() => sendCommand('menu')}
                      >
                        Menu
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<HomeIcon />}
                        onClick={() => sendCommand('home')}
                      >
                        Home
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default AppleTVPage;
