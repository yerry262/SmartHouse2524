import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Slider,
  Box,
  Chip,
  Alert,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  VolumeUp,
  VolumeOff,
  PlayArrow,
  Stop,
  Refresh,
  Add,
  Campaign,
  Home,
} from '@mui/icons-material';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAccounts } from '../contexts/AccountContext';
import AccountRequiredPrompt from '../components/AccountRequiredPrompt';

const GoogleHomePage = () => {
  const { isAccountLinked } = useAccounts();
  const isLinked = isAccountLinked('google');
  
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', host: '', port: '8009' });
  const [packageInstalled, setPackageInstalled] = useState(true);

  useEffect(() => {
    if (isLinked) {
      fetchDevices();
    }
  }, [isLinked]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/google-home/devices');
      if (response.data.installed === false) {
        setPackageInstalled(false);
        setError(response.data.message);
      } else {
        setDevices(response.data.devices || []);
        setPackageInstalled(true);
      }
    } catch (err) {
      setError('Failed to fetch devices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const discoverDevices = async () => {
    setDiscovering(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post('/api/google-home/discover');
      if (response.data.installed === false) {
        setPackageInstalled(false);
        setError(response.data.message);
      } else {
        setSuccess(response.data.message);
        await fetchDevices();
      }
    } catch (err) {
      setError('Discovery failed');
      console.error(err);
    } finally {
      setDiscovering(false);
    }
  };

  const addDevice = async () => {
    if (!newDevice.host) {
      setError('Host IP is required');
      return;
    }

    try {
      await axios.post('/api/google-home/add-device', newDevice);
      setSuccess('Device added successfully');
      setAddDialogOpen(false);
      setNewDevice({ name: '', host: '', port: '8009' });
      await fetchDevices();
    } catch (err) {
      setError('Failed to add device');
      console.error(err);
    }
  };

  const speak = async (host, text) => {
    try {
      await axios.post(`/api/google-home/devices/${host}/speak`, { text });
      setSuccess('Announcement sent');
    } catch (err) {
      setError('Failed to send announcement');
      console.error(err);
    }
  };

  const setVolume = async (host, volume) => {
    try {
      await axios.post(`/api/google-home/devices/${host}/volume`, { volume });
      setSuccess(`Volume set to ${volume}%`);
    } catch (err) {
      setError('Failed to set volume');
      console.error(err);
    }
  };

  const stopPlayback = async (host) => {
    try {
      await axios.post(`/api/google-home/devices/${host}/stop`);
      setSuccess('Playback stopped');
    } catch (err) {
      setError('Failed to stop playback');
      console.error(err);
    }
  };

  if (!packageInstalled) {
    return (
      <Container maxWidth="lg" sx={{ pt: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6">Google Home Package Not Installed</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Run this command in your terminal:
          </Typography>
          <Box
            sx={{
              bgcolor: 'rgba(0,0,0,0.3)',
              p: 2,
              borderRadius: 1,
              mt: 1,
              fontFamily: 'monospace',
            }}
          >
            npm install castv2-client google-tts-api
          </Box>
        </Alert>
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
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Home sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h3" component="h1">
              Google Home & Nest
            </Typography>
          </Box>
          {isLinked && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddDialogOpen(true)}
              >
                Add Device
              </Button>
              <Button
                variant="contained"
                startIcon={discovering ? <CircularProgress size={20} /> : <Refresh />}
                onClick={discoverDevices}
                disabled={discovering}
              >
                {discovering ? 'Discovering...' : 'Discover'}
              </Button>
            </Box>
          )}
        </Box>

        {/* Account Required Prompt */}
        <AccountRequiredPrompt 
          providerId="google"
          title="Connect Google Home"
          description="Sign in to your Google account to discover and control your Chromecast, Google Home speakers, and Nest smart displays."
          showLocalOption={true}
          onTryLocal={discoverDevices}
          localOptionText="Try Local mDNS Discovery"
        />

        {isLinked && (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                {success}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : devices.length === 0 ? (
              <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Home sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Google Home devices found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click "Discover" to search for devices on your network
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {devices.map((device) => (
              <Grid item xs={12} md={6} key={device.host}>
                <DeviceCard
                  device={device}
                  onSpeak={speak}
                  onSetVolume={setVolume}
                  onStop={stopPlayback}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Add Device Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
          <DialogTitle>Add Google Home Device</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Device Name"
              fullWidth
              value={newDevice.name}
              onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Host IP Address"
              fullWidth
              required
              value={newDevice.host}
              onChange={(e) => setNewDevice({ ...newDevice, host: e.target.value })}
              placeholder="192.168.1.100"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Port"
              fullWidth
              value={newDevice.port}
              onChange={(e) => setNewDevice({ ...newDevice, port: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={addDevice} variant="contained">
              Add
            </Button>
          </DialogActions>
        </Dialog>
          </>
        )}
      </motion.div>
    </Container>
  );
};

const DeviceCard = ({ device, onSpeak, onSetVolume, onStop }) => {
  const [announcement, setAnnouncement] = useState('');
  const [volume, setVolume] = useState(50);
  const [loading, setLoading] = useState(false);

  const handleSpeak = async () => {
    if (!announcement.trim()) return;
    setLoading(true);
    await onSpeak(device.host, announcement);
    setLoading(false);
    setAnnouncement('');
  };

  const handleVolumeChange = async (event, newValue) => {
    setVolume(newValue);
  };

  const handleVolumeCommit = async (event, newValue) => {
    await onSetVolume(device.host, newValue);
  };

  const presetAnnouncements = [
    'Good morning!',
    'Dinner is ready',
    'Time for bed',
    'Welcome home',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Home sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6">{device.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {device.host}
                </Typography>
              </Box>
            </Box>
            <Chip label="Cast Device" color="primary" size="small" />
          </Box>

          {/* Volume Control */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <VolumeUp />
              <Typography variant="body2">Volume: {volume}%</Typography>
            </Box>
            <Slider
              value={volume}
              onChange={handleVolumeChange}
              onChangeCommitted={handleVolumeCommit}
              min={0}
              max={100}
              valueLabelDisplay="auto"
            />
          </Box>

          {/* Announcement */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Text-to-Speech Announcement
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter message to announce..."
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSpeak();
                }}
              />
              <Button
                variant="contained"
                onClick={handleSpeak}
                disabled={loading || !announcement.trim()}
                startIcon={loading ? <CircularProgress size={16} /> : <Campaign />}
              >
                Speak
              </Button>
            </Box>
          </Box>

          {/* Preset Announcements */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Quick Announcements
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {presetAnnouncements.map((preset) => (
                <Chip
                  key={preset}
                  label={preset}
                  onClick={() => onSpeak(device.host, preset)}
                  clickable
                  size="small"
                />
              ))}
            </Box>
          </Box>

          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Stop />}
              onClick={() => onStop(device.host)}
              size="small"
            >
              Stop Playback
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GoogleHomePage;
