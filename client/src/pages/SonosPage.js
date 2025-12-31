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
  Paper
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

  useEffect(() => {
    discoverDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      getDeviceStatus();
      const interval = setInterval(getDeviceStatus, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [selectedDevice]);

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

  const getDeviceStatus = async () => {
    if (!selectedDevice) return;
    
    try {
      const response = await axios.get(`/api/sonos/${selectedDevice}/status`);
      setDeviceStatus(response.data);
      setVolume(response.data.volume);
      setError(null);
    } catch (error) {
      console.error('Error getting device status:', error);
      setError('Failed to get device status');
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

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SpeakerIcon sx={{ fontSize: 40, mr: 2, color: '#00D1B2' }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Sonos Speakers ({devices.length})
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={discoverDevices}
            disabled={loading}
          >
            Discover
          </Button>
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

                      {/* Progress Bar (if available) */}
                      {deviceStatus.track?.duration && deviceStatus.track?.position && (
                        <LinearProgress 
                          variant="determinate" 
                          value={50} // You might need to calculate this based on position/duration
                          sx={{ mb: 3 }}
                        />
                      )}

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
                      <Typography variant="body2" color="text.secondary">
                        <strong>Name:</strong> {deviceStatus.device?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Model:</strong> {deviceStatus.device?.model || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>IP:</strong> {deviceStatus.ip}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Software:</strong> {deviceStatus.device?.softwareVersion || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Last Update:</strong> {new Date(deviceStatus.timestamp).toLocaleTimeString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Queue Button */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6">🎵 Playback Queue</Typography>
                        <Button 
                          variant="outlined" 
                          startIcon={<QueueMusicIcon />}
                          onClick={getQueue}
                        >
                          Load Queue
                        </Button>
                      </Box>
                      
                      {queue.length > 0 && (
                        <List sx={{ mt: 2 }}>
                          {queue.slice(0, 5).map((track, index) => (
                            <ListItem key={index} divider>
                              <ListItemText
                                primary={track.title || 'Unknown track'}
                                secondary={`${track.artist || 'Unknown artist'} - ${track.album || 'Unknown album'}`}
                              />
                            </ListItem>
                          ))}
                          {queue.length > 5 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              And {queue.length - 5} more tracks...
                            </Typography>
                          )}
                        </List>
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
