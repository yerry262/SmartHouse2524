import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  CircularProgress,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import VideocamIcon from '@mui/icons-material/Videocam';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ApiIcon from '@mui/icons-material/Api';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import HistoryIcon from '@mui/icons-material/History';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAccounts } from '../contexts/AccountContext';
import AccountRequiredPrompt from '../components/AccountRequiredPrompt';

const RingPage = () => {
  const { isAccountLinked, getAccountData } = useAccounts();
  const isLinked = isAccountLinked('ring');
  
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);

  // Snapshot dialog state
  const [snapshotDialog, setSnapshotDialog] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotData, setSnapshotData] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Events dialog state
  const [eventsDialog, setEventsDialog] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [events, setEvents] = useState([]);

  // Stream state
  const [streamStatus, setStreamStatus] = useState({});

  useEffect(() => {
    if (isLinked) {
      checkAuth();
      fetchDevices();
    }
  }, [isLinked]);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/ring/auth');
      setAuthStatus(response.data);
    } catch (error) {
      setAuthStatus({ configured: false, error: error.message });
    }
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/ring/cameras');
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching Ring devices:', error);
      // Try legacy endpoint
      try {
        const legacyResponse = await axios.get('/api/ring/devices');
        setDevices(legacyResponse.data);
      } catch (legacyError) {
        console.error('Error fetching Ring devices (legacy):', legacyError);
      }
    }
    setLoading(false);
  };

  const handleTestApi = async () => {
    setApiTestLoading(true);
    try {
      const response = await axios.get('/api/ring/devices');
      setApiTestResult(response.data);
      setApiTestTimestamp(new Date().toLocaleString());
    } catch (err) {
      setApiTestResult({ error: err.message || 'API request failed' });
      setApiTestTimestamp(new Date().toLocaleString());
    }
    setApiTestLoading(false);
  };

  const toggleMotionDetection = async (deviceId, enabled) => {
    try {
      await axios.post(`/api/ring/camera/${deviceId}/motion`, { enabled });
      fetchDevices();
    } catch (error) {
      console.error('Error toggling motion detection:', error);
    }
  };

  // Get camera snapshot
  const getSnapshot = async (device) => {
    setSelectedDevice(device);
    setSnapshotDialog(true);
    setSnapshotLoading(true);
    setSnapshotData(null);
    
    try {
      const response = await axios.get(`/api/ring/camera/${device.deviceId || device.id}/snapshot?format=json`);
      setSnapshotData(response.data);
    } catch (error) {
      setSnapshotData({ error: error.response?.data?.message || error.message });
    }
    setSnapshotLoading(false);
  };

  // Get camera events
  const getEvents = async (device) => {
    setSelectedDevice(device);
    setEventsDialog(true);
    setEventsLoading(true);
    setEvents([]);
    
    try {
      const response = await axios.get(`/api/ring/camera/${device.deviceId || device.id}/events`);
      setEvents(response.data);
    } catch (error) {
      setEvents([{ error: error.response?.data?.message || error.message }]);
    }
    setEventsLoading(false);
  };

  // Start live stream
  const startStream = async (device) => {
    const deviceId = device.deviceId || device.id;
    setStreamStatus(prev => ({ ...prev, [deviceId]: 'starting' }));
    
    try {
      const response = await axios.post(`/api/ring/camera/${deviceId}/stream/start`);
      setStreamStatus(prev => ({ ...prev, [deviceId]: response.data }));
    } catch (error) {
      setStreamStatus(prev => ({ 
        ...prev, 
        [deviceId]: { error: error.response?.data?.message || error.message } 
      }));
    }
  };

  // Stop live stream
  const stopStream = async (device) => {
    const deviceId = device.deviceId || device.id;
    try {
      await axios.post(`/api/ring/camera/${deviceId}/stream/stop`);
      setStreamStatus(prev => ({ ...prev, [deviceId]: null }));
    } catch (error) {
      console.error('Error stopping stream:', error);
    }
  };

  // Toggle camera light
  const toggleLight = async (device, on) => {
    try {
      await axios.post(`/api/ring/camera/${device.deviceId || device.id}/light`, { on });
    } catch (error) {
      console.error('Error toggling light:', error);
    }
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
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Ring Doorbell & Cameras
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor and control your Ring devices
            </Typography>
          </div>
          {isLinked && (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchDevices}
              disabled={loading}
            >
              Refresh
            </Button>
          )}
        </Box>

        {/* Account Required Prompt */}
        <AccountRequiredPrompt 
          providerId="ring"
          title="Connect Ring"
          description="Sign in to your Ring account to view and control your doorbells, cameras, and alarm systems. Get snapshots, view history, and manage motion alerts."
        />

        {/* Only show content when account is linked */}
        {isLinked && (
          <>
            <Card sx={{ mb: 3, background: 'rgba(255, 193, 7, 0.1)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  🔑 {authStatus?.configured ? 'Ring Connected' : 'API Token Required'}
                </Typography>
                {authStatus?.configured ? (
                  <Typography variant="body2" color="text.secondary">
                    Ring API is configured. Note: Ring cameras stream via cloud only - no local ports.
                  </Typography>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      To enable full Ring API access, you need a refresh token:
                    </Typography>
                    <Box component="ol" sx={{ pl: 2, m: 0, fontSize: '0.85rem', color: 'text.secondary' }}>
                      <li>Run: <code>npx -p ring-client-api ring-auth-cli</code></li>
                      <li>Enter your Ring email/password and complete 2FA</li>
                      <li>Add to .env: <code>RING_REFRESH_TOKEN=your_token</code></li>
                      <li>Restart the server</li>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>

            {devices.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h6" color="text.secondary">
                    No Ring devices found. Generate a refresh token and add it to your .env file.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {devices.map((device) => (
                  <Grid item xs={12} md={6} key={device.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <VideocamIcon sx={{ fontSize: 40, color: '#00B5E2', mr: 2 }} />
                          <div>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {device.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {device.model || device.type} • {device.location || 'Ring Cloud'}
                        </Typography>
                      </div>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {(device.battery || device.batteryLevel) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Battery Level
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {device.battery || device.batteryLevel}%
                            </Typography>
                          </Box>
                          {device.isCharging && (
                            <Chip label="Charging" color="success" size="small" />
                          )}
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {device.hasLight && <Chip label="Light" size="small" icon={<LightbulbIcon />} />}
                        {device.hasSiren && <Chip label="Siren" size="small" color="error" />}
                      </Box>

                      <FormControlLabel
                        control={
                          <Switch
                            defaultChecked
                            onChange={(e) => toggleMotionDetection(device.deviceId || device.id, e.target.checked)}
                          />
                        }
                        label="Motion Detection"
                      />

                      {/* Stream status */}
                      {streamStatus[device.deviceId || device.id] && (
                        <Alert 
                          severity={streamStatus[device.deviceId || device.id]?.error ? 'error' : 'info'}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {streamStatus[device.deviceId || device.id]?.error || 
                           `RTSP: ${streamStatus[device.deviceId || device.id]?.rtspUrl || 'Starting...'}`}
                        </Alert>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CameraAltIcon />}
                          onClick={() => getSnapshot(device)}
                          sx={{ flex: 1 }}
                        >
                          Snapshot
                        </Button>
                        {!streamStatus[device.deviceId || device.id]?.rtspUrl ? (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => startStream(device)}
                            disabled={streamStatus[device.deviceId || device.id] === 'starting'}
                            sx={{ flex: 1 }}
                          >
                            Start Stream
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<StopIcon />}
                            onClick={() => stopStream(device)}
                            sx={{ flex: 1 }}
                          >
                            Stop Stream
                          </Button>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<HistoryIcon />}
                          fullWidth
                          onClick={() => getEvents(device)}
                        >
                          Events
                        </Button>
                        {device.hasLight && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<LightbulbIcon />}
                            onClick={() => toggleLight(device, true)}
                          >
                            Light
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

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
                <>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Devices Found:</strong> {Array.isArray(apiTestResult) ? apiTestResult.length : 0}
                  </Typography>
                  <pre style={{ margin: 0, fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(apiTestResult, null, 2)}
                  </pre>
                </>
              )}
            </Box>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Click "Test API" to fetch Ring device data
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Snapshot Dialog */}
        <Dialog open={snapshotDialog} onClose={() => setSnapshotDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            📷 Snapshot - {selectedDevice?.name}
          </DialogTitle>
          <DialogContent>
            {snapshotLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : snapshotData?.error ? (
              <Alert severity="error">{snapshotData.error}</Alert>
            ) : snapshotData?.dataUrl ? (
              <Box sx={{ textAlign: 'center' }}>
                <img 
                  src={snapshotData.dataUrl} 
                  alt="Camera Snapshot" 
                  style={{ maxWidth: '100%', borderRadius: 8 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Captured: {snapshotData.timestamp}
                </Typography>
              </Box>
            ) : (
              <Typography>No snapshot available</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => getSnapshot(selectedDevice)}>Refresh</Button>
            <Button onClick={() => setSnapshotDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Events Dialog */}
        <Dialog open={eventsDialog} onClose={() => setEventsDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            📋 Recent Events - {selectedDevice?.name}
          </DialogTitle>
          <DialogContent>
            {eventsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : events.length === 0 ? (
              <Typography>No events found</Typography>
            ) : events[0]?.error ? (
              <Alert severity="error">{events[0].error}</Alert>
            ) : (
              <List>
                {events.map((event, index) => (
                  <React.Fragment key={event.id || index}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={event.type} 
                              size="small" 
                              color={event.type === 'motion' ? 'warning' : event.type === 'ding' ? 'primary' : 'default'}
                            />
                            {event.answered && <Chip label="Answered" size="small" color="success" />}
                          </Box>
                        }
                        secondary={`${new Date(event.timestamp).toLocaleString()} • Duration: ${event.duration}s`}
                      />
                    </ListItem>
                    {index < events.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => getEvents(selectedDevice)}>Refresh</Button>
            <Button onClick={() => setEventsDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
          </>
        )}
      </motion.div>
    </Container>
  );
};

export default RingPage;
