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
  CircularProgress,
  Paper,
  Alert
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';
import ApiIcon from '@mui/icons-material/Api';
import axios from 'axios';
import { motion } from 'framer-motion';

const AppleTVPage = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/appletv');
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching Apple TV devices:', error);
    }
    setLoading(false);
  };

  const handleTestApi = async () => {
    if (!selectedDevice) return;
    setApiTestLoading(true);
    try {
      const response = await axios.get(`/api/appletv/${selectedDevice}/status`);
      setApiTestResult(response.data);
      setApiTestTimestamp(new Date().toLocaleString());
    } catch (err) {
      setApiTestResult({ error: err.message || 'API request failed', status: err.response?.status });
      setApiTestTimestamp(new Date().toLocaleString());
    }
    setApiTestLoading(false);
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
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

                    {/* API Test Section */}
                    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ApiIcon /> API Response
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleTestApi}
                          disabled={apiTestLoading}
                          sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                        >
                          {apiTestLoading ? <CircularProgress size={16} color="inherit" /> : 'Test API'}
                        </Button>
                      </Box>
                      {apiTestTimestamp && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Last tested: {apiTestTimestamp}
                        </Typography>
                      )}
                      {apiTestResult ? (
                        <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.3)', maxHeight: 200, overflow: 'auto' }}>
                          {apiTestResult.error ? (
                            <Alert severity="error" sx={{ mb: 1 }}>{apiTestResult.error}</Alert>
                          ) : (
                            <>
                              {apiTestResult.device && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2"><strong>Name:</strong> {apiTestResult.device.name}</Typography>
                                  <Typography variant="body2"><strong>Model:</strong> {apiTestResult.device.model}</Typography>
                                  <Typography variant="body2"><strong>MAC:</strong> {apiTestResult.device.mac}</Typography>
                                </Box>
                              )}
                              <Typography variant="caption" color="text.secondary">Raw Response:</Typography>
                              <pre style={{ margin: 0, fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(apiTestResult, null, 2)}
                              </pre>
                            </>
                          )}
                        </Paper>
                      ) : (
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
                          <Typography variant="body2" color="text.secondary">
                            Click "Test API" to fetch device info
                          </Typography>
                        </Paper>
                      )}
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
