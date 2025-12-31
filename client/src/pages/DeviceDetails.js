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
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PrintIcon from '@mui/icons-material/Print';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TvIcon from '@mui/icons-material/Tv';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import axios from 'axios';
import { motion } from 'framer-motion';

const DeviceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [powerState, setPowerState] = useState(null);
  const [controlError, setControlError] = useState(null);

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
      if (device.type === 'wemo-plug') {
        const res = await axios.get(`/api/wemo/${ip}/info`);
        // WeMo binaryState can be "0", "1", 0, or 1.
        const state = res.data.binaryState;
        setPowerState(state === 1 || state === '1');
      } else if (device.type && device.type.includes('tplink')) {
        // TP-Link state fetching if needed
      } else if (device.type === 'samsung-tv') {
        const res = await axios.get(`/api/samsung/${ip}/status`);
        setPowerState(res.data.online);
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
      if (device.type === 'wemo-plug') {
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

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!device) {
    return (
      <Container maxWidth="lg">
        <Typography>Device not found</Typography>
        <Button onClick={() => navigate('/')} startIcon={<ArrowBackIcon />}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
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
                {device.name}
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
            {(device.type === 'wemo-plug' || (device.type && device.type.includes('tplink'))) && (
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
                  <TvIcon /> TV Controls
                </Typography>
                {controlError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {controlError}
                  </Alert>
                )}
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography>Power</Typography>
                            <Button 
                                variant={powerState ? "contained" : "outlined"} 
                                color={powerState ? "success" : "error"}
                                onClick={handlePowerToggle}
                                startIcon={<PowerSettingsNewIcon />}
                            >
                                {powerState ? "ON" : "OFF"}
                            </Button>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={8}>
                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography>Volume</Typography>
                            <Button variant="outlined" onClick={() => handleSamsungKey('KEY_VOLUP')} startIcon={<VolumeUpIcon />}>Up</Button>
                            <Button variant="outlined" onClick={() => handleSamsungKey('KEY_VOLDOWN')} startIcon={<VolumeDownIcon />}>Down</Button>
                            <Button variant="outlined" color="warning" onClick={() => handleSamsungKey('KEY_MUTE')} startIcon={<VolumeOffIcon />}>Mute</Button>
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
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Port
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {device.port || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Last Seen
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {new Date(device.lastSeen).toLocaleString()}
                    </Typography>
                  </Box>
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
