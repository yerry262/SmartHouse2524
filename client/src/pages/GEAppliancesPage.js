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
  Slider,
  TextField,
  CircularProgress,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import KitchenIcon from '@mui/icons-material/Kitchen';
import RefreshIcon from '@mui/icons-material/Refresh';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import CountertopsIcon from '@mui/icons-material/Countertops';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import { motion } from 'framer-motion';
import axios from 'axios';

const GEAppliancesPage = () => {
  const [tab, setTab] = useState(0);
  const [refrigerators, setRefrigerators] = useState([]);
  const [ovens, setOvens] = useState([]);
  const [dishwashers, setDishwashers] = useState([]);
  const [laundry, setLaundry] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadAppliances();
  }, []);

  const loadAppliances = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fridgeRes, ovenRes, dishRes, laundryRes] = await Promise.allSettled([
        axios.get('/api/ge-appliances/refrigerators'),
        axios.get('/api/ge-appliances/ovens'),
        axios.get('/api/ge-appliances/dishwashers'),
        axios.get('/api/ge-appliances/laundry'),
      ]);

      if (fridgeRes.status === 'fulfilled') setRefrigerators(fridgeRes.value.data.refrigerators || []);
      if (ovenRes.status === 'fulfilled') setOvens(ovenRes.value.data.ovens || []);
      if (dishRes.status === 'fulfilled') setDishwashers(dishRes.value.data.dishwashers || []);
      if (laundryRes.status === 'fulfilled') setLaundry(laundryRes.value.data.laundry || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appliances. Check GE credentials in .env');
    } finally {
      setLoading(false);
    }
  };

  const setTemperature = async (id, compartment, temp) => {
    try {
      await axios.post(`/api/ge-appliances/refrigerators/${id}/temperature`, {
        compartment,
        temperature: temp
      });
      setSuccess(`${compartment} temperature set to ${temp}°F`);
      setTimeout(() => setSuccess(null), 3000);
      loadAppliances();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set temperature');
    }
  };

  const setIceMaker = async (id, mode) => {
    try {
      await axios.post(`/api/ge-appliances/refrigerators/${id}/icemaker`, { mode });
      setSuccess(`Ice maker set to ${mode}`);
      setTimeout(() => setSuccess(null), 3000);
      loadAppliances();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to control ice maker');
    }
  };

  const setTurboMode = async (id, enabled) => {
    try {
      await axios.post(`/api/ge-appliances/refrigerators/${id}/turbo`, { enabled });
      setSuccess(`Turbo mode ${enabled ? 'enabled' : 'disabled'}`);
      setTimeout(() => setSuccess(null), 3000);
      loadAppliances();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set turbo mode');
    }
  };

  const RefrigeratorCard = ({ fridge }) => {
    const [fridgeTemp, setFridgeTemp] = useState(37);
    const [freezerTemp, setFreezerTemp] = useState(0);

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
            <Chip
              label={`Door: ${fridge.doorStatus || 'Closed'}`}
              size="small"
              sx={{ mr: 1 }}
            />
            {fridge.filterStatus && (
              <Chip
                label={`Filter: ${fridge.filterStatus}`}
                size="small"
                color={fridge.filterStatus === 'good' ? 'success' : 'warning'}
              />
            )}
          </Box>

          {/* Fridge Temperature */}
          <Paper sx={{ p: 2, mb: 2, background: 'rgba(25, 118, 210, 0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ThermostatIcon sx={{ mr: 1, color: '#1976d2' }} />
              <Typography variant="subtitle2">Fridge Temperature</Typography>
            </Box>
            <Slider
              value={fridgeTemp}
              onChange={(e, val) => setFridgeTemp(val)}
              min={33}
              max={42}
              step={1}
              marks
              valueLabelDisplay="on"
              valueLabelFormat={(val) => `${val}°F`}
            />
            <Button
              size="small"
              variant="contained"
              fullWidth
              onClick={() => setTemperature(fridge.id, 'fridge', fridgeTemp)}
            >
              Set Fridge Temp
            </Button>
          </Paper>

          {/* Freezer Temperature */}
          <Paper sx={{ p: 2, mb: 2, background: 'rgba(2, 136, 209, 0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AcUnitIcon sx={{ mr: 1, color: '#0288d1' }} />
              <Typography variant="subtitle2">Freezer Temperature</Typography>
            </Box>
            <Slider
              value={freezerTemp}
              onChange={(e, val) => setFreezerTemp(val)}
              min={-6}
              max={6}
              step={1}
              marks
              valueLabelDisplay="on"
              valueLabelFormat={(val) => `${val}°F`}
            />
            <Button
              size="small"
              variant="contained"
              fullWidth
              onClick={() => setTemperature(fridge.id, 'freezer', freezerTemp)}
            >
              Set Freezer Temp
            </Button>
          </Paper>

          {/* Ice Maker & Turbo Controls */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setIceMaker(fridge.id, 'on')}
            >
              Ice Maker On
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setIceMaker(fridge.id, 'max')}
            >
              Max Ice
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setTurboMode(fridge.id, true)}
            >
              Turbo Cool
            </Button>
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
            <Typography variant="h6">{appliance.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              Model: {appliance.model}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={appliance.online ? 'Online' : 'Offline'}
          color={appliance.online ? 'success' : 'error'}
          size="small"
        />
        {appliance.status && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Status: {JSON.stringify(appliance.status)}
            </Typography>
          </Box>
        )}
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
              GE SmartHQ Appliances
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Control your GE smart appliances
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
            <Tab icon={<CountertopsIcon />} label="Dishwashers" />
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
                          No GE refrigerators found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Make sure GE_USERNAME and GE_PASSWORD are set in .env
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
                          No GE ovens found
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ) : (
                  ovens.map((oven) => (
                    <Grid item xs={12} md={6} key={oven.id}>
                      <ApplianceCard
                        appliance={oven}
                        icon={<LocalFireDepartmentIcon sx={{ fontSize: 40, color: '#f57c00' }} />}
                      />
                    </Grid>
                  ))
                )}
              </Grid>
            )}

            {/* Dishwashers Tab */}
            {tab === 2 && (
              <Grid container spacing={3}>
                {dishwashers.length === 0 ? (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <CountertopsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No GE dishwashers found
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ) : (
                  dishwashers.map((dish) => (
                    <Grid item xs={12} md={6} key={dish.id}>
                      <ApplianceCard
                        appliance={dish}
                        icon={<CountertopsIcon sx={{ fontSize: 40, color: '#00897b' }} />}
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
                          No GE washers/dryers found
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ) : (
                  laundry.map((item) => (
                    <Grid item xs={12} md={6} key={item.id}>
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

export default GEAppliancesPage;
