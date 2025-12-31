import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  Slider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Box,
  Tabs,
  Tab
} from '@mui/material';
import PowerIcon from '@mui/icons-material/Power';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import BoltIcon from '@mui/icons-material/Bolt';
import ApiIcon from '@mui/icons-material/Api';
import { motion } from 'framer-motion';

const TpLinkPage = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);

  useEffect(() => {
    discoverDevices();
    const interval = setInterval(discoverDevices, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const discoverDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tplink/discover');
      const data = await response.json();
      
      if (data.installed === false) {
        setError(data.message);
      } else if (data.devices) {
        setDevices(data.devices);
      }
    } catch (err) {
      setError('Failed to discover TP-Link devices: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePower = async (host, currentState) => {
    try {
      const response = await fetch(`/api/tplink/${host}/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: !currentState })
      });
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setDevices(devices.map(d => 
          d.host === host ? { ...d, powerState: !currentState } : d
        ));
      }
    } catch (err) {
      console.error('Failed to toggle power:', err);
    }
  };

  const setBrightness = async (host, brightness) => {
    try {
      await fetch(`/api/tplink/${host}/brightness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brightness })
      });
    } catch (err) {
      console.error('Failed to set brightness:', err);
    }
  };

  const setColor = async (host, hue, saturation, brightness) => {
    try {
      await fetch(`/api/tplink/${host}/color`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hue, saturation, brightness })
      });
    } catch (err) {
      console.error('Failed to set color:', err);
    }
  };

  const getEnergyData = async (host) => {
    try {
      const response = await fetch(`/api/tplink/${host}/emeter`);
      const data = await response.json();
      
      if (data.success) {
        alert(`Current Power: ${data.realtime.power_mw / 1000}W\nVoltage: ${data.realtime.voltage_mv / 1000}V\nCurrent: ${data.realtime.current_ma / 1000}A`);
      }
    } catch (err) {
      console.error('Failed to get energy data:', err);
    }
  };

  const handleTestApi = async () => {
    setApiTestLoading(true);
    try {
      const response = await fetch('/api/tplink/discover');
      const data = await response.json();
      setApiTestResult(data);
      setApiTestTimestamp(new Date().toLocaleString());
    } catch (err) {
      setApiTestResult({ error: err.message });
      setApiTestTimestamp(new Date().toLocaleString());
    }
    setApiTestLoading(false);
  };

  const plugs = devices.filter(d => d.deviceType === 'plug');
  const bulbs = devices.filter(d => d.deviceType === 'bulb');

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <PowerIcon sx={{ fontSize: 40, color: '#00BFA5' }} />
        TP-Link Kasa
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`Plugs (${plugs.length})`} />
            <Tab label={`Bulbs (${bulbs.length})`} />
          </Tabs>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <PowerIcon />}
            onClick={discoverDevices}
            disabled={loading}
          >
            Discover Devices
          </Button>
        </Box>
      </Paper>

      {/* Plugs Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {plugs.map((device) => (
            <Grid item xs={12} md={6} lg={4} key={device.host}>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{device.alias}</Typography>
                      <BoltIcon sx={{ color: '#00BFA5' }} />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {device.model}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      IP: {device.host}
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={device.powerState || false}
                          onChange={() => togglePower(device.host, device.powerState)}
                        />
                      }
                      label={device.powerState ? 'On' : 'Off'}
                      sx={{ mt: 2 }}
                    />

                    {device.model?.includes('HS110') && (
                      <Chip
                        size="small"
                        label="Energy Monitoring"
                        color="primary"
                        sx={{ mt: 1 }}
                        onClick={() => getEnergyData(device.host)}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}

          {plugs.length === 0 && !loading && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No TP-Link smart plugs found. Click "Discover Devices" to search.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Bulbs Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {bulbs.map((device) => (
            <Grid item xs={12} md={6} lg={4} key={device.host}>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card sx={{ bgcolor: device.powerState ? '#FFFBEA' : 'inherit' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{device.alias}</Typography>
                      <LightbulbIcon sx={{ color: device.powerState ? '#FFB300' : '#ccc' }} />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {device.model}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      IP: {device.host}
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={device.powerState || false}
                          onChange={() => togglePower(device.host, device.powerState)}
                        />
                      }
                      label={device.powerState ? 'On' : 'Off'}
                      sx={{ mt: 2 }}
                    />

                    {device.powerState && (
                      <>
                        <Typography variant="caption" gutterBottom display="block" sx={{ mt: 2 }}>
                          Brightness
                        </Typography>
                        <Slider
                          defaultValue={50}
                          min={0}
                          max={100}
                          onChangeCommitted={(e, value) => setBrightness(device.host, value)}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}

          {bulbs.length === 0 && !loading && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No TP-Link smart bulbs found. Click "Discover Devices" to search.
                </Typography>
              </Paper>
            </Grid>
          )}
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
              Click "Test API" to fetch device discovery data
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default TpLinkPage;
