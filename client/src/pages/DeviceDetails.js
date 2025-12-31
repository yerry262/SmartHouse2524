import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
  Paper,
  Alert,
  IconButton,
  Slider,
  Avatar,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PrintIcon from '@mui/icons-material/Print';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TvIcon from '@mui/icons-material/Tv';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SpeakerIcon from '@mui/icons-material/Speaker';
import axios from 'axios';
import { motion } from 'framer-motion';

const DeviceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [powerState, setPowerState] = useState(null);
  const [controlError, setControlError] = useState(null);
  
  // Sonos state
  const [sonosStatus, setSonosStatus] = useState(null);
  const [sonosVolume, setSonosVolume] = useState(50);
  const [sonosLoading, setSonosLoading] = useState(false);
  const [sonosProgress, setSonosProgress] = useState(0);

  // Apple TV state
  const [appletvStatus, setAppletvStatus] = useState(null);

  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);

  // Helper to convert time string to seconds (defined before callbacks that use it)
  const timeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const fetchDeviceDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/devices/${id}`);
      setDevice(response.data);
    } catch (error) {
      console.error('Error fetching device details:', error);
    }
    setLoading(false);
  }, [id]);

  const fetchDeviceState = useCallback(async () => {
    if (!device) return;
    const ip = device.ip || device.ipAddress;
    if (!ip) return;

    try {
      if (device.type === 'wemo-plug') {
        const res = await axios.get(`/api/wemo/${ip}/info`);
        // WeMo binaryState can be "0", "1", 0, or 1.
        const state = res.data.binaryState;
        setPowerState(state === 1 || state === '1');
      } else if (device.type && device.type.includes('tplink')) {
        // TP-Link state fetching if needed
      } else if (device.type === 'samsung-tv') {
        const res = await axios.get(`/api/samsung/${ip}/status`);
        setPowerState(res.data.online);
      } else if (device.type === 'sonos' || (device.metadata?.SERVER && device.metadata.SERVER.includes('Sonos'))) {
        // Fetch Sonos status
        setSonosLoading(true);
        try {
          const [statusRes, posRes] = await Promise.all([
            axios.get(`/api/sonos/${ip}/status`),
            axios.get(`/api/sonos/${ip}/position`)
          ]);
          setSonosStatus(statusRes.data);
          setSonosVolume(statusRes.data.volume || 50);
          
          // Calculate progress - duration and position are in seconds
          if (posRes.data.duration && posRes.data.position) {
            const durationSecs = typeof posRes.data.duration === 'string' 
              ? timeToSeconds(posRes.data.duration) 
              : posRes.data.duration;
            const positionSecs = typeof posRes.data.position === 'string' 
              ? timeToSeconds(posRes.data.position) 
              : posRes.data.position;
            if (durationSecs > 0) {
              setSonosProgress((positionSecs / durationSecs) * 100);
            }
          }
        } catch (err) {
          console.error('Error fetching Sonos status:', err);
        }
        setSonosLoading(false);
      } else if (device.type === 'appletv') {
        // Fetch Apple TV status
        try {
          const res = await axios.get(`/api/appletv/${ip}/status`);
          setAppletvStatus(res.data);
        } catch (err) {
          console.error('Error fetching Apple TV status:', err);
        }
      }
    } catch (err) {
      console.error("Error fetching state", err);
    }
  }, [device]);

  useEffect(() => {
    fetchDeviceDetails();
  }, [fetchDeviceDetails]);

  useEffect(() => {
    if (device) {
      fetchDeviceState();
      
      // Auto-refresh for Sonos devices
      const isSonosDevice = device.type === 'sonos' || (device.metadata?.SERVER && device.metadata.SERVER.includes('Sonos'));
      if (isSonosDevice) {
        const interval = setInterval(fetchDeviceState, 3000);
        return () => clearInterval(interval);
      }
    }
  }, [fetchDeviceState, device]);

  const handlePowerToggle = async () => {
    const ip = device.ip || device.ipAddress;
    if (!ip) return;

    setControlError(null);
    const newState = !powerState;
    
    // Optimistic update for simple toggles
    if (device.type !== 'samsung-tv') {
        setPowerState(newState);
    }

    try {
      if (device.type === 'wemo-plug') {
        await axios.post(`/api/wemo/${ip}/power`, { state: newState });
      } else if (device.type && device.type.includes('tplink')) {
        await axios.post(`/api/tplink/${ip}/power`, { state: newState });
      } else if (device.type === 'samsung-tv') {
        await axios.post(`/api/samsung/${ip}/key`, { key: 'KEY_POWER' });
        // Samsung TV power toggle might take time, so we don't optimistically update
        // Instead, we might want to re-fetch status after a delay
        setTimeout(fetchDeviceState, 2000);
      }
    } catch (err) {
      console.error('Error toggling power:', err);
      if (device.type !== 'samsung-tv') {
          setPowerState(!newState); // Revert
      }
      setControlError('Failed to toggle power');
    }
  };

  const handleSamsungKey = async (key) => {
    const ip = device.ip || device.ipAddress;
    if (!ip) return;
    try {
        await axios.post(`/api/samsung/${ip}/key`, { key });
    } catch (err) {
        console.error('Error sending key:', err);
        setControlError('Failed to send command');
    }
  };

  // Sonos control handlers
  const handleSonosPlay = async () => {
    const ip = device.ip || device.ipAddress;
    try {
      await axios.post(`/api/sonos/${ip}/play`);
      fetchDeviceState();
    } catch (err) {
      setControlError('Failed to play');
    }
  };

  const handleSonosPause = async () => {
    const ip = device.ip || device.ipAddress;
    try {
      await axios.post(`/api/sonos/${ip}/pause`);
      fetchDeviceState();
    } catch (err) {
      setControlError('Failed to pause');
    }
  };

  const handleSonosStop = async () => {
    const ip = device.ip || device.ipAddress;
    try {
      await axios.post(`/api/sonos/${ip}/stop`);
      fetchDeviceState();
    } catch (err) {
      setControlError('Failed to stop');
    }
  };

  const handleSonosNext = async () => {
    const ip = device.ip || device.ipAddress;
    try {
      await axios.post(`/api/sonos/${ip}/next`);
      fetchDeviceState();
    } catch (err) {
      setControlError('Failed to skip');
    }
  };

  const handleSonosPrevious = async () => {
    const ip = device.ip || device.ipAddress;
    try {
      await axios.post(`/api/sonos/${ip}/previous`);
      fetchDeviceState();
    } catch (err) {
      setControlError('Failed to go back');
    }
  };

  const handleSonosVolumeChange = async (event, newValue) => {
    setSonosVolume(newValue);
    const ip = device.ip || device.ipAddress;
    try {
      await axios.post(`/api/sonos/${ip}/volume`, { level: newValue });
    } catch (err) {
      console.error('Error changing volume:', err);
    }
  };

  // Test API handler
  const handleTestApi = async () => {
    const ip = device.ip || device.ipAddress;
    if (!ip) return;
    
    setApiTestLoading(true);
    setControlError(null);
    
    try {
      let endpoint = null;
      
      // Determine the correct API endpoint based on device type
      if (device.type === 'appletv') {
        endpoint = `/api/appletv/${ip}/status`;
      } else if (device.type === 'sonos' || (device.metadata?.SERVER && device.metadata.SERVER.includes('Sonos'))) {
        endpoint = `/api/sonos/${ip}/status`;
      } else if (device.type === 'wemo-plug') {
        // WeMo uses status/all and we filter for the specific device
        endpoint = `/api/wemo/status/all`;
      } else if (device.type === 'samsung-tv') {
        endpoint = `/api/samsung/${ip}/status`;
      } else if (device.type && device.type.includes('tplink')) {
        endpoint = `/api/tplink/${ip}/info`;
      } else if (device.type === 'hue') {
        endpoint = `/api/hue/lights`;
      } else if (device.type === 'nanoleaf') {
        endpoint = `/api/nanoleaf/${ip}/status`;
      }
      
      if (endpoint) {
        const res = await axios.get(endpoint);
        
        // For WeMo, filter to find the specific device by IP
        if (device.type === 'wemo-plug' && res.data.devices) {
          const wemoDevice = res.data.devices.find(d => d.host === ip);
          if (wemoDevice) {
            setApiTestResult(wemoDevice);
          } else {
            setApiTestResult({ 
              message: 'Device not found in WeMo discovery. It may need to be re-discovered.',
              allDevices: res.data.devices.map(d => ({ host: d.host, name: d.friendlyName }))
            });
          }
        } else {
          setApiTestResult(res.data);
        }
        setApiTestTimestamp(new Date().toLocaleString());
      } else {
        setApiTestResult({ message: 'No API endpoint available for this device type' });
        setApiTestTimestamp(new Date().toLocaleString());
      }
    } catch (err) {
      setApiTestResult({ error: err.message || 'API request failed', status: err.response?.status });
      setApiTestTimestamp(new Date().toLocaleString());
    }
    
    setApiTestLoading(false);
  };

  // Check if device is a Sonos
  const isSonos = device && (device.type === 'sonos' || (device.metadata?.SERVER && device.metadata.SERVER.includes('Sonos')));

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!device) {
    return (
      <Container maxWidth="lg">
        <Typography>Device not found</Typography>
        <Button onClick={() => navigate('/')} startIcon={<ArrowBackIcon />}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>

        <Card>
          <CardContent>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                {/* Use friendly name from API if available */}
                {isSonos && sonosStatus?.device?.name 
                  ? `${sonosStatus.device.name}${sonosStatus.device.model ? ` (${sonosStatus.device.model})` : ''}`
                  : device.type === 'appletv' && appletvStatus?.device?.name
                  ? `${appletvStatus.device.name}${appletvStatus.device.model ? ` (${appletvStatus.device.model})` : ''}`
                  : device.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={device.status}
                  color={device.status === 'online' ? 'success' : 'error'}
                />
                <Chip label={device.type} variant="outlined" />
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Device Controls */}
            {(device.type === 'wemo-plug' || (device.type && device.type.includes('tplink'))) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Controls
                </Typography>
                {controlError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {controlError}
                  </Alert>
                )}
                <Paper sx={{ p: 2, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <PowerSettingsNewIcon color={powerState ? 'success' : 'action'} />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!powerState}
                        onChange={handlePowerToggle}
                        color="success"
                      />
                    }
                    label={powerState ? "On" : "Off"}
                  />
                </Paper>
              </Box>
            )}

            {/* Samsung TV Controls */}
            {device.type === 'samsung-tv' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TvIcon /> TV Controls
                </Typography>
                {controlError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {controlError}
                  </Alert>
                )}
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography>Power</Typography>
                            <Button 
                                variant={powerState ? "contained" : "outlined"} 
                                color={powerState ? "success" : "error"}
                                onClick={handlePowerToggle}
                                startIcon={<PowerSettingsNewIcon />}
                            >
                                {powerState ? "ON" : "OFF"}
                            </Button>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={8}>
                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography>Volume</Typography>
                            <Button variant="outlined" onClick={() => handleSamsungKey('KEY_VOLUP')} startIcon={<VolumeUpIcon />}>Up</Button>
                            <Button variant="outlined" onClick={() => handleSamsungKey('KEY_VOLDOWN')} startIcon={<VolumeDownIcon />}>Down</Button>
                            <Button variant="outlined" color="warning" onClick={() => handleSamsungKey('KEY_MUTE')} startIcon={<VolumeOffIcon />}>Mute</Button>
                        </Paper>
                    </Grid>
                </Grid>
              </Box>
            )}

            {/* Printer Controls */}
            {(device.type === 'printer' || (device.name && device.name.toLowerCase().includes('epson'))) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PrintIcon /> Printer Status
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>Administration</Typography>
                        <Button 
                          variant="contained" 
                          startIcon={<OpenInNewIcon />}
                          href={`http://${device.ip || device.ipAddress}`}
                          target="_blank"
                          fullWidth
                        >
                          Open Web Interface
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  {device.metadata && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>Network Details</Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Hostname:</Typography>
                              <Typography variant="body2" fontWeight="bold">{device.metadata.host || 'N/A'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Connection:</Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {(device.metadata.type || '').toUpperCase()} / {(device.metadata.protocol || '').toUpperCase()}
                              </Typography>
                            </Box>
                            {device.metadata.fqdn && (
                              <Box>
                                <Typography variant="body2" color="textSecondary">FQDN:</Typography>
                                <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>{device.metadata.fqdn}</Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

            {/* Sonos Controls */}
            {isSonos && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SpeakerIcon /> Sonos Speaker
                </Typography>
                {controlError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {controlError}
                  </Alert>
                )}
                
                {sonosLoading && !sonosStatus ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : sonosStatus ? (
                  <Grid container spacing={2}>
                    {/* Now Playing / Last Played */}
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {sonosStatus.state === 'playing' ? '🎵 Now Playing' : '⏸️ Last Played'}
                            </Typography>
                            <Chip 
                              label={sonosStatus.state?.toUpperCase() || 'UNKNOWN'}
                              color={sonosStatus.state === 'playing' ? 'success' : sonosStatus.state === 'paused' ? 'warning' : 'default'}
                              size="small"
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            {sonosStatus.track?.albumArtURI ? (
                              <Avatar 
                                src={sonosStatus.track.albumArtURI} 
                                sx={{ width: 80, height: 80, borderRadius: 2 }}
                                variant="rounded"
                              />
                            ) : (
                              <Avatar sx={{ width: 80, height: 80, borderRadius: 2, bgcolor: 'primary.main' }} variant="rounded">
                                <MusicNoteIcon sx={{ fontSize: 40 }} />
                              </Avatar>
                            )}
                            
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }} noWrap>
                                {sonosStatus.track?.title || 'No track'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {sonosStatus.track?.artist || 'Unknown artist'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {sonosStatus.track?.album || 'Unknown album'}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* Progress Bar */}
                          <Box sx={{ mb: 2 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={sonosProgress}
                              sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                                }
                              }}
                            />
                          </Box>
                          
                          {/* Playback Controls */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <IconButton onClick={handleSonosPrevious} size="large">
                              <SkipPreviousIcon />
                            </IconButton>
                            
                            {sonosStatus.state === 'playing' ? (
                              <IconButton 
                                onClick={handleSonosPause} 
                                size="large"
                                sx={{ 
                                  backgroundColor: 'primary.main', 
                                  color: 'white',
                                  '&:hover': { backgroundColor: 'primary.dark' }
                                }}
                              >
                                <PauseIcon />
                              </IconButton>
                            ) : (
                              <IconButton 
                                onClick={handleSonosPlay} 
                                size="large"
                                sx={{ 
                                  backgroundColor: 'primary.main', 
                                  color: 'white',
                                  '&:hover': { backgroundColor: 'primary.dark' }
                                }}
                              >
                                <PlayArrowIcon />
                              </IconButton>
                            )}
                            
                            <IconButton onClick={handleSonosStop} size="large">
                              <StopIcon />
                            </IconButton>
                            
                            <IconButton onClick={handleSonosNext} size="large">
                              <SkipNextIcon />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Volume Control */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <VolumeUpIcon />
                            <Typography variant="subtitle1" fontWeight="bold">Volume ({sonosVolume}%)</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <VolumeOffIcon fontSize="small" />
                            <Slider
                              value={sonosVolume}
                              onChange={handleSonosVolumeChange}
                              min={0}
                              max={100}
                              valueLabelDisplay="auto"
                              sx={{ flexGrow: 1 }}
                            />
                            <VolumeUpIcon fontSize="small" />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Device Info */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Speaker Info</Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Room</Typography>
                              <Typography variant="body2">{sonosStatus.device?.name || 'Unknown'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Model</Typography>
                              <Typography variant="body2">{sonosStatus.device?.model || 'Unknown'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Software</Typography>
                              <Typography variant="body2">{sonosStatus.device?.softwareVersion || 'Unknown'}</Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                ) : (
                  <Alert severity="info">
                    Unable to fetch Sonos status. The speaker may be a slave in a group.
                    <Button 
                      size="small" 
                      onClick={fetchDeviceState} 
                      sx={{ ml: 2 }}
                    >
                      Retry
                    </Button>
                  </Alert>
                )}
              </Box>
            )}

            {/* API Test Section */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  API Response
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleTestApi}
                  disabled={apiTestLoading}
                  size="small"
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)' }
                  }}
                >
                  {apiTestLoading ? <CircularProgress size={20} color="inherit" /> : 'Test API'}
                </Button>
              </Box>
              
              {apiTestTimestamp && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Last tested: {apiTestTimestamp}
                </Typography>
              )}
              
              {apiTestResult && (
                <Paper 
                  sx={{ 
                    p: 2, 
                    background: 'rgba(0, 0, 0, 0.3)', 
                    borderRadius: 2,
                    maxHeight: 400,
                    overflow: 'auto'
                  }}
                >
                  {apiTestResult.error ? (
                    <Alert severity="error" sx={{ mb: 1 }}>
                      {apiTestResult.error} {apiTestResult.status && `(Status: ${apiTestResult.status})`}
                    </Alert>
                  ) : (
                    <Box>
                      {/* Show key fields in a nice format if available */}
                      {(apiTestResult.device || apiTestResult.playing || apiTestResult.currentTrack) && (
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          {apiTestResult.device && (
                            <Grid item xs={12} sm={6}>
                              <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                  <Typography variant="subtitle2" color="primary" gutterBottom>Device Info</Typography>
                                  {apiTestResult.device.name && (
                                    <Typography variant="body2">Name: <strong>{apiTestResult.device.name}</strong></Typography>
                                  )}
                                  {apiTestResult.device.model && (
                                    <Typography variant="body2">Model: {apiTestResult.device.model}</Typography>
                                  )}
                                  {apiTestResult.device.mac && (
                                    <Typography variant="body2">MAC: {apiTestResult.device.mac}</Typography>
                                  )}
                                  {apiTestResult.device.softwareVersion && (
                                    <Typography variant="body2">Software: {apiTestResult.device.softwareVersion}</Typography>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          )}
                          {apiTestResult.currentTrack && (
                            <Grid item xs={12} sm={6}>
                              <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                  <Typography variant="subtitle2" color="primary" gutterBottom>Now Playing</Typography>
                                  {apiTestResult.currentTrack.title && (
                                    <Typography variant="body2">Title: <strong>{apiTestResult.currentTrack.title}</strong></Typography>
                                  )}
                                  {apiTestResult.currentTrack.artist && (
                                    <Typography variant="body2">Artist: {apiTestResult.currentTrack.artist}</Typography>
                                  )}
                                  {apiTestResult.currentTrack.album && (
                                    <Typography variant="body2">Album: {apiTestResult.currentTrack.album}</Typography>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          )}
                          {apiTestResult.playing !== undefined && (
                            <Grid item xs={12} sm={6}>
                              <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                  <Typography variant="subtitle2" color="primary" gutterBottom>Status</Typography>
                                  <Typography variant="body2">
                                    Playing: <Chip size="small" label={apiTestResult.playing ? 'Yes' : 'No'} color={apiTestResult.playing ? 'success' : 'default'} />
                                  </Typography>
                                  {apiTestResult.volume !== undefined && (
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>Volume: {apiTestResult.volume}%</Typography>
                                  )}
                                  {apiTestResult.muted !== undefined && (
                                    <Typography variant="body2">Muted: {apiTestResult.muted ? 'Yes' : 'No'}</Typography>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          )}
                        </Grid>
                      )}
                      
                      {/* Raw JSON response */}
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Raw Response</Typography>
                      <Box
                        sx={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          p: 1.5,
                          borderRadius: 1,
                          overflow: 'auto',
                          maxHeight: 200
                        }}
                      >
                        <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {JSON.stringify(apiTestResult, null, 2)}
                        </pre>
                      </Box>
                    </Box>
                  )}
                </Paper>
              )}
              
              {!apiTestResult && !apiTestLoading && (
                <Paper sx={{ p: 3, textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
                  <Typography variant="body2" color="text.secondary">
                    Click "Test API" to fetch live data from this device
                  </Typography>
                </Paper>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Device Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      IP Address
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {device.ip || device.ipAddress}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Port
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {device.port || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Last Seen
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {new Date(device.lastSeen).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Metadata
                </Typography>
                <Box
                  sx={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    p: 2,
                    borderRadius: 2,
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  <pre style={{ margin: 0, fontSize: '0.85rem' }}>
                    {JSON.stringify(device.metadata, null, 2)}
                  </pre>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
};

export default DeviceDetails;
