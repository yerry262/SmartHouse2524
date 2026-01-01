import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Tabs,
  Tab,
  Alert,
  Chip,
  CircularProgress,
  Paper,
  TextField,
} from '@mui/material';
import KitchenIcon from '@mui/icons-material/Kitchen';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import { motion } from 'framer-motion';
import axios from 'axios';

const SamsungAppliancesPage = () => {
  const [tab, setTab] = useState(0);
  const [refrigerators, setRefrigerators] = useState([]);
  const [ovens, setOvens] = useState([]);
  const [laundry, setLaundry] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    checkConfiguration();
    loadAppliances();
  }, []);

  const checkConfiguration = async () => {
    try {
      const res = await axios.get('/api/samsung-appliances/status');
      setConfigured(res.data.configured);
    } catch (err) {
      console.error('Configuration check failed:', err);
    }
  };

  const loadAppliances = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fridgeRes, ovenRes, laundryRes] = await Promise.allSettled([
        axios.get('/api/samsung-appliances/refrigerators'),
        axios.get('/api/samsung-appliances/ovens'),
        axios.get('/api/samsung-appliances/laundry'),
      ]);

      if (fridgeRes.status === 'fulfilled') {
        setRefrigerators(fridgeRes.value.data.refrigerators || []);
      }
      if (ovenRes.status === 'fulfilled') {
        setOvens(ovenRes.value.data.ovens || []);
      }
      if (laundryRes.status === 'fulfilled') {
        setLaundry(laundryRes.value.data.laundry || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appliances');
    } finally {
      setLoading(false);
    }
  };

  const setTemperature = async (id, temp) => {
    try {
      await axios.post(`/api/samsung-appliances/refrigerators/${id}/temperature`, {
        temperature: temp
      });
      setSuccess(`Temperature set to ${temp}°`);
      setTimeout(() => setSuccess(null), 3000);
      loadAppliances();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set temperature');
    }
  };

  const RefrigeratorCard = ({ fridge }) => {
    const [targetTemp, setTargetTemp] = useState(37);

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <KitchenIcon sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
            <Box>
              <Typography variant="h6">{fridge.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Model: {fridge.model}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Chip
              label={fridge.online ? 'Online' : 'Offline'}
              color={fridge.online ? 'success' : 'error'}
              size="small"
              sx={{ mr: 1 }}
            />
            {fridge.doorStatus && (
              <Chip
                label={`Door: ${fridge.doorStatus}`}
                size="small"
                color={fridge.doorStatus === 'closed' ? 'success' : 'warning'}
              />
            )}
          </Box>

          {fridge.temperature && (
            <Paper sx={{ p: 2, mb: 2, background: 'rgba(25, 118, 210, 0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ThermostatIcon sx={{ mr: 1, color: '#1976d2' }} />
                <Typography variant="subtitle2">
                  Current: {fridge.temperature}°{fridge.temperatureUnit || 'F'}
                </Typography>
              </Box>
              <TextField
                type="number"
                label="Target Temperature"
                value={targetTemp}
                onChange={(e) => setTargetTemp(e.target.value)}
                size="small"
                fullWidth
                sx={{ mb: 1 }}
              />
              <Button
                size="small"
                variant="contained"
                fullWidth
                onClick={() => setTemperature(fridge.id, targetTemp)}
              >
                Set Temperature
              </Button>
            </Paper>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Device ID: {fridge.id}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const ApplianceCard = ({ appliance, icon }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Box sx={{ ml: 2 }}>
            <Typography variant="h6">{appliance.label || appliance.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {appliance.name || appliance.type}
            </Typography>
          </Box>
        </Box>
        <Chip
          label="Connected"
          color="success"
          size="small"
        />
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Device ID: {appliance.deviceId || appliance.id}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

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
              Samsung SmartThings Appliances
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Control your Samsung smart appliances
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={loadAppliances}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {!configured && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Samsung SmartThings not configured. Set SAMSUNG_SMARTTHINGS_TOKEN in .env file.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs value={tab} onChange={(e, val) => setTab(val)} variant="fullWidth">
            <Tab icon={<KitchenIcon />} label="Refrigerators" />
            <Tab icon={<LocalFireDepartmentIcon />} label="Ovens" />
            <Tab icon={<LocalLaundryServiceIcon />} label="Laundry" />
          </Tabs>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Refrigerators Tab */}
            {tab === 0 && (
              <Grid container spacing={3}>
                {refrigerators.length === 0 ? (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <KitchenIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No Samsung refrigerators found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Make sure devices are connected to Samsung SmartThings
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ) : (
                  refrigerators.map((fridge) => (
                    <Grid item xs={12} md={6} key={fridge.id}>
                      <RefrigeratorCard fridge={fridge} />
                    </Grid>
                  ))
                )}
              </Grid>
            )}

            {/* Ovens Tab */}
            {tab === 1 && (
              <Grid container spacing={3}>
                {ovens.length === 0 ? (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <LocalFireDepartmentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No Samsung ovens found
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ) : (
                  ovens.map((oven) => (
                    <Grid item xs={12} md={6} key={oven.deviceId}>
                      <ApplianceCard
                        appliance={oven}
                        icon={<LocalFireDepartmentIcon sx={{ fontSize: 40, color: '#f57c00' }} />}
                      />
                    </Grid>
                  ))
                )}
              </Grid>
            )}

            {/* Laundry Tab */}
            {tab === 3 && (
              <Grid container spacing={3}>
                {laundry.length === 0 ? (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <LocalLaundryServiceIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No Samsung washers/dryers found
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ) : (
                  laundry.map((item) => (
                    <Grid item xs={12} md={6} key={item.deviceId}>
                      <ApplianceCard
                        appliance={item}
                        icon={<LocalLaundryServiceIcon sx={{ fontSize: 40, color: '#5e35b1' }} />}
                      />
                    </Grid>
                  ))
                )}
              </Grid>
            )}
          </>
        )}
      </motion.div>
    </Container>
  );
};

export default SamsungAppliancesPage;
