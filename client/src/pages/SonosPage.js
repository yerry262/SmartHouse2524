import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Slider,
  IconButton,
  LinearProgress,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider,
  Tooltip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SpeakerIcon from '@mui/icons-material/Speaker';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ApiIcon from '@mui/icons-material/Api';
import axios from 'axios';
import { motion } from 'framer-motion';

const SonosPage = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [volume, setVolume] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [positionInfo, setPositionInfo] = useState(null);
  const [progress, setProgress] = useState(0);
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);

  useEffect(() => {
    discoverDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDeviceStatus = useCallback(async () => {
    if (!selectedDevice) return;
    
    try {
      const [statusRes, posRes] = await Promise.all([
        axios.get(`/api/sonos/${selectedDevice}/status`),
        axios.get(`/api/sonos/${selectedDevice}/position`)
      ]);
      setDeviceStatus(statusRes.data);
      setVolume(statusRes.data.volume);
      setPositionInfo(posRes.data);
      
      // Calculate progress percentage
      if (posRes.data.duration && posRes.data.position) {
        const durationSecs = timeToSeconds(posRes.data.duration);
        const positionSecs = timeToSeconds(posRes.data.position);
        if (durationSecs > 0) {
          setProgress((positionSecs / durationSecs) * 100);
        }
      }
      setError(null);
    } catch (error) {
      console.error('Error getting device status:', error);
      setError('Failed to get device status');
    }
  }, [selectedDevice]);

  useEffect(() => {
    if (selectedDevice) {
      getDeviceStatus();
      getFavorites();
      if (autoRefresh) {
        const interval = setInterval(getDeviceStatus, 2000); // Update every 2 seconds for smoother progress
        return () => clearInterval(interval);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice, autoRefresh, getDeviceStatus]);

  // Convert time string (HH:MM:SS or MM:SS) to seconds
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

  const discoverDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/sonos/discover');
      setDevices(response.data);
      if (response.data.length > 0 && !selectedDevice) {
        setSelectedDevice(response.data[0].ip);
      }
    } catch (error) {
      console.error('Error discovering Sonos devices:', error);
      setError('Failed to discover Sonos devices. Make sure they are connected.');
    } finally {
      setLoading(false);
    }
  };

  const getFavorites = async () => {
    if (!selectedDevice) return;
    
    try {
      const response = await axios.get(`/api/sonos/${selectedDevice}/favorites`);
      setFavorites(response.data.favorites || []);
    } catch (error) {
      console.error('Error getting favorites:', error);
    }
  };

  const playFavorite = async (favorite) => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/favorite/${encodeURIComponent(favorite.title)}`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error playing favorite:', error);
    }
  };

  const getQueue = async () => {
    if (!selectedDevice) return;
    
    try {
      const response = await axios.get(`/api/sonos/${selectedDevice}/queue`);
      setQueue(response.data.queue);
    } catch (error) {
      console.error('Error getting queue:', error);
    }
  };

  const handlePlay = async () => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/play`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error playing:', error);
    }
  };

  const handlePause = async () => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/pause`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error pausing:', error);
    }
  };

  const handleStop = async () => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/stop`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error stopping:', error);
    }
  };

  const handleNext = async () => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/next`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error skipping to next:', error);
    }
  };

  const handlePrevious = async () => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/previous`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error skipping to previous:', error);
    }
  };

  const handleVolumeChange = async (event, newValue) => {
    setVolume(newValue);
    try {
      await axios.post(`/api/sonos/${selectedDevice}/volume`, { level: newValue });
    } catch (error) {
      console.error('Error changing volume:', error);
    }
  };

  const handleMute = async () => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/mute`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error muting:', error);
    }
  };

  const handleUnmute = async () => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/unmute`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error unmuting:', error);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '0:00';
    return duration;
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'playing': return 'success';
      case 'paused': return 'warning';
      case 'stopped': return 'default';
      default: return 'default';
    }
  };

  const getStateIcon = (state) => {
    switch (state) {
      case 'playing': return <PlayArrowIcon />;
      case 'paused': return <PauseIcon />;
      case 'stopped': return <StopIcon />;
      default: return <MusicNoteIcon />;
    }
  };

  const handleTestApi = async () => {
    if (!selectedDevice) return;
    setApiTestLoading(true);
    try {
      const response = await axios.get(`/api/sonos/${selectedDevice}/status`);
      setApiTestResult(response.data);
      setApiTestTimestamp(new Date().toLocaleString());
    } catch (err) {
      setApiTestResult({ error: err.message || 'API request failed', status: err.response?.status });
      setApiTestTimestamp(new Date().toLocaleString());
    }
    setApiTestLoading(false);
  };

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SpeakerIcon sx={{ fontSize: 40, mr: 2, color: '#00D1B2' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Sonos Speakers ({devices.length})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  color="primary"
                />
              }
              label="Auto-refresh"
            />
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={discoverDevices}
              disabled={loading}
            >
              Discover
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Device Selection */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📡 Available Speakers
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <List>
                    {devices.map((device) => (
                      <ListItem
                        key={device.ip}
                        button
                        selected={selectedDevice === device.ip}
                        onClick={() => setSelectedDevice(device.ip)}
                        sx={{
                          borderRadius: 1,
                          mb: 1,
                          '&.Mui-selected': {
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': {
                              backgroundColor: 'primary.dark',
                            },
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <SpeakerIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={device.name || `Sonos ${device.ip}`}
                          secondary={`IP: ${device.ip}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Playback Controls */}
          <Grid item xs={12} md={8}>
            {selectedDevice && deviceStatus ? (
              <Grid container spacing={3}>
                {/* Now Playing */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">🎵 Now Playing</Typography>
                        <Chip 
                          icon={getStateIcon(deviceStatus.state)}
                          label={deviceStatus.state.toUpperCase()}
                          color={getStateColor(deviceStatus.state)}
                          variant="filled"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        {deviceStatus.track?.albumArtURI ? (
                          <Avatar 
                            src={deviceStatus.track.albumArtURI} 
                            sx={{ width: 80, height: 80, mr: 2 }}
                          />
                        ) : (
                          <Avatar sx={{ width: 80, height: 80, mr: 2 }}>
                            <MusicNoteIcon sx={{ fontSize: 40 }} />
                          </Avatar>
                        )}
                        
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {deviceStatus.track?.title || 'No track'}
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {deviceStatus.track?.artist || 'Unknown artist'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {deviceStatus.track?.album || 'Unknown album'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDuration(deviceStatus.track?.position)} / {formatDuration(deviceStatus.track?.duration)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Progress Bar */}
                      <Box sx={{ mb: 3 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={progress}
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {positionInfo?.position || '0:00:00'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {positionInfo?.duration || '0:00:00'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Control Buttons */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <IconButton onClick={handlePrevious} size="large">
                          <SkipPreviousIcon />
                        </IconButton>
                        
                        {deviceStatus.state === 'playing' ? (
                          <IconButton 
                            onClick={handlePause} 
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
                            onClick={handlePlay} 
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
                        
                        <IconButton onClick={handleStop} size="large">
                          <StopIcon />
                        </IconButton>
                        
                        <IconButton onClick={handleNext} size="large">
                          <SkipNextIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Volume Control */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <VolumeUpIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Volume ({volume}%)</Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={handleMute} size="small">
                          <VolumeOffIcon />
                        </IconButton>
                        
                        <Slider
                          value={volume}
                          onChange={handleVolumeChange}
                          min={0}
                          max={100}
                          valueLabelDisplay="auto"
                          sx={{ flexGrow: 1 }}
                        />
                        
                        <IconButton onClick={handleUnmute} size="small">
                          <VolumeUpIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Device Info */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        📱 Device Info
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Name</Typography>
                          <Typography variant="body2">{deviceStatus.device?.name || 'Unknown'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Model</Typography>
                          <Typography variant="body2">{deviceStatus.device?.model || 'Unknown'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">IP Address</Typography>
                          <Typography variant="body2">{deviceStatus.ip}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Serial Number</Typography>
                          <Typography variant="body2">{deviceStatus.device?.serialNumber || 'Unknown'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Software</Typography>
                          <Typography variant="body2">{deviceStatus.device?.softwareVersion || 'Unknown'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Last Update</Typography>
                          <Typography variant="body2">{new Date(deviceStatus.timestamp).toLocaleTimeString()}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Tabs for Queue and Favorites */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Tabs 
                        value={tabValue} 
                        onChange={(e, v) => setTabValue(v)}
                        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                      >
                        <Tab icon={<QueueMusicIcon />} label="Queue" />
                        <Tab icon={<FavoriteIcon />} label="Favorites" />
                      </Tabs>
                      
                      {/* Queue Tab */}
                      {tabValue === 0 && (
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button 
                              variant="outlined" 
                              size="small"
                              startIcon={<RefreshIcon />}
                              onClick={getQueue}
                            >
                              Refresh Queue
                            </Button>
                          </Box>
                          {queue.length > 0 ? (
                            <List dense>
                              {queue.slice(0, 10).map((track, index) => (
                                <ListItem key={index} divider>
                                  <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                                      {index + 1}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={track.title || 'Unknown track'}
                                    secondary={`${track.artist || 'Unknown artist'} - ${track.album || 'Unknown album'}`}
                                  />
                                </ListItem>
                              ))}
                              {queue.length > 10 && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                                  And {queue.length - 10} more tracks...
                                </Typography>
                              )}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                              Click "Refresh Queue" to load the current queue
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {/* Favorites Tab */}
                      {tabValue === 1 && (
                        <Box>
                          {favorites.length > 0 ? (
                            <Grid container spacing={2}>
                              {favorites.map((fav, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                  <Paper
                                    sx={{ 
                                      p: 2, 
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      '&:hover': { 
                                        transform: 'scale(1.02)',
                                        boxShadow: 4
                                      }
                                    }}
                                    onClick={() => playFavorite(fav)}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Avatar 
                                        src={fav.albumArtURI || fav.albumArtUri} 
                                        sx={{ width: 48, height: 48 }}
                                      >
                                        <FavoriteIcon />
                                      </Avatar>
                                      <Box sx={{ overflow: 'hidden' }}>
                                        <Tooltip title={fav.title}>
                                          <Typography variant="body2" noWrap sx={{ fontWeight: 'bold' }}>
                                            {fav.title}
                                          </Typography>
                                        </Tooltip>
                                        <Typography variant="caption" color="text.secondary" noWrap>
                                          {fav.description || 'Sonos Favorite'}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                              No favorites found. Add favorites in your Sonos app.
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {/* API Test Section */}
                      {tabValue === 0 && (
                        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle1\" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                                    {apiTestResult.device && (
                                      <>
                                        <Typography variant="body2"><strong>Room:</strong> {apiTestResult.device.name}</Typography>
                                        <Typography variant="body2"><strong>Model:</strong> {apiTestResult.device.model}</Typography>
                                      </>
                                    )}
                                    <Typography variant="body2"><strong>Playing:</strong> {apiTestResult.playing ? 'Yes' : 'No'}</Typography>
                                    <Typography variant="body2"><strong>Volume:</strong> {apiTestResult.volume}%</Typography>
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">Raw Response:</Typography>
                                  <pre style={{ margin: 0, fontSize: '0.65rem', whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(apiTestResult, null, 2)}
                                  </pre>
                                </>
                              )}
                            </Paper>
                          ) : (
                            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
                              <Typography variant="body2" color="text.secondary">
                                Click "Test API" to fetch speaker status
                              </Typography>
                            </Paper>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : selectedDevice ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <SpeakerIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a Sonos speaker to control
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default SonosPage;
