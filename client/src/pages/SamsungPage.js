import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  TextField,
  Chip,
  Divider,
  Tooltip,
  Collapse,
  Tab,
  Tabs
} from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import RefreshIcon from '@mui/icons-material/Refresh';
import ApiIcon from '@mui/icons-material/Api';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import TvIcon from '@mui/icons-material/Tv';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import axios from 'axios';
import { motion } from 'framer-motion';

const SamsungPage = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [tvStatus, setTvStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
  
  // Manual IP entry
  const [manualIp, setManualIp] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);
  const [apiTestHistory, setApiTestHistory] = useState([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [installedApps, setInstalledApps] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  
  // Pairing state
  const [pairingStatus, setPairingStatus] = useState({}); // { ip: { paired: boolean, loading: boolean, message: string } }
  const [pairingLoading, setPairingLoading] = useState(false);

  useEffect(() => {
    discoverDevices();
  }, []);

  // Auto-refresh status when device is selected
  useEffect(() => {
    if (selectedDevice) {
      const interval = setInterval(() => {
        getTvStatus(selectedDevice, true); // silent refresh
      }, 30000); // refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedDevice]);

  const discoverDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/samsung/discover');
      setDevices(response.data.tvs || []);
      
      // Check pairing status for each TV
      for (const tv of response.data.tvs || []) {
        checkPairingStatus(tv.ip);
      }
    } catch (error) {
      console.error('Error discovering Samsung TVs:', error);
    }
    setLoading(false);
  };

  // Check if a TV is paired
  const checkPairingStatus = async (ip) => {
    try {
      const response = await axios.get(`/api/samsung/${ip}/paired`);
      setPairingStatus(prev => ({
        ...prev,
        [ip]: { paired: response.data.paired, hasToken: response.data.hasToken }
      }));
    } catch (error) {
      console.error('Error checking pairing status:', error);
    }
  };

  // Initiate pairing with a TV
  const handlePairDevice = async (ip) => {
    setPairingLoading(true);
    setPairingStatus(prev => ({
      ...prev,
      [ip]: { ...prev[ip], loading: true, message: 'Initiating pairing...' }
    }));
    
    try {
      const response = await axios.post(`/api/samsung/${ip}/pair`);
      
      setPairingStatus(prev => ({
        ...prev,
        [ip]: {
          paired: response.data.paired || response.data.success,
          loading: false,
          message: response.data.message,
          instructions: response.data.instructions
        }
      }));
      
      if (response.data.paired || response.data.success) {
        // Refresh status after successful pairing
        getTvStatus(ip);
      }
    } catch (error) {
      setPairingStatus(prev => ({
        ...prev,
        [ip]: {
          paired: false,
          loading: false,
          message: error.response?.data?.message || error.message
        }
      }));
    }
    setPairingLoading(false);
  };

  const addManualDevice = async () => {
    if (!manualIp || !manualIp.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      return;
    }
    
    try {
      // Register the TV with the backend
      const response = await axios.post('/api/samsung/register', { ip: manualIp });
      const tvData = response.data.tv || {
        ip: manualIp,
        name: `Samsung TV - ${manualIp}`,
        manual: true
      };
      
      setDevices(prev => {
        if (prev.some(d => d.ip === manualIp)) {
          // Update existing device
          return prev.map(d => d.ip === manualIp ? { ...d, ...tvData } : d);
        }
        return [...prev, tvData];
      });
      
      // Auto-select and test the new TV
      setSelectedDevice(manualIp);
      setConnectionStatus('connecting');
      getTvStatus(manualIp);
    } catch (error) {
      console.error('Error registering TV:', error);
      // Still add locally even if backend fails
      const newDevice = {
        ip: manualIp,
        name: `Samsung TV - ${manualIp}`,
        manual: true
      };
      setDevices(prev => {
        if (prev.some(d => d.ip === manualIp)) return prev;
        return [...prev, newDevice];
      });
    }
    
    setManualIp('');
    setShowManualEntry(false);
  };

  const handleTestApi = async (endpoint = 'status') => {
    if (!selectedDevice) return;
    setApiTestLoading(true);
    const startTime = Date.now();
    try {
      let response;
      const url = `/api/samsung/${selectedDevice}/${endpoint}`;
      
      if (endpoint === 'status' || endpoint === 'apps') {
        response = await axios.get(url);
      } else {
        response = await axios.post(url, {});
      }
      
      const duration = Date.now() - startTime;
      const result = {
        endpoint,
        success: true,
        data: response.data,
        status: response.status,
        duration,
        timestamp: new Date().toLocaleString()
      };
      
      setApiTestResult(result);
      setApiTestTimestamp(result.timestamp);
      setApiTestHistory(prev => [result, ...prev.slice(0, 9)]);
      
      // Update connection status based on response
      if (response.data.online !== undefined) {
        setConnectionStatus(response.data.online ? 'connected' : 'disconnected');
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      const result = {
        endpoint,
        success: false,
        error: err.message || 'API request failed',
        status: err.response?.status,
        duration,
        timestamp: new Date().toLocaleString()
      };
      setApiTestResult(result);
      setApiTestTimestamp(result.timestamp);
      setApiTestHistory(prev => [result, ...prev.slice(0, 9)]);
      setConnectionStatus('error');
    }
    setApiTestLoading(false);
  };

  const getTvStatus = async (ip, silent = false) => {
    if (!silent) setConnectionStatus('connecting');
    try {
      const response = await axios.get(`/api/samsung/${ip}/status`);
      setTvStatus(response.data);
      setConnectionStatus(response.data.online ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Error getting TV status:', error);
      if (!silent) setConnectionStatus('error');
    }
  };

  const fetchInstalledApps = async () => {
    if (!selectedDevice) return;
    setAppsLoading(true);
    try {
      const response = await axios.get(`/api/samsung/${selectedDevice}/apps`);
      setInstalledApps(response.data.apps || response.data || []);
    } catch (error) {
      console.error('Error fetching apps:', error);
    }
    setAppsLoading(false);
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

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircleIcon fontSize="small" />;
      case 'connecting': return <CircularProgress size={14} />;
      case 'error': return <ErrorIcon fontSize="small" />;
      default: return <WifiOffIcon fontSize="small" />;
    }
  };

  const apps = [
    { name: 'Netflix', id: '11101200001' },
    { name: 'YouTube', id: '111299001912' },
    { name: 'Prime Video', id: '3201512006785' },
    { name: 'Disney+', id: '3201901017640' },
    { name: 'Apple TV', id: '3201807016597' },
    { name: 'Hulu', id: '3201601007625' },
    { name: 'HBO Max', id: '3201601007230' },
    { name: 'Spotify', id: '3201606009684' },
  ];

  // Navigation keys for D-pad
  const navKeys = [
    { key: 'KEY_UP', icon: <KeyboardArrowUpIcon />, label: 'Up' },
    { key: 'KEY_DOWN', icon: <KeyboardArrowDownIcon />, label: 'Down' },
    { key: 'KEY_LEFT', icon: <KeyboardArrowLeftIcon />, label: 'Left' },
    { key: 'KEY_RIGHT', icon: <KeyboardArrowRightIcon />, label: 'Right' },
    { key: 'KEY_ENTER', icon: <RadioButtonCheckedIcon />, label: 'OK' },
  ];

  // Media control keys
  const mediaKeys = [
    { key: 'KEY_PLAY', icon: <PlayArrowIcon />, label: 'Play' },
    { key: 'KEY_PAUSE', icon: <PauseIcon />, label: 'Pause' },
    { key: 'KEY_REWIND', icon: <SkipPreviousIcon />, label: 'Rewind' },
    { key: 'KEY_FF', icon: <SkipNextIcon />, label: 'Fast Forward' },
  ];

  // System keys
  const systemKeys = [
    { key: 'KEY_HOME', icon: <HomeIcon />, label: 'Home' },
    { key: 'KEY_RETURN', icon: <ArrowBackIcon />, label: 'Back' },
    { key: 'KEY_MENU', icon: <SettingsIcon />, label: 'Menu' },
    { key: 'KEY_SOURCE', icon: <TvIcon />, label: 'Source' },
  ];

  return (
    <Container maxWidth="lg" sx={{ pt: 3 }}>
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
              📺 First time connecting? You'll need to accept the connection prompt on your TV. Make sure your TV is on and connected to the same network.
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Device List */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Available TVs
                  </Typography>
                  <Tooltip title="Add TV manually">
                    <IconButton size="small" onClick={() => setShowManualEntry(!showManualEntry)}>
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Collapse in={showManualEntry}>
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Enter TV IP address manually:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="192.168.1.xxx"
                        value={manualIp}
                        onChange={(e) => setManualIp(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addManualDevice()}
                        sx={{ flex: 1 }}
                      />
                      <Button variant="contained" size="small" onClick={addManualDevice}>
                        Add
                      </Button>
                    </Box>
                  </Box>
                </Collapse>

                {devices.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <TvIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">
                      No Samsung TVs found
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Try adding one manually or ensure they're on the same network
                    </Typography>
                  </Box>
                ) : (
                  devices.map((device, index) => (
                    <Button
                      key={index}
                      fullWidth
                      variant={selectedDevice === device.ip ? 'contained' : 'outlined'}
                      sx={{ mb: 1, justifyContent: 'flex-start', textTransform: 'none' }}
                      onClick={() => {
                        setSelectedDevice(device.ip);
                        setConnectionStatus('connecting');
                        getTvStatus(device.ip);
                        setApiTestResult(null);
                      }}
                      startIcon={<TvIcon />}
                      endIcon={device.manual && <Chip label="Manual" size="small" variant="outlined" sx={{ ml: 'auto' }} />}
                    >
                      <Box sx={{ textAlign: 'left', flex: 1 }}>
                        <Typography variant="body2">
                          {device.name || `Samsung TV`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {device.ip}
                        </Typography>
                      </Box>
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Connection Status Card */}
            {selectedDevice && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Connection Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Chip
                      icon={getConnectionStatusIcon()}
                      label={connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                      color={getConnectionStatusColor()}
                      size="small"
                    />
                    {pairingStatus[selectedDevice]?.paired && (
                      <Chip
                        icon={<LinkIcon />}
                        label="Paired"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  {tvStatus && (
                    <Box sx={{ fontSize: '0.8rem' }}>
                      <Typography variant="caption" color="text.secondary">
                        IP: {selectedDevice}
                      </Typography>
                      {tvStatus.message && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {tvStatus.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {/* Pairing Status & Button */}
                  {pairingStatus[selectedDevice]?.message && (
                    <Alert 
                      severity={pairingStatus[selectedDevice]?.paired ? 'success' : 'info'} 
                      sx={{ mt: 1, mb: 1, fontSize: '0.75rem' }}
                    >
                      {pairingStatus[selectedDevice].message}
                      {pairingStatus[selectedDevice]?.instructions && (
                        <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                          {pairingStatus[selectedDevice].instructions.map((inst, i) => (
                            <li key={i}>{inst}</li>
                          ))}
                        </Box>
                      )}
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      variant={pairingStatus[selectedDevice]?.paired ? "outlined" : "contained"}
                      color={pairingStatus[selectedDevice]?.paired ? "success" : "primary"}
                      onClick={() => handlePairDevice(selectedDevice)}
                      startIcon={pairingLoading ? <CircularProgress size={14} /> : <LinkIcon />}
                      disabled={pairingLoading}
                      sx={{ flex: 1 }}
                    >
                      {pairingStatus[selectedDevice]?.paired ? 'Re-Pair' : 'Pair TV'}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => getTvStatus(selectedDevice)}
                      startIcon={<RefreshIcon />}
                      sx={{ flex: 1 }}
                    >
                      Refresh
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Control Panel */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                {!selectedDevice ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <TvIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">
                      Select a TV to control
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Or add one manually using the + button
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
                      <Tab label="Controls" />
                      <Tab label="Apps" />
                      <Tab label="API Testing" />
                    </Tabs>

                    {/* Controls Tab */}
                    {activeTab === 0 && (
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

                        {/* System Keys */}
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                          Navigation
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                          {systemKeys.map((item) => (
                            <Tooltip key={item.key} title={item.label}>
                              <IconButton
                                onClick={() => sendKey(item.key)}
                                sx={{ border: '1px solid rgba(255,255,255,0.2)' }}
                              >
                                {item.icon}
                              </IconButton>
                            </Tooltip>
                          ))}
                        </Box>

                        {/* D-Pad */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, width: 'fit-content' }}>
                            <Box />
                            <IconButton onClick={() => sendKey('KEY_UP')} sx={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                              <KeyboardArrowUpIcon />
                            </IconButton>
                            <Box />
                            <IconButton onClick={() => sendKey('KEY_LEFT')} sx={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                              <KeyboardArrowLeftIcon />
                            </IconButton>
                            <IconButton onClick={() => sendKey('KEY_ENTER')} sx={{ border: '1px solid rgba(255,255,255,0.2)', bgcolor: 'primary.main' }}>
                              <RadioButtonCheckedIcon />
                            </IconButton>
                            <IconButton onClick={() => sendKey('KEY_RIGHT')} sx={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                              <KeyboardArrowRightIcon />
                            </IconButton>
                            <Box />
                            <IconButton onClick={() => sendKey('KEY_DOWN')} sx={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                              <KeyboardArrowDownIcon />
                            </IconButton>
                            <Box />
                          </Box>
                        </Box>

                        {/* Media Controls */}
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                          Media Controls
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                          {mediaKeys.map((item) => (
                            <Tooltip key={item.key} title={item.label}>
                              <IconButton
                                onClick={() => sendKey(item.key)}
                                sx={{ border: '1px solid rgba(255,255,255,0.2)' }}
                              >
                                {item.icon}
                              </IconButton>
                            </Tooltip>
                          ))}
                        </Box>

                        {/* Channel Controls */}
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                          Channel
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                          <Button variant="outlined" onClick={() => sendKey('KEY_CHUP')}>CH +</Button>
                          <Button variant="outlined" onClick={() => sendKey('KEY_CHDOWN')}>CH -</Button>
                        </Box>
                      </>
                    )}

                    {/* Apps Tab */}
                    {activeTab === 1 && (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Quick Launch Apps
                          </Typography>
                          <Button
                            size="small"
                            onClick={fetchInstalledApps}
                            disabled={appsLoading}
                            startIcon={appsLoading ? <CircularProgress size={14} /> : <RefreshIcon />}
                          >
                            Fetch Installed
                          </Button>
                        </Box>

                        <Grid container spacing={2} sx={{ mb: 3 }}>
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

                        {installedApps.length > 0 && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                              Installed Apps ({installedApps.length})
                            </Typography>
                            <Grid container spacing={1}>
                              {installedApps.slice(0, 20).map((app, idx) => (
                                <Grid item xs={6} sm={4} key={idx}>
                                  <Button
                                    fullWidth
                                    size="small"
                                    variant="text"
                                    onClick={() => launchApp(app.appId || app.id)}
                                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                                  >
                                    {app.name || app.appId}
                                  </Button>
                                </Grid>
                              ))}
                            </Grid>
                          </>
                        )}
                      </>
                    )}

                    {/* API Testing Tab */}
                    {activeTab === 2 && (
                      <>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                          API Connection Testing
                        </Typography>

                        <Alert severity="info" sx={{ mb: 3 }}>
                          Test different API endpoints to verify your Samsung TV connection. The TV must be on and you may need to accept the connection prompt.
                        </Alert>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                          <Button
                            variant="contained"
                            onClick={() => handleTestApi('status')}
                            disabled={apiTestLoading}
                            startIcon={apiTestLoading ? <CircularProgress size={14} /> : <ApiIcon />}
                          >
                            Test Status
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => handleTestApi('apps')}
                            disabled={apiTestLoading}
                          >
                            Get Apps
                          </Button>
                        </Box>

                        {/* API Response */}
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Latest Response
                            </Typography>
                            {apiTestTimestamp && (
                              <Typography variant="caption" color="text.secondary">
                                {apiTestTimestamp}
                              </Typography>
                            )}
                          </Box>
                          
                          {apiTestResult ? (
                            <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.3)', maxHeight: 300, overflow: 'auto' }}>
                              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Chip
                                  size="small"
                                  label={apiTestResult.success ? 'Success' : 'Failed'}
                                  color={apiTestResult.success ? 'success' : 'error'}
                                />
                                <Chip size="small" label={`${apiTestResult.duration}ms`} variant="outlined" />
                                <Chip size="small" label={apiTestResult.endpoint} variant="outlined" />
                              </Box>
                              
                              {apiTestResult.error ? (
                                <Alert severity="error">{apiTestResult.error}</Alert>
                              ) : (
                                <>
                                  {apiTestResult.data?.online !== undefined && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="body2">
                                        <strong>Online:</strong>{' '}
                                        <Chip
                                          size="small"
                                          label={apiTestResult.data.online ? 'Yes' : 'No'}
                                          color={apiTestResult.data.online ? 'success' : 'default'}
                                        />
                                      </Typography>
                                    </Box>
                                  )}
                                  <Typography variant="caption" color="text.secondary">Raw Response:</Typography>
                                  <pre style={{ margin: 0, fontSize: '0.7rem', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                                    {JSON.stringify(apiTestResult.data, null, 2)}
                                  </pre>
                                </>
                              )}
                            </Paper>
                          ) : (
                            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
                              <ApiIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                Click a test button to fetch API response
                              </Typography>
                            </Paper>
                          )}
                        </Box>

                        {/* API Test History */}
                        {apiTestHistory.length > 0 && (
                          <Box>
                            <Button
                              size="small"
                              onClick={() => setShowAdvanced(!showAdvanced)}
                              endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              sx={{ mb: 1 }}
                            >
                              Test History ({apiTestHistory.length})
                            </Button>
                            <Collapse in={showAdvanced}>
                              <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', maxHeight: 200, overflow: 'auto' }}>
                                {apiTestHistory.map((item, idx) => (
                                  <Box key={idx} sx={{ py: 1, borderBottom: idx < apiTestHistory.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                      {item.success ? <CheckCircleIcon color="success" fontSize="small" /> : <ErrorIcon color="error" fontSize="small" />}
                                      <Typography variant="caption">{item.endpoint}</Typography>
                                      <Typography variant="caption" color="text.secondary">{item.duration}ms</Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{item.timestamp}</Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </Paper>
                            </Collapse>
                          </Box>
                        )}
                      </>
                    )}
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
