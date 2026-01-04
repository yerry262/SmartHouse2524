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
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import VideocamIcon from '@mui/icons-material/Videocam';
import SettingsIcon from '@mui/icons-material/Settings';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import HomeIcon from '@mui/icons-material/Home';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import InputIcon from '@mui/icons-material/Input';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
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

  // Camera state
  const [cameraInfo, setCameraInfo] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [showStream, setShowStream] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const [selectedStreamType, setSelectedStreamType] = useState('mjpeg'); // 'desktop', 'mobile', 'mjpeg', 'snapshot'

  // Samsung TV state
  const [samsungTvInfo, setSamsungTvInfo] = useState(null);
  const [samsungTvLoading, setSamsungTvLoading] = useState(false);
  const [samsungPaired, setSamsungPaired] = useState(false);
  const [samsungPairing, setSamsungPairing] = useState(false);
  const [samsungPairMessage, setSamsungPairMessage] = useState(null);

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
      if (device.type === 'wemo-plug' || device.type === 'wemo' || device.type?.toLowerCase().includes('wemo')) {
        const res = await axios.get(`/api/wemo/${ip}/status`);
        // WeMo binaryState can be "0", "1", 0, or 1.
        const state = res.data.binaryState;
        setPowerState(state === 1 || state === '1');
      } else if (device.type && device.type.includes('tplink')) {
        // TP-Link state fetching if needed
      } else if (device.type === 'samsung-tv') {
        setSamsungTvLoading(true);
        try {
          const res = await axios.get(`/api/samsung/${ip}/status`);
          setPowerState(res.data.online);
          setSamsungTvInfo(res.data);
        } catch (err) {
          console.error('Error fetching Samsung TV status:', err);
        }
        setSamsungTvLoading(false);
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
      
      // Check Samsung TV pairing status
      if (device.type === 'samsung-tv') {
        checkSamsungPairingStatus();
      }
      
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
      if (device.type === 'wemo-plug' || device.type === 'wemo' || device.type?.toLowerCase().includes('wemo')) {
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

  // Samsung TV pairing handler
  const handleSamsungPair = async () => {
    const ip = device.ip || device.ipAddress;
    if (!ip) return;
    
    setSamsungPairing(true);
    setSamsungPairMessage(null);
    
    try {
      const mac = samsungTvInfo?.wifiMac || '';
      const response = await axios.post(`/api/samsung/${ip}/pair`, { mac });
      
      setSamsungPaired(response.data.paired || response.data.success);
      setSamsungPairMessage(response.data.message);
      
      if (response.data.paired || response.data.success) {
        // Refresh status after successful pairing
        fetchDeviceState();
      }
    } catch (err) {
      console.error('Error pairing Samsung TV:', err);
      setSamsungPairMessage(err.response?.data?.message || 'Pairing failed. Make sure TV is on and try again.');
    }
    setSamsungPairing(false);
  };

  // Check Samsung TV pairing status
  const checkSamsungPairingStatus = async () => {
    const ip = device?.ip || device?.ipAddress;
    if (!ip) return;
    
    try {
      const response = await axios.get(`/api/samsung/${ip}/paired`);
      setSamsungPaired(response.data.paired);
    } catch (err) {
      // Ignore errors
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

  // Camera control handlers
  const handleCameraTest = async () => {
    const ip = device.ip || device.ipAddress;
    if (!ip) return;
    
    setCameraLoading(true);
    setControlError(null);
    
    try {
      const res = await axios.post('/api/cameras/probe', { ip, port: device.port || 80 });
      setCameraInfo(res.data);
    } catch (err) {
      console.error('Error testing camera:', err);
      setControlError('Failed to connect to camera');
    } finally {
      setCameraLoading(false);
    }
  };

  const handleViewStream = () => {
    setStreamError(false);
    setShowStream(true);
  };

  const handleCloseStream = () => {
    setShowStream(false);
  };

  const handleStreamError = () => {
    setStreamError(true);
  };

  const handleSnapshot = async () => {
    const ip = device.ip || device.ipAddress;
    const port = device.port || 80;
    // Generate snapshot URL with timestamp to force reload
    const timestamp = Date.now();
    setSnapshotUrl(`http://${ip}:${port}/media/?action=snapshot&t=${timestamp}`);
  };

  const handleOpenCameraSettings = () => {
    const ip = device.ip || device.ipAddress;
    const port = device.port || 80;
    window.open(`http://${ip}:${port}/setting.asp`, '_blank');
  };

  const handleOpenCameraWebUI = () => {
    const ip = device.ip || device.ipAddress;
    const port = device.port || 80;
    window.open(`http://${ip}:${port}/`, '_blank');
  };

  // Get all available camera stream options
  const getCameraStreamOptions = () => {
    const ip = device.ip || device.ipAddress;
    const port = device.port || 80;
    
    return {
      desktop: {
        label: 'Desktop Stream (ActiveX)',
        directUrl: `http://${ip}:${port}/video/livesp.asp`,
        proxyUrl: `/api/cameras/proxy/${ip}/${port}/video/livesp.asp`,
        description: 'Best for Chrome/Edge on desktop'
      },
      mobile: {
        label: 'Mobile Stream (HTML5)',
        directUrl: `http://${ip}:${port}/video/livemb.asp`,
        proxyUrl: `/api/cameras/proxy/${ip}/${port}/video/livemb.asp`,
        description: 'Works on iOS Safari and mobile browsers'
      },
      mjpeg: {
        label: 'MJPEG Stream',
        directUrl: `http://${ip}:${port}/media/?action=stream`,
        proxyUrl: `/api/cameras/proxy/${ip}/${port}/media/?action=stream`,
        description: 'Universal MJPEG - works on most browsers'
      },
      snapshot: {
        label: 'Snapshot (Image)',
        directUrl: `http://${ip}:${port}/media/?action=snapshot`,
        proxyUrl: `/api/cameras/proxy/${ip}/${port}/media/?action=snapshot`,
        description: 'Static image - refreshes manually'
      }
    };
  };

  const getCameraStreamUrl = () => {
    const ip = device.ip || device.ipAddress;
    const port = device.port || 80;
    const options = getCameraStreamOptions();
    
    // Return the selected stream type URL
    if (options[selectedStreamType]) {
      return options[selectedStreamType].directUrl;
    }
    
    // Try the camera's stream URL from probe
    if (cameraInfo?.streamUrl) {
      return cameraInfo.streamUrl;
    }
    // Default to mobile stream (most compatible)
    return `http://${ip}:${port}/video/livemb.asp`;
  };

  const getCameraProxyStreamUrl = () => {
    const ip = device.ip || device.ipAddress;
    const port = device.port || 80;
    const options = getCameraStreamOptions();
    
    // Return the selected stream type proxy URL
    if (options[selectedStreamType]) {
      return options[selectedStreamType].proxyUrl;
    }
    
    // Default to mobile stream proxy
    return `/api/cameras/proxy/${ip}/${port}/video/livemb.asp`;
  };

  // Check if device is a camera
  const isCamera = device?.type === 'camera' || 
    device?.type === 'ip-camera' || 
    device?.deviceType === 'camera' ||
    device?.metadata?.deviceType === 'camera' ||
    device?.name?.toLowerCase().includes('cam') ||
    device?.name?.toLowerCase().includes('ipcam');

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
      } else if (device.type === 'wemo-plug' || device.type === 'wemo') {
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
        if ((device.type === 'wemo-plug' || device.type === 'wemo') && res.data.devices) {
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
      <Container maxWidth="lg" sx={{ pt: 3 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!device) {
    return (
      <Container maxWidth="lg" sx={{ pt: 3 }}>
        <Typography>Device not found</Typography>
        <Button onClick={() => navigate('/')} startIcon={<ArrowBackIcon />}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pt: 3 }}>
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
            {(device.type === 'wemo-plug' || device.type === 'wemo' || device.type?.toLowerCase().includes('wemo') || (device.type && device.type.includes('tplink'))) && (
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
                  <TvIcon /> Samsung TV Controls
                </Typography>
                {controlError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setControlError(null)}>
                    {controlError}
                  </Alert>
                )}
                
                {/* TV Info Card */}
                {samsungTvInfo && (
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip 
                            label={powerState ? 'ONLINE' : 'OFFLINE'} 
                            color={powerState ? 'success' : 'default'}
                            size="small"
                          />
                          {samsungPaired && (
                            <Chip 
                              icon={<LinkIcon />}
                              label="Paired" 
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {samsungTvLoading && <CircularProgress size={16} />}
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          Model: {samsungTvInfo.model || 'Unknown'}
                        </Typography>
                        {samsungTvInfo.resolution && (
                          <Typography variant="body2" color="textSecondary">
                            Resolution: {samsungTvInfo.resolution}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        {samsungTvInfo.wifiMac && (
                          <Typography variant="body2" color="textSecondary">
                            WiFi MAC: {samsungTvInfo.wifiMac}
                          </Typography>
                        )}
                        {samsungTvInfo.responseTime && (
                          <Typography variant="body2" color="textSecondary">
                            Response: {samsungTvInfo.responseTime}ms
                          </Typography>
                        )}
                        <Button
                          variant={samsungPaired ? "outlined" : "contained"}
                          color={samsungPaired ? "success" : "primary"}
                          size="small"
                          onClick={handleSamsungPair}
                          startIcon={samsungPairing ? <CircularProgress size={14} /> : <LinkIcon />}
                          disabled={samsungPairing}
                          sx={{ mt: 1 }}
                        >
                          {samsungPaired ? 'Re-Pair' : 'Pair TV'}
                        </Button>
                      </Grid>
                    </Grid>
                    {samsungPairMessage && (
                      <Alert 
                        severity={samsungPaired ? 'success' : 'info'} 
                        sx={{ mt: 2, fontSize: '0.8rem' }}
                        onClose={() => setSamsungPairMessage(null)}
                      >
                        {samsungPairMessage}
                      </Alert>
                    )}
                  </Paper>
                )}
                
                <Grid container spacing={2}>
                  {/* Power Control */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>Power</Typography>
                      <Button 
                        variant={powerState ? "contained" : "outlined"} 
                        color={powerState ? "success" : "error"}
                        onClick={handlePowerToggle}
                        startIcon={<PowerSettingsNewIcon />}
                        fullWidth
                        sx={{ py: 1.5 }}
                      >
                        {powerState ? "ON" : "OFF"}
                      </Button>
                    </Paper>
                  </Grid>
                  
                  {/* Volume Controls */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>Volume</Typography>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton 
                          onClick={() => handleSamsungKey('KEY_VOLDOWN')} 
                          sx={{ bgcolor: 'action.hover' }}
                        >
                          <VolumeDownIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleSamsungKey('KEY_MUTE')} 
                          color="warning"
                          sx={{ bgcolor: 'action.hover' }}
                        >
                          <VolumeOffIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleSamsungKey('KEY_VOLUP')} 
                          sx={{ bgcolor: 'action.hover' }}
                        >
                          <VolumeUpIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Channel Controls */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>Channel</Typography>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton 
                          onClick={() => handleSamsungKey('KEY_CHDOWN')} 
                          sx={{ bgcolor: 'action.hover' }}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleSamsungKey('KEY_CH_LIST')} 
                          sx={{ bgcolor: 'action.hover' }}
                        >
                          <TvIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleSamsungKey('KEY_CHUP')} 
                          sx={{ bgcolor: 'action.hover' }}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Source/Input */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>Input</Typography>
                      <Button 
                        variant="outlined" 
                        onClick={() => handleSamsungKey('KEY_SOURCE')}
                        startIcon={<InputIcon />}
                        fullWidth
                      >
                        Source
                      </Button>
                    </Paper>
                  </Grid>
                  
                  {/* Navigation D-Pad */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom>Navigation</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <IconButton 
                          onClick={() => handleSamsungKey('KEY_UP')} 
                          sx={{ bgcolor: 'action.hover' }}
                          size="large"
                        >
                          <ArrowUpwardIcon />
                        </IconButton>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <IconButton 
                            onClick={() => handleSamsungKey('KEY_LEFT')} 
                            sx={{ bgcolor: 'action.hover' }}
                            size="large"
                          >
                            <ArrowBackIosIcon />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleSamsungKey('KEY_ENTER')} 
                            color="primary"
                            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                            size="large"
                          >
                            <RadioButtonCheckedIcon />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleSamsungKey('KEY_RIGHT')} 
                            sx={{ bgcolor: 'action.hover' }}
                            size="large"
                          >
                            <ArrowForwardIosIcon />
                          </IconButton>
                        </Box>
                        <IconButton 
                          onClick={() => handleSamsungKey('KEY_DOWN')} 
                          sx={{ bgcolor: 'action.hover' }}
                          size="large"
                        >
                          <ArrowDownwardIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Menu/Home/Back */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom textAlign="center">Quick Actions</Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <Button 
                            variant="outlined" 
                            onClick={() => handleSamsungKey('KEY_HOME')}
                            startIcon={<HomeIcon />}
                            fullWidth
                            size="small"
                          >
                            Home
                          </Button>
                        </Grid>
                        <Grid item xs={4}>
                          <Button 
                            variant="outlined" 
                            onClick={() => handleSamsungKey('KEY_RETURN')}
                            startIcon={<KeyboardReturnIcon />}
                            fullWidth
                            size="small"
                          >
                            Back
                          </Button>
                        </Grid>
                        <Grid item xs={4}>
                          <Button 
                            variant="outlined" 
                            onClick={() => handleSamsungKey('KEY_MENU')}
                            startIcon={<SettingsIcon />}
                            fullWidth
                            size="small"
                          >
                            Menu
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button 
                            variant="outlined" 
                            onClick={() => handleSamsungKey('KEY_INFO')}
                            fullWidth
                            size="small"
                          >
                            Info
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button 
                            variant="outlined" 
                            onClick={() => handleSamsungKey('KEY_GUIDE')}
                            fullWidth
                            size="small"
                          >
                            Guide
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  {/* Playback Controls */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom textAlign="center">Playback</Typography>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <IconButton onClick={() => handleSamsungKey('KEY_REWIND')} sx={{ bgcolor: 'action.hover' }}>
                          <SkipPreviousIcon />
                        </IconButton>
                        <IconButton onClick={() => handleSamsungKey('KEY_PLAY')} color="success" sx={{ bgcolor: 'action.hover' }}>
                          <PlayArrowIcon />
                        </IconButton>
                        <IconButton onClick={() => handleSamsungKey('KEY_PAUSE')} color="warning" sx={{ bgcolor: 'action.hover' }}>
                          <PauseIcon />
                        </IconButton>
                        <IconButton onClick={() => handleSamsungKey('KEY_STOP')} color="error" sx={{ bgcolor: 'action.hover' }}>
                          <StopIcon />
                        </IconButton>
                        <IconButton onClick={() => handleSamsungKey('KEY_FF')} sx={{ bgcolor: 'action.hover' }}>
                          <SkipNextIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Number Pad (for channel entry) */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom textAlign="center">Number Pad</Typography>
                      <Grid container spacing={0.5} sx={{ maxWidth: 180, mx: 'auto' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '-', 0, 'PRECH'].map((num) => (
                          <Grid item xs={4} key={num}>
                            <Button 
                              variant="outlined" 
                              onClick={() => handleSamsungKey(num === 'PRECH' ? 'KEY_PRECH' : num === '-' ? 'KEY_MINUS' : `KEY_${num}`)}
                              fullWidth
                              size="small"
                              sx={{ minWidth: 0, py: 1 }}
                            >
                              {num === 'PRECH' ? '⟲' : num}
                            </Button>
                          </Grid>
                        ))}
                      </Grid>
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

            {/* Camera Controls Section */}
            {isCamera && (
              <Box sx={{ mb: 3 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VideocamIcon /> Camera Controls
                </Typography>
                
                {/* Camera Action Buttons */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<VideocamIcon />}
                    onClick={handleViewStream}
                    sx={{ 
                      bgcolor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                  >
                    View Live Stream
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCameraIcon />}
                    onClick={handleSnapshot}
                  >
                    Take Snapshot
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={handleOpenCameraSettings}
                  >
                    Settings
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    onClick={handleOpenCameraWebUI}
                  >
                    Web Interface
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={cameraLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
                    onClick={handleCameraTest}
                    disabled={cameraLoading}
                  >
                    Test Connection
                  </Button>
                </Box>

                {/* Camera Stream Viewer */}
                {showStream && (
                  <Paper sx={{ p: 2, mb: 2, background: 'rgba(0,0,0,0.4)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Live Stream
                      </Typography>
                      <Button size="small" onClick={handleCloseStream}>
                        Close
                      </Button>
                    </Box>
                    
                    {/* Stream Type Selector */}
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {Object.entries(getCameraStreamOptions()).map(([key, option]) => (
                        <Chip
                          key={key}
                          label={option.label}
                          onClick={() => {
                            setSelectedStreamType(key);
                            setStreamError(false);
                          }}
                          color={selectedStreamType === key ? 'primary' : 'default'}
                          variant={selectedStreamType === key ? 'filled' : 'outlined'}
                          size="small"
                        />
                      ))}
                    </Box>
                    
                    {/* Stream Info */}
                    <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
                      <Typography variant="caption">
                        {getCameraStreamOptions()[selectedStreamType]?.description || 'Select a stream type'}
                      </Typography>
                    </Alert>

                    {streamError ? (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Direct stream failed. Trying through server proxy...
                        </Alert>
                        <img
                          src={getCameraProxyStreamUrl()}
                          alt="Camera Stream (Proxy)"
                          style={{ 
                            width: '100%', 
                            maxWidth: '800px', 
                            height: 'auto',
                            borderRadius: '8px',
                            background: '#000'
                          }}
                          onError={() => setControlError('Unable to load stream. Try a different stream type or open in browser.')}
                        />
                        <Box sx={{ mt: 2 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<OpenInNewIcon />}
                            onClick={() => window.open(getCameraStreamUrl(), '_blank')}
                          >
                            Open Direct URL in Browser
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>
                        <img
                          src={getCameraStreamUrl()}
                          alt="Camera Live Stream"
                          style={{ 
                            width: '100%', 
                            maxWidth: '800px', 
                            height: 'auto',
                            borderRadius: '8px',
                            background: '#000'
                          }}
                          onError={handleStreamError}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Direct URL: {getCameraStreamUrl()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Proxy URL: {getCameraProxyStreamUrl()}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                )}

                {/* Snapshot Viewer */}
                {snapshotUrl && (
                  <Paper sx={{ p: 2, mb: 2, background: 'rgba(0,0,0,0.4)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Snapshot
                      </Typography>
                      <Box>
                        <Button 
                          size="small" 
                          onClick={handleSnapshot}
                          startIcon={<RefreshIcon />}
                          sx={{ mr: 1 }}
                        >
                          Refresh
                        </Button>
                        <Button size="small" onClick={() => setSnapshotUrl(null)}>
                          Close
                        </Button>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <img
                        src={snapshotUrl}
                        alt="Camera Snapshot"
                        style={{ 
                          width: '100%', 
                          maxWidth: '800px', 
                          height: 'auto',
                          borderRadius: '8px',
                          background: '#000'
                        }}
                        onError={() => setControlError('Failed to load snapshot')}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Captured at: {new Date().toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Paper>
                )}

                {/* Camera Info (from probe) */}
                {cameraInfo && (
                  <Paper sx={{ p: 2, background: 'rgba(0,0,0,0.3)' }}>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                      Camera Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {cameraInfo.cameraType && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Type</Typography>
                              <Typography variant="body2">{cameraInfo.cameraType}</Typography>
                            </Box>
                          )}
                          {cameraInfo.manufacturer && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Manufacturer</Typography>
                              <Typography variant="body2">{cameraInfo.manufacturer}</Typography>
                            </Box>
                          )}
                          {cameraInfo.model && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Model</Typography>
                              <Typography variant="body2">{cameraInfo.model}</Typography>
                            </Box>
                          )}
                          {cameraInfo.firmwareVersion && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Firmware</Typography>
                              <Typography variant="body2">{cameraInfo.firmwareVersion}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {cameraInfo.streamUrl && (
                            <Box>
                              <Typography variant="body2" color="text.secondary">Stream URL</Typography>
                              <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                                {cameraInfo.streamUrl}
                              </Typography>
                            </Box>
                          )}
                          {cameraInfo.snapshotUrl && (
                            <Box>
                              <Typography variant="body2" color="text.secondary">Snapshot URL</Typography>
                              <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                                {cameraInfo.snapshotUrl}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
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
                  {device.manufacturer && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Manufacturer
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {device.manufacturer}
                      </Typography>
                    </Box>
                  )}
                  {device.model && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Model
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {device.model}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Port
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {device.port || 'N/A'}
                    </Typography>
                  </Box>
                  {device.lastSeen && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Last Seen
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {new Date(device.lastSeen).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                  {powerState !== null && (device.type?.toLowerCase().includes('wemo') || device.type?.toLowerCase().includes('tplink')) && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Current State
                      </Typography>
                      <Chip 
                        label={powerState ? "ON" : "OFF"}
                        color={powerState ? "success" : "default"}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  )}
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
