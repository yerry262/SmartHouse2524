import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Tabs,
  Tab,
  Alert,
  Chip,
  IconButton,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PowerIcon from '@mui/icons-material/Power';
import SensorsIcon from '@mui/icons-material/Sensors';
import RefreshIcon from '@mui/icons-material/Refresh';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import axios from 'axios';
import { motion } from 'framer-motion';

const WyzePage = () => {
  const [devices, setDevices] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [bulbs, setBulbs] = useState([]);
  const [plugs, setPlugs] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [devicesRes, camerasRes, bulbsRes, plugsRes, sensorsRes] = await Promise.all([
        axios.get('/api/wyze/devices').catch(() => ({ data: { devices: [] } })),
        axios.get('/api/wyze/cameras').catch(() => ({ data: { cameras: [] } })),
        axios.get('/api/wyze/bulbs').catch(() => ({ data: { bulbs: [] } })),
        axios.get('/api/wyze/plugs').catch(() => ({ data: { plugs: [] } })),
        axios.get('/api/wyze/sensors').catch(() => ({ data: { sensors: [] } }))
      ]);

      if (devicesRes.data.installed === false) {
        setError(devicesRes.data.message);
      } else {
        setDevices(devicesRes.data.devices || []);
        setCameras(camerasRes.data.cameras || []);
        setBulbs(bulbsRes.data.bulbs || []);
        setPlugs(plugsRes.data.plugs || []);
        setSensors(sensorsRes.data.sensors || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load Wyze devices');
    } finally {
      setLoading(false);
    }
  };

  const toggleDevice = async (device, turnOn) => {
    try {
      const endpoint = turnOn ? 'on' : 'off';
      await axios.post(`/api/wyze/devices/${device.mac}/${endpoint}`);
      loadDevices();
    } catch (err) {
      console.error(`Error toggling device:`, err);
    }
  };

  const DeviceCard = ({ device, icon: Icon }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Icon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1rem' }}>
            {device.nickname || device.mac}
          </Typography>
          {device.online && (
            <Chip label="Online" size="small" color="success" />
          )}
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Type: {device.type}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          {device.model}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            color="success"
            onClick={() => toggleDevice(device, true)}
            fullWidth
          >
            On
          </Button>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={() => toggleDevice(device, false)}
            fullWidth
          >
            Off
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const SensorCard = ({ sensor }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SensorsIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
            {sensor.nickname || sensor.mac}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Type: {sensor.product_type}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {sensor.product_model}
        </Typography>
      </CardContent>
    </Card>
  );

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
              Wyze Smart Devices
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Control your Wyze cameras, bulbs, plugs, and sensors
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

        <Card sx={{ mb: 3, background: 'rgba(33, 150, 243, 0.1)' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              📱 Wyze devices require your account credentials in the .env file (WYZE_EMAIL and WYZE_PASSWORD).
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label={`All Devices (${devices.length})`} />
            <Tab label={`Cameras (${cameras.length})`} icon={<VideocamIcon />} iconPosition="start" />
            <Tab label={`Bulbs (${bulbs.length})`} icon={<LightbulbIcon />} iconPosition="start" />
            <Tab label={`Plugs (${plugs.length})`} icon={<PowerIcon />} iconPosition="start" />
            <Tab label={`Sensors (${sensors.length})`} icon={<SensorsIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* All Devices Tab */}
        {currentTab === 0 && (
          <Grid container spacing={3}>
            {devices.length === 0 ? (
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No Wyze devices found. Check your credentials in the .env file.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              devices.map((device) => (
                <Grid item xs={12} sm={6} md={4} key={device.mac}>
                  <DeviceCard device={device} icon={PowerIcon} />
                </Grid>
              ))
            )}
          </Grid>
        )}

        {/* Cameras Tab */}
        {currentTab === 1 && (
          <Grid container spacing={3}>
            {cameras.length === 0 ? (
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <VideocamIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">No Wyze cameras found</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              cameras.map((camera) => (
                <Grid item xs={12} sm={6} md={4} key={camera.mac}>
                  <DeviceCard device={camera} icon={VideocamIcon} />
                </Grid>
              ))
            )}
          </Grid>
        )}

        {/* Bulbs Tab */}
        {currentTab === 2 && (
          <Grid container spacing={3}>
            {bulbs.length === 0 ? (
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <LightbulbIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">No Wyze bulbs found</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              bulbs.map((bulb) => (
                <Grid item xs={12} sm={6} md={4} key={bulb.mac}>
                  <DeviceCard device={bulb} icon={LightbulbIcon} />
                </Grid>
              ))
            )}
          </Grid>
        )}

        {/* Plugs Tab */}
        {currentTab === 3 && (
          <Grid container spacing={3}>
            {plugs.length === 0 ? (
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <PowerIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">No Wyze plugs found</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              plugs.map((plug) => (
                <Grid item xs={12} sm={6} md={4} key={plug.mac}>
                  <DeviceCard device={plug} icon={PowerIcon} />
                </Grid>
              ))
            )}
          </Grid>
        )}

        {/* Sensors Tab */}
        {currentTab === 4 && (
          <Grid container spacing={3}>
            {sensors.length === 0 ? (
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <SensorsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">No Wyze sensors found</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              sensors.map((sensor) => (
                <Grid item xs={12} sm={6} md={4} key={sensor.mac}>
                  <SensorCard sensor={sensor} />
                </Grid>
              ))
            )}
          </Grid>
        )}
      </motion.div>
    </Container>
  );
};

export default WyzePage;
