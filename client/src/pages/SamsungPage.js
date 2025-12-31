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
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import RefreshIcon from '@mui/icons-material/Refresh';
import ApiIcon from '@mui/icons-material/Api';
import axios from 'axios';
import { motion } from 'framer-motion';

const SamsungPage = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [tvStatus, setTvStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);

  useEffect(() => {
    discoverDevices();
  }, []);

  const discoverDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/samsung/discover');
      setDevices(response.data.tvs || []);
    } catch (error) {
      console.error('Error discovering Samsung TVs:', error);
    }
    setLoading(false);
  };

  const handleTestApi = async () => {
    if (!selectedDevice) return;
    setApiTestLoading(true);
    try {
      const response = await axios.get(`/api/samsung/${selectedDevice}/status`);
      setApiTestResult(response.data);
      setApiTestTimestamp(new Date().toLocaleString());
    } catch (err) {
      setApiTestResult({ error: err.message || 'API request failed', status: err.response?.status });
      setApiTestTimestamp(new Date().toLocaleString());
    }
    setApiTestLoading(false);
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
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={discoverDevices}
            disabled={loading}
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

                    {/* API Test Section */}
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
                            <Alert severity="error">{apiTestResult.error}</Alert>
                          ) : (
                            <>
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2"><strong>Online:</strong> {apiTestResult.online ? 'Yes' : 'No'}</Typography>
                                {apiTestResult.name && <Typography variant="body2"><strong>Name:</strong> {apiTestResult.name}</Typography>}
                              </Box>
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
                            Click "Test API" to fetch TV status
                          </Typography>
                        </Paper>
                      )}
                    </Box>
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
