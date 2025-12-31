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
  Alert,
  Chip,
  Slider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Paper
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import MicIcon from '@mui/icons-material/Mic';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import ApiIcon from '@mui/icons-material/Api';
import axios from 'axios';
import { motion } from 'framer-motion';

const AlexaPage = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [speechText, setSpeechText] = useState('');
  const [customCommand, setCustomCommand] = useState('');
  const [musicQuery, setMusicQuery] = useState('');
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/alexa/devices');

      if (response.data.installed === false) {
        setError(response.data.message);
      } else {
        setDevices(response.data.devices || []);
        if (response.data.devices && response.data.devices.length > 0) {
          setSelectedDevice(response.data.devices[0]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load Alexa devices');
    } finally {
      setLoading(false);
    }
  };

  const handleTestApi = async () => {
    setApiTestLoading(true);
    try {
      const response = await axios.get('/api/alexa/devices');
      setApiTestResult(response.data);
      setApiTestTimestamp(new Date().toLocaleString());
    } catch (err) {
      setApiTestResult({ error: err.message || 'API request failed' });
      setApiTestTimestamp(new Date().toLocaleString());
    }
    setApiTestLoading(false);
  };

  const handleSpeak = async () => {
    if (!selectedDevice || !speechText) return;

    try {
      await axios.post(`/api/alexa/devices/${selectedDevice.serialNumber}/speak`, {
        text: speechText
      });
      setSpeechText('');
    } catch (err) {
      console.error('Error sending speak command:', err);
    }
  };

  const handlePlayMusic = async () => {
    if (!selectedDevice) return;

    try {
      await axios.post(`/api/alexa/devices/${selectedDevice.serialNumber}/play`, {
        query: musicQuery || undefined
      });
      setMusicQuery('');
    } catch (err) {
      console.error('Error playing music:', err);
    }
  };

  const handlePause = async () => {
    if (!selectedDevice) return;

    try {
      await axios.post(`/api/alexa/devices/${selectedDevice.serialNumber}/pause`);
    } catch (err) {
      console.error('Error pausing:', err);
    }
  };

  const handleVolumeChange = async (event, newValue) => {
    if (!selectedDevice) return;

    try {
      await axios.post(`/api/alexa/devices/${selectedDevice.serialNumber}/volume`, {
        volume: newValue
      });
    } catch (err) {
      console.error('Error setting volume:', err);
    }
  };

  const handleCommand = async () => {
    if (!selectedDevice || !customCommand) return;

    try {
      await axios.post(`/api/alexa/devices/${selectedDevice.serialNumber}/command`, {
        command: customCommand
      });
      setCustomCommand('');
    } catch (err) {
      console.error('Error sending command:', err);
    }
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
              Amazon Alexa Devices
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Control your Echo devices, speakers, and smart displays
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadDevices}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3, background: 'rgba(255, 153, 0, 0.1)' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              📧 Amazon Alexa requires your account credentials in the .env file (ALEXA_EMAIL and ALEXA_PASSWORD).
              Note: This uses an unofficial API and may require 2FA setup.
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Device List */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  <RecordVoiceOverIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Devices ({devices.length})
                </Typography>
                
                {devices.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No Echo devices found
                  </Typography>
                ) : (
                  <List>
                    {devices.map((device) => (
                      <ListItem
                        key={device.serialNumber}
                        button
                        selected={selectedDevice?.serialNumber === device.serialNumber}
                        onClick={() => setSelectedDevice(device)}
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          backgroundColor: selectedDevice?.serialNumber === device.serialNumber 
                            ? 'rgba(255, 153, 0, 0.1)' 
                            : 'transparent'
                        }}
                      >
                        <ListItemText
                          primary={device.name}
                          secondary={`${device.family} • ${device.type}`}
                        />
                        <ListItemSecondaryAction>
                          {device.online && (
                            <Chip label="Online" size="small" color="success" />
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Controls */}
          <Grid item xs={12} md={8}>
            {!selectedDevice ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <RecordVoiceOverIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    Select a device to control it
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {/* Text-to-Speech */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        <MicIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Text-to-Speech
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          placeholder="What should Alexa say?"
                          value={speechText}
                          onChange={(e) => setSpeechText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSpeak()}
                        />
                        <Button
                          variant="contained"
                          onClick={handleSpeak}
                          disabled={!speechText}
                          startIcon={<SendIcon />}
                        >
                          Speak
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Music Control */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Music & Playback
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                          fullWidth
                          placeholder="Song, artist, or playlist"
                          value={musicQuery}
                          onChange={(e) => setMusicQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handlePlayMusic()}
                        />
                        <Button
                          variant="contained"
                          color="success"
                          onClick={handlePlayMusic}
                          startIcon={<PlayArrowIcon />}
                        >
                          Play
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          color="primary"
                          onClick={handlePlayMusic}
                          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                        <IconButton
                          color="primary"
                          onClick={handlePause}
                          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <PauseIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Volume Control */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        <VolumeUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Volume Control
                      </Typography>
                      <Slider
                        defaultValue={50}
                        onChangeCommitted={handleVolumeChange}
                        valueLabelDisplay="auto"
                        min={0}
                        max={100}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Custom Command */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Custom Command
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          placeholder="Alexa, what's the weather?"
                          value={customCommand}
                          onChange={(e) => setCustomCommand(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleCommand()}
                        />
                        <Button
                          variant="contained"
                          onClick={handleCommand}
                          disabled={!customCommand}
                          startIcon={<SendIcon />}
                        >
                          Send
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Grid>
        </Grid>

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
                    <strong>Devices Found:</strong> {apiTestResult.devices?.length || 0}
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
                Click "Test API" to fetch Alexa device data
              </Typography>
            </Box>
          )}
        </Paper>
      </motion.div>
    </Container>
  );
};

export default AlexaPage;
