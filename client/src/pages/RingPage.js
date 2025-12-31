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
  Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import VideocamIcon from '@mui/icons-material/Videocam';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ApiIcon from '@mui/icons-material/Api';
import axios from 'axios';
import { motion } from 'framer-motion';

const RingPage = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/ring/devices');
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching Ring devices:', error);
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
              Ring Doorbell & Cameras
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor and control your Ring devices
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchDevices}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        <Card sx={{ mb: 3, background: 'rgba(255, 193, 7, 0.1)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              🔑 Credentials Required
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure your Ring email and password in the .env file. You may need to handle 2FA authentication.
            </Typography>
          </CardContent>
        </Card>

        {devices.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary">
                No Ring devices found. Check your credentials in the .env file.
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
                          {device.type} • {device.location}
                        </Typography>
                      </div>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {device.battery && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Battery Level
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {device.battery}%
                          </Typography>
                        </Box>
                      )}

                      <FormControlLabel
                        control={
                          <Switch
                            defaultChecked
                            onChange={(e) => toggleMotionDetection(device.id, e.target.checked)}
                          />
                        }
                        label="Motion Detection"
                      />

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<VideocamIcon />}
                          fullWidth
                          onClick={() => {/* View stream */}}
                        >
                          View Live
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<NotificationsIcon />}
                          fullWidth
                          onClick={() => {/* View events */}}
                        >
                          Events
                        </Button>
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
      </motion.div>
    </Container>
  );
};

export default RingPage;
