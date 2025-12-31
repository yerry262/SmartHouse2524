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
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import AirIcon from '@mui/icons-material/Air';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import HomeIcon from '@mui/icons-material/Home';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { motion } from 'framer-motion';

const MiioPage = () => {
  const [vacuums, setVacuums] = useState([]);
  const [purifiers, setPurifiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [connectDialog, setConnectDialog] = useState(false);
  const [connectForm, setConnectForm] = useState({ address: '', token: '' });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [vacuumsRes, purifiersRes] = await Promise.all([
        axios.get('/api/miio/vacuums').catch(() => ({ data: { vacuums: [] } })),
        axios.get('/api/miio/purifiers').catch(() => ({ data: { purifiers: [] } }))
      ]);

      if (vacuumsRes.data.installed === false) {
        setError(vacuumsRes.data.message);
      } else {
        setVacuums(vacuumsRes.data.vacuums || []);
        setPurifiers(purifiersRes.data.purifiers || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load miIO devices');
    } finally {
      setLoading(false);
    }
  };

  const discoverDevices = async () => {
    setDiscovering(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/miio/discover');
      setTimeout(() => {
        loadDevices();
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Discovery failed');
    } finally {
      setDiscovering(false);
    }
  };

  const connectDevice = async () => {
    try {
      await axios.post('/api/miio/connect', connectForm);
      setConnectDialog(false);
      setConnectForm({ address: '', token: '' });
      loadDevices();
    } catch (err) {
      setError(err.response?.data?.message || 'Connection failed');
    }
  };

  const controlVacuum = async (id, action) => {
    try {
      await axios.post(`/api/miio/vacuums/${id}/${action}`);
      loadDevices();
    } catch (err) {
      console.error(`Error controlling vacuum:`, err);
    }
  };

  const togglePurifier = async (id, turnOn) => {
    try {
      const endpoint = turnOn ? 'on' : 'off';
      await axios.post(`/api/miio/purifiers/${id}/${endpoint}`);
      loadDevices();
    } catch (err) {
      console.error(`Error toggling purifier:`, err);
    }
  };

  const VacuumCard = ({ vacuum }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CleaningServicesIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1rem' }}>
            {vacuum.model || `Vacuum ${vacuum.id}`}
          </Typography>
          {vacuum.state?.state === 'cleaning' && (
            <Chip label="Cleaning" size="small" color="success" />
          )}
          {vacuum.state?.state === 'charging' && (
            <Chip label="Charging" size="small" color="info" />
          )}
        </Box>

        {vacuum.state && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Status: {vacuum.state.state || 'Unknown'}
              </Typography>
              {vacuum.state.battery !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <BatteryChargingFullIcon sx={{ fontSize: 18, mr: 1 }} />
                  <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={vacuum.state.battery} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="caption">{vacuum.state.battery}%</Typography>
                </Box>
              )}
            </Box>

            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  onClick={() => controlVacuum(vacuum.id, 'clean')}
                  fullWidth
                  startIcon={<PlayArrowIcon />}
                >
                  Clean
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button
                  variant="contained"
                  size="small"
                  color="error"
                  onClick={() => controlVacuum(vacuum.id, 'stop')}
                  fullWidth
                  startIcon={<StopIcon />}
                >
                  Stop
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button
                  variant="contained"
                  size="small"
                  color="info"
                  onClick={() => controlVacuum(vacuum.id, 'dock')}
                  fullWidth
                  startIcon={<HomeIcon />}
                >
                  Dock
                </Button>
              </Grid>
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );

  const PurifierCard = ({ purifier }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AirIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1rem' }}>
            {purifier.model || `Purifier ${purifier.id}`}
          </Typography>
          {purifier.state?.power === 'on' && (
            <Chip label="Running" size="small" color="success" />
          )}
        </Box>

        {purifier.state && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Status: {purifier.state.power || 'Unknown'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                color="success"
                onClick={() => togglePurifier(purifier.id, true)}
                fullWidth
              >
                On
              </Button>
              <Button
                variant="contained"
                size="small"
                color="error"
                onClick={() => togglePurifier(purifier.id, false)}
                fullWidth
              >
                Off
              </Button>
            </Box>
          </>
        )}
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
              Xiaomi miIO Devices
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Control your Roborock vacuums and Xiaomi air purifiers
            </Typography>
          </div>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={discoverDevices}
              disabled={discovering}
            >
              {discovering ? 'Discovering...' : 'Discover'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setConnectDialog(true)}
            >
              Connect
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={loadDevices}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3, background: 'rgba(33, 150, 243, 0.1)' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              🔍 Use "Discover" to find devices automatically, or use "Connect" to add a device manually with its token.
              You can find device tokens using the Xiaomi Home app or miio command-line tool.
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label={`Robot Vacuums (${vacuums.length})`} icon={<CleaningServicesIcon />} iconPosition="start" />
            <Tab label={`Air Purifiers (${purifiers.length})`} icon={<AirIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Vacuums Tab */}
        {currentTab === 0 && (
          <Grid container spacing={3}>
            {vacuums.length === 0 ? (
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <CleaningServicesIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      No robot vacuums found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Click "Discover" to search for devices on your network
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              vacuums.map((vacuum) => (
                <Grid item xs={12} sm={6} md={4} key={vacuum.id}>
                  <VacuumCard vacuum={vacuum} />
                </Grid>
              ))
            )}
          </Grid>
        )}

        {/* Purifiers Tab */}
        {currentTab === 1 && (
          <Grid container spacing={3}>
            {purifiers.length === 0 ? (
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <AirIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      No air purifiers found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Click "Discover" to search for devices on your network
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              purifiers.map((purifier) => (
                <Grid item xs={12} sm={6} md={4} key={purifier.id}>
                  <PurifierCard purifier={purifier} />
                </Grid>
              ))
            )}
          </Grid>
        )}

        {/* Connect Device Dialog */}
        <Dialog open={connectDialog} onClose={() => setConnectDialog(false)}>
          <DialogTitle>Connect miIO Device</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the device IP address and token to connect manually.
            </Typography>
            <TextField
              fullWidth
              label="IP Address"
              value={connectForm.address}
              onChange={(e) => setConnectForm({ ...connectForm, address: e.target.value })}
              placeholder="192.168.1.100"
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              fullWidth
              label="Token"
              value={connectForm.token}
              onChange={(e) => setConnectForm({ ...connectForm, token: e.target.value })}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConnectDialog(false)}>Cancel</Button>
            <Button 
              onClick={connectDevice} 
              variant="contained"
              disabled={!connectForm.address || !connectForm.token}
            >
              Connect
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default MiioPage;
