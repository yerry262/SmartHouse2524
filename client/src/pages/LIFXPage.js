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
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import RefreshIcon from '@mui/icons-material/Refresh';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import axios from 'axios';
import { motion } from 'framer-motion';

const LIFXPage = () => {
  const [lights, setLights] = useState([]);
  const [selectedLight, setSelectedLight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lightStates, setLightStates] = useState({});

  // Color controls
  const [hue, setHue] = useState(120);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(50);
  const [kelvin, setKelvin] = useState(3500);

  useEffect(() => {
    discoverLights();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(discoverLights, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedLight) {
      loadLightState(selectedLight);
    }
  }, [selectedLight]);

  const discoverLights = async () => {
    try {
      const response = await axios.get('/api/lifx/discover');
      
      if (response.data.installed === false) {
        setError(response.data.message);
      } else if (response.data.lights) {
        setLights(response.data.lights);
        
        // Select first light if none selected
        if (!selectedLight && response.data.lights.length > 0) {
          setSelectedLight(response.data.lights[0].id);
        }
      }
    } catch (err) {
      console.error('Error discovering LIFX lights:', err);
      setError('Failed to discover lights: ' + (err.response?.data?.message || err.message));
    }
  };

  const loadLightState = async (lightId) => {
    try {
      const response = await axios.get(`/api/lifx/lights/${lightId}/state`);
      if (response.data.color) {
        setLightStates(prev => ({
          ...prev,
          [lightId]: response.data
        }));
        
        // Update controls
        setHue(response.data.color.hue);
        setSaturation(response.data.color.saturation);
        setBrightness(response.data.color.brightness);
        setKelvin(response.data.color.kelvin || 3500);
      }
    } catch (err) {
      console.error('Error loading light state:', err);
    }
  };

  const turnOn = async (lightId, duration = 0) => {
    try {
      await axios.post(`/api/lifx/lights/${lightId}/on`, { duration });
      setTimeout(() => loadLightState(lightId), 500);
    } catch (err) {
      console.error('Error turning on light:', err);
    }
  };

  const turnOff = async (lightId, duration = 0) => {
    try {
      await axios.post(`/api/lifx/lights/${lightId}/off`, { duration });
      setTimeout(() => loadLightState(lightId), 500);
    } catch (err) {
      console.error('Error turning off light:', err);
    }
  };

  const setColor = async () => {
    if (!selectedLight) return;
    
    setLoading(true);
    try {
      await axios.post(`/api/lifx/lights/${selectedLight}/color`, {
        hue,
        saturation,
        brightness,
        kelvin,
        duration: 500
      });
      setTimeout(() => loadLightState(selectedLight), 500);
    } catch (err) {
      console.error('Error setting color:', err);
    } finally {
      setLoading(false);
    }
  };

  const setColorHex = async (hexColor) => {
    if (!selectedLight) return;
    
    try {
      await axios.post(`/api/lifx/lights/${selectedLight}/color-hex`, {
        hex: hexColor,
        duration: 500
      });
      setTimeout(() => loadLightState(selectedLight), 500);
    } catch (err) {
      console.error('Error setting hex color:', err);
    }
  };

  const applyWaveform = async () => {
    if (!selectedLight) return;
    
    try {
      await axios.post(`/api/lifx/lights/${selectedLight}/waveform`, {
        hue: hue,
        saturation: saturation,
        brightness: brightness,
        kelvin: kelvin,
        transient: true,
        period: 1000,
        cycles: 5,
        skewRatio: 0.5,
        waveform: 1 // SINE
      });
    } catch (err) {
      console.error('Error applying waveform:', err);
    }
  };

  // Preset colors
  const presetColors = [
    { name: 'Red', hex: '#FF0000' },
    { name: 'Orange', hex: '#FF8800' },
    { name: 'Yellow', hex: '#FFFF00' },
    { name: 'Green', hex: '#00FF00' },
    { name: 'Cyan', hex: '#00FFFF' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Purple', hex: '#8800FF' },
    { name: 'Pink', hex: '#FF00FF' },
    { name: 'Warm White', hex: '#FFDDB4' },
    { name: 'Cool White', hex: '#E0F0FF' },
  ];

  const getColorFromHSB = (h, s, b) => {
    s = s / 100;
    b = b / 100;
    const k = (n) => (n + h / 60) % 6;
    const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    const rgb = [f(5), f(3), f(1)].map(x => Math.round(x * 255));
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
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
              LIFX Smart Lights
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Control your LIFX bulbs and light strips
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={discoverLights}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3, background: 'rgba(76, 175, 80, 0.1)' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              💡 LIFX lights are discovered automatically on your local network. Make sure your lights are powered on and connected to the same network.
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Lights List */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Discovered Lights ({lights.length})
                </Typography>
                
                {lights.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <LightbulbIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">
                      No LIFX lights found
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Discovery runs automatically
                    </Typography>
                  </Box>
                ) : (
                  lights.map((light) => {
                    const state = lightStates[light.id];
                    return (
                      <Button
                        key={light.id}
                        fullWidth
                        variant={selectedLight === light.id ? 'contained' : 'outlined'}
                        sx={{ 
                          mb: 1, 
                          justifyContent: 'space-between', 
                          textTransform: 'none',
                          py: 1.5
                        }}
                        onClick={() => setSelectedLight(light.id)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LightbulbIcon />
                          <span>{light.label || light.address}</span>
                        </Box>
                        {state && (
                          <Chip
                            label={state.power === 1 ? 'ON' : 'OFF'}
                            size="small"
                            color={state.power === 1 ? 'success' : 'default'}
                          />
                        )}
                      </Button>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Control Panel */}
          <Grid item xs={12} md={8}>
            {!selectedLight ? (
              <Card>
                <CardContent>
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Select a light to control
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Power Controls */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Power Controls
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => turnOn(selectedLight)}
                      >
                        Turn On
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => turnOff(selectedLight)}
                      >
                        Turn Off
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => turnOn(selectedLight, 2000)}
                      >
                        Fade On (2s)
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => turnOff(selectedLight, 2000)}
                      >
                        Fade Off (2s)
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                {/* Color Controls */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Color Controls
                    </Typography>

                    {/* Color Preview */}
                    <Box
                      sx={{
                        width: '100%',
                        height: 60,
                        borderRadius: 2,
                        mb: 3,
                        background: getColorFromHSB(hue, saturation, brightness),
                        border: '2px solid rgba(255,255,255,0.2)'
                      }}
                    />

                    {/* Hue Slider */}
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Hue: {hue}°
                    </Typography>
                    <Slider
                      value={hue}
                      onChange={(e, newValue) => setHue(newValue)}
                      min={0}
                      max={360}
                      sx={{ mb: 3 }}
                    />

                    {/* Saturation Slider */}
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Saturation: {saturation}%
                    </Typography>
                    <Slider
                      value={saturation}
                      onChange={(e, newValue) => setSaturation(newValue)}
                      min={0}
                      max={100}
                      sx={{ mb: 3 }}
                    />

                    {/* Brightness Slider */}
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Brightness: {brightness}%
                    </Typography>
                    <Slider
                      value={brightness}
                      onChange={(e, newValue) => setBrightness(newValue)}
                      min={0}
                      max={100}
                      sx={{ mb: 3 }}
                    />

                    {/* Color Temperature Slider */}
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Color Temperature: {kelvin}K
                    </Typography>
                    <Slider
                      value={kelvin}
                      onChange={(e, newValue) => setKelvin(newValue)}
                      min={2500}
                      max={9000}
                      sx={{ mb: 3 }}
                    />

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        startIcon={<ColorLensIcon />}
                        onClick={setColor}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Apply Color'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={applyWaveform}
                      >
                        Pulse Effect
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                {/* Preset Colors */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Preset Colors
                    </Typography>
                    <Grid container spacing={2}>
                      {presetColors.map((color) => (
                        <Grid item xs={6} sm={4} md={3} key={color.name}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => setColorHex(color.hex)}
                            sx={{
                              py: 2,
                              borderColor: color.hex,
                              '&:hover': {
                                backgroundColor: color.hex + '20',
                                borderColor: color.hex
                              }
                            }}
                          >
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: color.hex,
                                mr: 1,
                                border: '2px solid rgba(255,255,255,0.3)'
                              }}
                            />
                            {color.name}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </>
            )}
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default LIFXPage;
