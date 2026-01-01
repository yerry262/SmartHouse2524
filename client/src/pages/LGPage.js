import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  CircularProgress,
  Paper,
  Alert
} from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import ChannelIcon from '@mui/icons-material/Tv';
import ApiIcon from '@mui/icons-material/Api';
import axios from 'axios';
import { motion } from 'framer-motion';

const LGPage = () => {
  const [tvs, setTvs] = useState([]);
  const [selectedTV, setSelectedTV] = useState(null);
  const [volume, setVolume] = useState(50);
  const [muted, setMuted] = useState(false);
  const [apps, setApps] = useState([]);
  const [addTVDialog, setAddTVDialog] = useState(false);
  const [newTVIP, setNewTVIP] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);

  useEffect(() => {
    discoverTVs();
  }, []);

  useEffect(() => {
    if (selectedTV) {
      getVolume();
      getApps();
    }
  }, [selectedTV]);

  const discoverTVs = async () => {
    try {
      const response = await axios.get('/api/lg/discover');
      if (response.data.tvs) {
        setTvs(response.data.tvs);
      }
    } catch (error) {
      console.error('Error discovering LG TVs:', error);
    }
  };

  const handleTestApi = async () => {
    setApiTestLoading(true);
    try {
      const endpoint = selectedTV ? `/api/lg/${selectedTV}/apps` : '/api/lg/discover';
      const response = await axios.get(endpoint);
      setApiTestResult(response.data);
      setApiTestTimestamp(new Date().toLocaleString());
    } catch (err) {
      setApiTestResult({ error: err.message || 'API request failed' });
      setApiTestTimestamp(new Date().toLocaleString());
    }
    setApiTestLoading(false);
  };

  const connectTV = async (ip) => {
    try {
      setConnectionStatus('Connecting...');
      const response = await axios.post('/api/lg/connect', { ip });
      
      if (response.data.status === 'prompt') {
        setConnectionStatus('Please accept the connection on your TV');
        setTimeout(() => setConnectionStatus(''), 5000);
      } else if (response.data.status === 'connected') {
        setConnectionStatus('Connected successfully!');
        setTvs([...tvs, { ip }]);
        setSelectedTV(ip);
        setAddTVDialog(false);
        setNewTVIP('');
        setTimeout(() => setConnectionStatus(''), 3000);
      }
    } catch (error) {
      setConnectionStatus('Connection failed: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setConnectionStatus(''), 5000);
    }
  };

  const handleAddTV = () => {
    if (newTVIP) {
      connectTV(newTVIP);
    }
  };

  const getVolume = async () => {
    if (!selectedTV) return;
    try {
      const response = await axios.get(`/api/lg/${selectedTV}/volume`);
      setVolume(response.data.volume);
      setMuted(response.data.muted);
    } catch (error) {
      console.error('Error getting volume:', error);
    }
  };

  const setTVVolume = async (newVolume) => {
    if (!selectedTV) return;
    try {
      await axios.post(`/api/lg/${selectedTV}/volume`, { volume: newVolume });
      setVolume(newVolume);
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  };

  const toggleMute = async () => {
    if (!selectedTV) return;
    try {
      await axios.post(`/api/lg/${selectedTV}/mute`, { mute: !muted });
      setMuted(!muted);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const powerOff = async () => {
    if (!selectedTV) return;
    try {
      await axios.post(`/api/lg/${selectedTV}/power`, { state: 'off' });
    } catch (error) {
      console.error('Error powering off:', error);
    }
  };

  const getApps = async () => {
    if (!selectedTV) return;
    try {
      const response = await axios.get(`/api/lg/${selectedTV}/apps`);
      if (response.data.apps) {
        setApps(response.data.apps.slice(0, 12)); // Show first 12 apps
      }
    } catch (error) {
      console.error('Error getting apps:', error);
    }
  };

  const launchApp = async (appId) => {
    if (!selectedTV) return;
    try {
      await axios.post(`/api/lg/${selectedTV}/app`, { appId });
    } catch (error) {
      console.error('Error launching app:', error);
    }
  };

  const mediaControl = async (command) => {
    if (!selectedTV) return;
    try {
      await axios.post(`/api/lg/${selectedTV}/media/${command}`);
    } catch (error) {
      console.error('Error with media control:', error);
    }
  };

  const channelControl = async (direction) => {
    if (!selectedTV) return;
    try {
      await axios.post(`/api/lg/${selectedTV}/channel/${direction}`);
    } catch (error) {
      console.error('Error with channel control:', error);
    }
  };

  // Common app IDs for LG webOS
  const popularApps = [
    { name: 'Netflix', id: 'netflix' },
    { name: 'YouTube', id: 'youtube.leanback.v4' },
    { name: 'Prime Video', id: 'amazon' },
    { name: 'Disney+', id: 'com.disney.disneyplus-prod' },
    { name: 'Hulu', id: 'hulu' },
    { name: 'Spotify', id: 'spotify-beehive' },
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
              LG webOS Smart TVs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Control your LG webOS televisions
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddTVDialog(true)}
          >
            Add TV
          </Button>
        </Box>

        {connectionStatus && (
          <Card sx={{ mb: 3, background: 'rgba(33, 150, 243, 0.1)' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {connectionStatus}
              </Typography>
            </CardContent>
          </Card>
        )}

        <Card sx={{ mb: 3, background: 'rgba(255, 193, 7, 0.1)' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              📺 Make sure "LG Connect Apps" is enabled on your TV. First connection requires accepting the pairing request on your TV.
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Device List */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Connected TVs
                </Typography>
                {tvs.length === 0 ? (
                  <Typography color="text.secondary">
                    No TVs connected. Click "Add TV" to connect one.
                  </Typography>
                ) : (
                  tvs.map((tv, index) => (
                    <Button
                      key={index}
                      fullWidth
                      variant={selectedTV === tv.ip ? 'contained' : 'outlined'}
                      sx={{ mb: 1, justifyContent: 'flex-start', textTransform: 'none' }}
                      onClick={() => {
                        setSelectedTV(tv.ip);
                      }}
                    >
                      LG TV - {tv.ip}
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Control Panel */}
          <Grid item xs={12} md={8}>
            {!selectedTV ? (
              <Card>
                <CardContent>
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Select a TV to control
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Basic Controls */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Basic Controls
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                      <Button
                        variant="contained"
                        startIcon={<PowerSettingsNewIcon />}
                        onClick={powerOff}
                        color="error"
                      >
                        Power Off
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={muted ? <VolumeUpIcon /> : <VolumeMuteIcon />}
                        onClick={toggleMute}
                      >
                        {muted ? 'Unmute' : 'Mute'}
                      </Button>
                    </Box>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Volume: {volume}
                    </Typography>
                    <Slider
                      value={volume}
                      onChange={(e, newValue) => setTVVolume(newValue)}
                      min={0}
                      max={100}
                      sx={{ mb: 3 }}
                    />

                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Media Controls
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                      <Button
                        variant="outlined"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => mediaControl('play')}
                      >
                        Play
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<PauseIcon />}
                        onClick={() => mediaControl('pause')}
                      >
                        Pause
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<StopIcon />}
                        onClick={() => mediaControl('stop')}
                      >
                        Stop
                      </Button>
                    </Box>

                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Channel Controls
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        startIcon={<ChannelIcon />}
                        onClick={() => channelControl('up')}
                      >
                        Ch +
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ChannelIcon />}
                        onClick={() => channelControl('down')}
                      >
                        Ch -
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                {/* Popular Apps */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Popular Apps
                    </Typography>
                    <Grid container spacing={2}>
                      {popularApps.map((app) => (
                        <Grid item xs={6} sm={4} key={app.id}>
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
                  </CardContent>
                </Card>

                {/* Installed Apps */}
                {apps.length > 0 && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Installed Apps
                      </Typography>
                      <Grid container spacing={2}>
                        {apps.map((app) => (
                          <Grid item xs={6} sm={4} key={app.id}>
                            <Button
                              fullWidth
                              variant="outlined"
                              onClick={() => launchApp(app.id)}
                              sx={{ py: 2, textTransform: 'none' }}
                            >
                              {app.title || app.id}
                            </Button>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </motion.div>

      {/* API Test Section */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 2, borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
            {apiTestResult.error ? (
              <Alert severity="error">{apiTestResult.error}</Alert>
            ) : (
              <pre style={{ margin: 0, fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(apiTestResult, null, 2)}
              </pre>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Click "Test API" to fetch LG TV data
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Add TV Dialog */}
      <Dialog open={addTVDialog} onClose={() => setAddTVDialog(false)}>
        <DialogTitle>Add LG webOS TV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your LG TV's IP address. Make sure your TV has "LG Connect Apps" enabled.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="TV IP Address"
            type="text"
            fullWidth
            variant="outlined"
            placeholder="192.168.1.100"
            value={newTVIP}
            onChange={(e) => setNewTVIP(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTVDialog(false)}>Cancel</Button>
          <Button onClick={handleAddTV} variant="contained">
            Connect
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LGPage;
