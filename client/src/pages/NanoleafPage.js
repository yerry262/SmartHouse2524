import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Slider,
  Switch,
  FormControlLabel,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import RefreshIcon from '@mui/icons-material/Refresh';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import SettingsIcon from '@mui/icons-material/Settings';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import BrightnessHighIcon from '@mui/icons-material/BrightnessHigh';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import axios from 'axios';
import { motion } from 'framer-motion';

const NanoleafPage = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceState, setDeviceState] = useState(null);
  const [effects, setEffects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // Control states
  const [brightness, setBrightness] = useState(50);
  const [hue, setHue] = useState(120);
  const [saturation, setSaturation] = useState(100);
  const [colorTemp, setColorTemp] = useState(3500);

  // Dialog states
  const [authDialog, setAuthDialog] = useState(false);
  const [connectDialog, setConnectDialog] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [deviceToAuth, setDeviceToAuth] = useState(null);

  useEffect(() => {
    discoverDevices();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(discoverDevices, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadDeviceState();
      loadEffects();
    }
  }, [selectedDevice]);

  const discoverDevices = async () => {
    try {
      setError(null);
      const response = await axios.get('/api/nanoleaf/discover');
      
      if (response.data.installed === false) {
        setError(response.data.message);
      } else if (response.data.devices) {
        setDevices(response.data.devices);
        
        // Select first device if none selected
        if (!selectedDevice && response.data.devices.length > 0) {
          setSelectedDevice(response.data.devices[0]);
        }
      }
    } catch (err) {
      console.error('Error discovering Nanoleaf devices:', err);
      setError('Failed to discover devices: ' + (err.response?.data?.message || err.message));
    }
  };

  const loadDeviceState = async () => {
    if (!selectedDevice) return;

    try {
      const response = await axios.get(`/api/nanoleaf/${selectedDevice.ip}/state`);
      if (response.data.state) {
        const state = response.data.state;
        setDeviceState(state);
        setBrightness(state.brightness || 50);
        setHue(state.hue || 120);
        setSaturation(state.saturation || 100);
        setColorTemp(state.colorTemperature || 3500);
      }
    } catch (err) {
      console.error('Error loading device state:', err);
      if (err.response?.status === 401) {
        // Device not authenticated
        setError('Device not authenticated. Please authenticate first.');
      }
    }
  };

  const loadEffects = async () => {
    if (!selectedDevice) return;

    try {
      const response = await axios.get(`/api/nanoleaf/${selectedDevice.ip}/effects`);
      if (response.data.effects) {
        setEffects(response.data.effects);
      }
    } catch (err) {
      console.error('Error loading effects:', err);
    }
  };

  const handleAuthenticate = async () => {
    if (!deviceToAuth) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/nanoleaf/authenticate', {
        ip: deviceToAuth.ip,
        port: deviceToAuth.port
      });

      if (response.data.success) {
        setSuccess('Authentication successful! Device is now connected.');
        setAuthDialog(false);
        setAuthToken(response.data.authToken);
        setTimeout(() => {
          loadDeviceState();
          loadEffects();
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!deviceToAuth || !authToken.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/nanoleaf/connect', {
        ip: deviceToAuth.ip,
        authToken: authToken.trim(),
        port: deviceToAuth.port
      });

      if (response.data.success) {
        setSuccess('Connected successfully!');
        setConnectDialog(false);
        setTimeout(() => {
          loadDeviceState();
          loadEffects();
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const togglePower = async () => {
    if (!selectedDevice || !deviceState) return;

    setLoading(true);
    try {
      const newState = !deviceState.power;
      await axios.post(`/api/nanoleaf/${selectedDevice.ip}/power`, {
        state: newState
      });
      setDeviceState(prev => ({ ...prev, power: newState }));
      setSuccess(`Device turned ${newState ? 'on' : 'off'}`);
    } catch (err) {
      setError('Failed to toggle power: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const setBrightnessValue = async (value) => {
    if (!selectedDevice) return;

    try {
      await axios.post(`/api/nanoleaf/${selectedDevice.ip}/brightness`, {
        brightness: value,
        duration: 500
      });
      setBrightness(value);
      setDeviceState(prev => ({ ...prev, brightness: value }));
    } catch (err) {
      setError('Failed to set brightness');
    }
  };

  const setColorValue = async () => {
    if (!selectedDevice) return;

    setLoading(true);
    try {
      await axios.post(`/api/nanoleaf/${selectedDevice.ip}/color`, {
        hue,
        saturation,
        lightness: brightness,
        duration: 500
      });
      setDeviceState(prev => ({
        ...prev,
        hue,
        saturation,
        brightness
      }));
      setSuccess('Color updated');
    } catch (err) {
      setError('Failed to set color');
    } finally {
      setLoading(false);
    }
  };

  const setColorTempValue = async (value) => {
    if (!selectedDevice) return;

    try {
      await axios.post(`/api/nanoleaf/${selectedDevice.ip}/color-temp`, {
        temperature: value,
        duration: 500
      });
      setColorTemp(value);
      setDeviceState(prev => ({ ...prev, colorTemperature: value }));
      setSuccess('Color temperature updated');
    } catch (err) {
      setError('Failed to set color temperature');
    }
  };

  const applyEffect = async (effectName) => {
    if (!selectedDevice) return;

    setLoading(true);
    try {
      await axios.post(`/api/nanoleaf/${selectedDevice.ip}/effects/${encodeURIComponent(effectName)}`);
      setDeviceState(prev => ({ ...prev, currentEffect: effectName }));
      setSuccess(`Effect "${effectName}" applied`);
    } catch (err) {
      setError('Failed to apply effect');
    } finally {
      setLoading(false);
    }
  };

  const identifyDevice = async () => {
    if (!selectedDevice) return;

    try {
      await axios.post(`/api/nanoleaf/${selectedDevice.ip}/identify`);
      setSuccess('Device is flashing to identify itself');
    } catch (err) {
      setError('Failed to identify device');
    }
  };

  // Preset colors
  const presetColors = [
    { name: 'Red', hue: 0, saturation: 100 },
    { name: 'Orange', hue: 30, saturation: 100 },
    { name: 'Yellow', hue: 60, saturation: 100 },
    { name: 'Green', hue: 120, saturation: 100 },
    { name: 'Cyan', hue: 180, saturation: 100 },
    { name: 'Blue', hue: 240, saturation: 100 },
    { name: 'Purple', hue: 270, saturation: 100 },
    { name: 'Magenta', hue: 300, saturation: 100 },
    { name: 'White', hue: 0, saturation: 0 },
  ];

  const getHSLColor = (h, s, l) => {
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

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
              Nanoleaf Smart Lights
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Control your Nanoleaf Essentials bulbs and panels
            </Typography>
          </div>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={discoverDevices}
            disabled={loading}
          >
            Discover Devices
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Device Selection */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📡 Discovered Devices ({devices.length})
                </Typography>
                {devices.length === 0 ? (
                  <Typography color="text.secondary">
                    No Nanoleaf devices found. Make sure your devices are connected to the same network.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {devices.map((device, index) => (
                      <Grid item xs={12} md={6} lg={4} key={device.ip}>
                        <Card 
                          variant={selectedDevice?.ip === device.ip ? "outlined" : "elevation"}
                          sx={{ 
                            cursor: 'pointer',
                            border: selectedDevice?.ip === device.ip ? 2 : 1,
                            borderColor: selectedDevice?.ip === device.ip ? 'primary.main' : 'divider'
                          }}
                          onClick={() => setSelectedDevice(device)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <LightbulbIcon color="primary" sx={{ mr: 1 }} />
                              <Typography variant="subtitle1" fontWeight={600}>
                                {device.name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              IP: {device.ip}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Model: {device.model}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                              <ButtonGroup size="small" variant="outlined">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeviceToAuth(device);
                                    setAuthDialog(true);
                                  }}
                                >
                                  Authenticate
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeviceToAuth(device);
                                    setConnectDialog(true);
                                  }}
                                >
                                  Connect
                                </Button>
                              </ButtonGroup>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Device Controls */}
          {selectedDevice && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      🎮 Device Controls - {selectedDevice.name}
                    </Typography>
                    <Box>
                      <IconButton onClick={identifyDevice} title="Identify Device">
                        <FlashOnIcon />
                      </IconButton>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={deviceState?.power || false}
                            onChange={togglePower}
                            disabled={loading}
                          />
                        }
                        label="Power"
                      />
                    </Box>
                  </Box>

                  {deviceState && (
                    <Grid container spacing={3}>
                      {/* Brightness Control */}
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <BrightnessHighIcon sx={{ mr: 1 }} />
                              <Typography variant="subtitle1">
                                Brightness: {brightness}%
                              </Typography>
                            </Box>
                            <Slider
                              value={brightness}
                              onChange={(e, value) => setBrightness(value)}
                              onChangeCommitted={(e, value) => setBrightnessValue(value)}
                              min={1}
                              max={100}
                              valueLabelDisplay="auto"
                              disabled={!deviceState.power}
                            />
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Color Temperature */}
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <SettingsIcon sx={{ mr: 1 }} />
                              <Typography variant="subtitle1">
                                Color Temp: {colorTemp}K
                              </Typography>
                            </Box>
                            <Slider
                              value={colorTemp}
                              onChange={(e, value) => setColorTemp(value)}
                              onChangeCommitted={(e, value) => setColorTempValue(value)}
                              min={1200}
                              max={6500}
                              step={100}
                              valueLabelDisplay="auto"
                              disabled={!deviceState.power}
                            />
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Color Controls */}
                      <Grid item xs={12}>
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <ColorLensIcon sx={{ mr: 1 }} />
                            <Typography>Advanced Color Controls</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={4}>
                                <Typography gutterBottom>Hue: {hue}°</Typography>
                                <Slider
                                  value={hue}
                                  onChange={(e, value) => setHue(value)}
                                  min={0}
                                  max={360}
                                  disabled={!deviceState.power}
                                />
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography gutterBottom>Saturation: {saturation}%</Typography>
                                <Slider
                                  value={saturation}
                                  onChange={(e, value) => setSaturation(value)}
                                  min={0}
                                  max={100}
                                  disabled={!deviceState.power}
                                />
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Box sx={{ mt: 3 }}>
                                  <Button
                                    variant="contained"
                                    onClick={setColorValue}
                                    disabled={!deviceState.power || loading}
                                    fullWidth
                                    sx={{
                                      backgroundColor: getHSLColor(hue, saturation, 50),
                                      '&:hover': {
                                        backgroundColor: getHSLColor(hue, saturation, 40),
                                      }
                                    }}
                                  >
                                    Apply Color
                                  </Button>
                                </Box>
                              </Grid>
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      </Grid>

                      {/* Preset Colors */}
                      <Grid item xs={12}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              🎨 Preset Colors
                            </Typography>
                            <Grid container spacing={1}>
                              {presetColors.map((color) => (
                                <Grid item key={color.name}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                      setHue(color.hue);
                                      setSaturation(color.saturation);
                                      setTimeout(setColorValue, 100);
                                    }}
                                    disabled={!deviceState.power}
                                    sx={{
                                      backgroundColor: getHSLColor(color.hue, color.saturation, 70),
                                      color: color.saturation > 50 ? 'white' : 'black',
                                      '&:hover': {
                                        backgroundColor: getHSLColor(color.hue, color.saturation, 50),
                                      }
                                    }}
                                  >
                                    {color.name}
                                  </Button>
                                </Grid>
                              ))}
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Effects */}
                      {effects.length > 0 && (
                        <Grid item xs={12}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle1" gutterBottom>
                                ✨ Dynamic Effects
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Current: {deviceState.currentEffect || 'None'}
                              </Typography>
                              <List dense>
                                {effects.map((effect, index) => (
                                  <ListItem key={index} divider>
                                    <ListItemText primary={effect} />
                                    <ListItemSecondaryAction>
                                      <IconButton
                                        size="small"
                                        onClick={() => applyEffect(effect)}
                                        disabled={!deviceState.power || loading}
                                        color={deviceState.currentEffect === effect ? "primary" : "default"}
                                      >
                                        <PlayArrowIcon />
                                      </IconButton>
                                    </ListItemSecondaryAction>
                                  </ListItem>
                                ))}
                              </List>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Authentication Dialog */}
        <Dialog open={authDialog} onClose={() => setAuthDialog(false)}>
          <DialogTitle>Authenticate Nanoleaf Device</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              To authenticate with your Nanoleaf device:
            </Typography>
            <Typography variant="body2" component="ol" sx={{ pl: 2 }}>
              <li>Hold the power button on your Nanoleaf device for 5-7 seconds</li>
              <li>The LED will start flashing to indicate pairing mode</li>
              <li>Click "Authenticate" below within 30 seconds</li>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Device: {deviceToAuth?.name} ({deviceToAuth?.ip})
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAuthDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAuthenticate} 
              variant="contained" 
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Authenticate'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Connect Dialog */}
        <Dialog open={connectDialog} onClose={() => setConnectDialog(false)}>
          <DialogTitle>Connect to Nanoleaf Device</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Enter your authentication token to connect:
            </Typography>
            <TextField
              fullWidth
              label="Authentication Token"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              margin="normal"
              placeholder="Enter auth token from previous authentication"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Device: {deviceToAuth?.name} ({deviceToAuth?.ip})
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConnectDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleConnect} 
              variant="contained" 
              disabled={loading || !authToken.trim()}
            >
              {loading ? <CircularProgress size={20} /> : 'Connect'}
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default NanoleafPage;