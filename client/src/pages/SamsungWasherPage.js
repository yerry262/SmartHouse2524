import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import TimerIcon from '@mui/icons-material/Timer';
import axios from 'axios';
import { motion } from 'framer-motion';

const SamsungWasherPage = () => {
  const [washers, setWashers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [packageInstalled, setPackageInstalled] = useState(true);
  const [tokenRequired, setTokenRequired] = useState(false);
  const [selectedWasher, setSelectedWasher] = useState(null);
  const [washerStatus, setWasherStatus] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Available washer modes
  const washerModes = [
    { value: 'normal', label: 'Normal' },
    { value: 'heavy', label: 'Heavy Duty' },
    { value: 'delicate', label: 'Delicate' },
    { value: 'quick', label: 'Quick Wash' },
    { value: 'eco', label: 'Eco' },
    { value: 'cotton', label: 'Cotton' },
    { value: 'synthetic', label: 'Synthetic' },
    { value: 'wool', label: 'Wool' },
  ];

  useEffect(() => {
    fetchWashers();
  }, []);

  const fetchWashers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/samsung-washer/washers');
      
      if (response.data.installed === false) {
        setPackageInstalled(false);
        setError(response.data.message);
      } else if (response.data.tokenRequired) {
        setTokenRequired(true);
        setError(response.data.message);
      } else {
        setWashers(response.data.washers || []);
        setPackageInstalled(true);
        setTokenRequired(false);
        
        // Auto-select first washer and get its status
        if (response.data.washers && response.data.washers.length > 0) {
          setSelectedWasher(response.data.washers[0]);
          fetchWasherStatus(response.data.washers[0].deviceId);
        }
      }
    } catch (err) {
      setError('Failed to fetch washers: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const discoverWashers = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.get('/api/samsung-washer/discover');
      
      if (response.data.installed === false) {
        setPackageInstalled(false);
        setError(response.data.message);
      } else if (response.data.tokenRequired) {
        setTokenRequired(true);
        setError(response.data.message);
      } else if (response.data.error) {
        setError(response.data.error);
      } else {
        setWashers(response.data.washers || []);
        setSuccess(`Found ${response.data.found} Samsung washer(s)`);
        setPackageInstalled(true);
        setTokenRequired(false);
        
        if (response.data.washers && response.data.washers.length > 0) {
          setSelectedWasher(response.data.washers[0]);
          fetchWasherStatus(response.data.washers[0].deviceId);
        }
      }
    } catch (err) {
      setError('Discovery failed: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWasherStatus = async (deviceId) => {
    setRefreshing(true);
    try {
      const response = await axios.get(`/api/samsung-washer/washers/${deviceId}/status`);
      if (response.data.success) {
        setWasherStatus(prev => ({
          ...prev,
          [deviceId]: response.data.status
        }));
      }
    } catch (err) {
      console.error('Error fetching washer status:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const togglePower = async (deviceId) => {
    try {
      const currentStatus = washerStatus[deviceId];
      const newState = currentStatus?.power !== 'on';
      
      const response = await axios.post(`/api/samsung-washer/washers/${deviceId}/power`, {
        state: newState
      });
      
      if (response.data.success) {
        setSuccess(`Washer turned ${newState ? 'on' : 'off'}`);
        setTimeout(() => fetchWasherStatus(deviceId), 1000);
      }
    } catch (err) {
      setError('Failed to toggle power: ' + (err.response?.data?.error || err.message));
    }
  };

  const setWasherMode = async (deviceId, mode) => {
    try {
      const response = await axios.post(`/api/samsung-washer/washers/${deviceId}/mode`, {
        mode
      });
      
      if (response.data.success) {
        setSuccess(`Washer mode set to ${mode}`);
        setTimeout(() => fetchWasherStatus(deviceId), 1000);
      }
    } catch (err) {
      setError('Failed to set mode: ' + (err.response?.data?.error || err.message));
    }
  };

  const startWashing = async (deviceId) => {
    try {
      const response = await axios.post(`/api/samsung-washer/washers/${deviceId}/start`);
      
      if (response.data.success) {
        setSuccess('Washing cycle started');
        setTimeout(() => fetchWasherStatus(deviceId), 1000);
      }
    } catch (err) {
      setError('Failed to start washing: ' + (err.response?.data?.error || err.message));
    }
  };

  const stopWashing = async (deviceId) => {
    try {
      const response = await axios.post(`/api/samsung-washer/washers/${deviceId}/stop`);
      
      if (response.data.success) {
        setSuccess('Washing cycle stopped');
        setTimeout(() => fetchWasherStatus(deviceId), 1000);
      }
    } catch (err) {
      setError('Failed to stop washing: ' + (err.response?.data?.error || err.message));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'on':
      case 'running':
      case 'wash':
        return 'success';
      case 'pause':
      case 'stop':
        return 'warning';
      case 'off':
        return 'default';
      case 'complete':
        return 'info';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatOperatingState = (state) => {
    if (!state) return 'Unknown';
    return state.charAt(0).toUpperCase() + state.slice(1).replace(/([A-Z])/g, ' $1');
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <LocalLaundryServiceIcon sx={{ fontSize: 40, color: '#1428A0' }} />
              Samsung Washers
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Control your Samsung smart washers
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={discoverWashers}
            disabled={loading}
            sx={{ background: 'linear-gradient(45deg, #1428A0, #1565C0)' }}
          >
            Discover
          </Button>
        </Box>

        {/* Loading */}
        {loading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress />
          </Box>
        )}

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Package Installation Warning */}
        {!packageInstalled && (
          <Card sx={{ mb: 3, background: 'rgba(255, 152, 0, 0.1)' }}>
            <CardContent>
              <Typography variant="h6" color="warning.main" sx={{ mb: 1 }}>
                📦 Package Installation Required
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The Samsung SmartThings SDK is not installed. Install it to control Samsung washers.
              </Typography>
              <Box sx={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.1)', p: 2, borderRadius: 1 }}>
                npm install @smartthings/core-sdk
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Token Required Warning */}
        {tokenRequired && (
          <Card sx={{ mb: 3, background: 'rgba(33, 150, 243, 0.1)' }}>
            <CardContent>
              <Typography variant="h6" color="info.main" sx={{ mb: 1 }}>
                🔑 SmartThings Token Required
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add your SmartThings Personal Access Token to the .env file:
              </Typography>
              <Box sx={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.1)', p: 2, borderRadius: 1 }}>
                SMARTTHINGS_TOKEN=your_token_here
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Get your token from: <strong>SmartThings Developer Portal → Personal Access Tokens</strong>
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Washers List and Control */}
        {packageInstalled && !tokenRequired && (
          <Grid container spacing={3}>
            {/* Washers List */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Available Washers ({washers.length})
                  </Typography>
                  
                  {washers.length === 0 ? (
                    <Typography color="text.secondary">
                      No Samsung washers found. Click "Discover" to search for devices.
                    </Typography>
                  ) : (
                    washers.map((washer) => (
                      <Paper
                        key={washer.deviceId}
                        sx={{
                          p: 2,
                          mb: 2,
                          background: selectedWasher?.deviceId === washer.deviceId 
                            ? 'rgba(20, 40, 160, 0.1)' 
                            : 'rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer',
                          border: selectedWasher?.deviceId === washer.deviceId 
                            ? '2px solid #1428A0' 
                            : '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                        onClick={() => {
                          setSelectedWasher(washer);
                          fetchWasherStatus(washer.deviceId);
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {washer.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {washer.model}
                        </Typography>
                        {washerStatus[washer.deviceId] && (
                          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            <Chip
                              size="small"
                              label={washerStatus[washer.deviceId].power || 'Unknown'}
                              color={getStatusColor(washerStatus[washer.deviceId].power)}
                            />
                            <Chip
                              size="small"
                              label={formatOperatingState(washerStatus[washer.deviceId].operatingState)}
                              color={getStatusColor(washerStatus[washer.deviceId].operatingState)}
                            />
                          </Box>
                        )}
                      </Paper>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Washer Control Panel */}
            <Grid item xs={12} md={8}>
              {!selectedWasher ? (
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <LocalLaundryServiceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">
                      Select a washer to view controls
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Status Card */}
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedWasher.name} Status
                        </Typography>
                        <IconButton 
                          onClick={() => fetchWasherStatus(selectedWasher.deviceId)}
                          disabled={refreshing}
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Box>

                      {washerStatus[selectedWasher.deviceId] ? (
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <PowerSettingsNewIcon color="action" />
                              <Typography variant="body2">Power:</Typography>
                              <Chip 
                                size="small" 
                                label={washerStatus[selectedWasher.deviceId].power || 'Unknown'}
                                color={getStatusColor(washerStatus[selectedWasher.deviceId].power)}
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <SettingsIcon color="action" />
                              <Typography variant="body2">State:</Typography>
                              <Chip 
                                size="small" 
                                label={formatOperatingState(washerStatus[selectedWasher.deviceId].operatingState)}
                                color={getStatusColor(washerStatus[selectedWasher.deviceId].operatingState)}
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <LocalLaundryServiceIcon color="action" />
                              <Typography variant="body2">Mode:</Typography>
                              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                {washerStatus[selectedWasher.deviceId].washerMode || 'Unknown'}
                              </Typography>
                            </Box>
                          </Grid>
                          {washerStatus[selectedWasher.deviceId].temperature && (
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <ThermostatIcon color="action" />
                                <Typography variant="body2">Temperature:</Typography>
                                <Typography variant="body2">
                                  {washerStatus[selectedWasher.deviceId].temperature}°C
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          {washerStatus[selectedWasher.deviceId].progress > 0 && (
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <TimerIcon color="action" />
                                <Typography variant="body2">Progress:</Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={washerStatus[selectedWasher.deviceId].progress} 
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {washerStatus[selectedWasher.deviceId].progress}%
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      ) : (
                        <Typography color="text.secondary">
                          Loading status...
                        </Typography>
                      )}
                    </CardContent>
                  </Card>

                  {/* Controls Card */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        Washer Controls
                      </Typography>

                      {/* Power Controls */}
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                          Power & Cycle
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Button
                            variant={washerStatus[selectedWasher.deviceId]?.power === 'on' ? 'contained' : 'outlined'}
                            startIcon={<PowerSettingsNewIcon />}
                            onClick={() => togglePower(selectedWasher.deviceId)}
                            color={washerStatus[selectedWasher.deviceId]?.power === 'on' ? 'error' : 'success'}
                          >
                            {washerStatus[selectedWasher.deviceId]?.power === 'on' ? 'Turn Off' : 'Turn On'}
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => startWashing(selectedWasher.deviceId)}
                            color="success"
                            disabled={washerStatus[selectedWasher.deviceId]?.operatingState === 'running'}
                          >
                            Start Cycle
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<StopIcon />}
                            onClick={() => stopWashing(selectedWasher.deviceId)}
                            color="warning"
                            disabled={washerStatus[selectedWasher.deviceId]?.operatingState !== 'running'}
                          >
                            Stop/Pause
                          </Button>
                        </Box>
                      </Box>

                      {/* Washer Mode Selection */}
                      <Box>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                          Wash Mode
                        </Typography>
                        <FormControl sx={{ minWidth: 200 }}>
                          <InputLabel>Select Mode</InputLabel>
                          <Select
                            value={washerStatus[selectedWasher.deviceId]?.washerMode || ''}
                            label="Select Mode"
                            onChange={(e) => setWasherMode(selectedWasher.deviceId, e.target.value)}
                          >
                            {washerModes.map((mode) => (
                              <MenuItem key={mode.value} value={mode.value}>
                                {mode.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </CardContent>
                  </Card>
                </>
              )}
            </Grid>
          </Grid>
        )}
      </motion.div>
    </Container>
  );
};

export default SamsungWasherPage;