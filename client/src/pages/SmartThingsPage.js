import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Home as HomeIcon,
  PowerSettingsNew as PowerIcon,
  Lightbulb as LightbulbIcon,
  Thermostat as ThermostatIcon,
  Lock as LockIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Api as ApiIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';

const SmartThingsPage = () => {
  const [devices, setDevices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [commandDialog, setCommandDialog] = useState(false);
  const [commandData, setCommandData] = useState({
    capability: '',
    command: '',
    arguments: ''
  });
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);

  useEffect(() => {
    discoverDevices();
    getLocations();
  }, []);

  const discoverDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/smartthings/discover');
      setDevices(response.data.devices || []);
      
      if (!response.data.success) {
        console.warn(response.data.message);
      }
    } catch (error) {
      console.error('Error discovering SmartThings devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestApi = async () => {
    setApiTestLoading(true);
    try {
      const response = await axios.get('/api/smartthings/discover');
      setApiTestResult(response.data);
      setApiTestTimestamp(new Date().toLocaleString());
    } catch (err) {
      setApiTestResult({ error: err.message || 'API request failed' });
      setApiTestTimestamp(new Date().toLocaleString());
    }
    setApiTestLoading(false);
  };

  const getLocations = async () => {
    try {
      const response = await axios.get('/api/smartthings/locations');
      setLocations(response.data.items || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const getRooms = async (locationId) => {
    try {
      const response = await axios.get(`/api/smartthings/locations/${locationId}/rooms`);
      setRooms(response.data.items || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const sendCommand = async () => {
    if (!selectedDevice || !commandData.capability || !commandData.command) return;
    
    try {
      const args = commandData.arguments ? JSON.parse(commandData.arguments) : [];
      
      const response = await axios.post(`/api/smartthings/${selectedDevice.id}/command`, {
        capability: commandData.capability,
        command: commandData.command,
        arguments: args
      });

      if (response.data.success) {
        console.log('Command sent successfully');
        setCommandDialog(false);
        // Refresh device list
        discoverDevices();
      } else {
        console.error('Command failed:', response.data.error);
      }
    } catch (error) {
      console.error('Error sending command:', error);
    }
  };

  const getDeviceIcon = (device) => {
    const capabilities = device.capabilities.map(cap => cap.id?.toLowerCase() || '');
    
    if (capabilities.includes('switch') || capabilities.includes('switchlevel')) {
      return <LightbulbIcon />;
    } else if (capabilities.includes('thermostat')) {
      return <ThermostatIcon />;
    } else if (capabilities.includes('lock')) {
      return <LockIcon />;
    } else if (capabilities.includes('powerMeter') || capabilities.includes('outlet')) {
      return <PowerIcon />;
    }
    return <HomeIcon />;
  };

  const getCapabilityChips = (device) => {
    return device.capabilities.slice(0, 3).map((cap, index) => (
      <Chip
        key={index}
        label={cap.id || 'Unknown'}
        size="small"
        variant="outlined"
        sx={{ mr: 0.5, mb: 0.5 }}
      />
    ));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Samsung SmartThings
          </Typography>
          <Box>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={discoverDevices}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              {loading ? 'Discovering...' : 'Discover Devices'}
            </Button>
          </Box>
        </Box>

        {devices.length === 0 && !loading && (
          <Alert severity="info" sx={{ mb: 3 }}>
            No SmartThings devices found. Make sure your SMARTTHINGS_TOKEN is configured in the environment variables.
          </Alert>
        )}

        <Grid container spacing={3}>
          {devices.map((device) => (
            <Grid item xs={12} sm={6} md={4} key={device.id}>
              <motion.div variants={itemVariants}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => setSelectedDevice(device)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Box mr={2} color="primary.main">
                        {getDeviceIcon(device)}
                      </Box>
                      <Box flex={1}>
                        <Typography variant="h6" component="h3" noWrap>
                          {device.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {device.manufacturer} • {device.model}
                        </Typography>
                      </Box>
                    </Box>

                    <Box mb={2}>
                      {getCapabilityChips(device)}
                      {device.capabilities.length > 3 && (
                        <Chip 
                          label={`+${device.capabilities.length - 3} more`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Chip
                        label={device.status}
                        size="small"
                        color={device.status === 'ONLINE' ? 'success' : 'default'}
                      />
                      <Button
                        size="small"
                        startIcon={<SettingsIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDevice(device);
                          setCommandDialog(true);
                        }}
                      >
                        Control
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
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
                Click "Test API" to fetch SmartThings device data
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Command Dialog */}
        <Dialog 
          open={commandDialog} 
          onClose={() => setCommandDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Send Command to {selectedDevice?.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Capability</InputLabel>
                <Select
                  value={commandData.capability}
                  onChange={(e) => setCommandData({...commandData, capability: e.target.value})}
                >
                  {selectedDevice?.capabilities.map((cap) => (
                    <MenuItem key={cap.id} value={cap.id}>
                      {cap.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                margin="normal"
                label="Command"
                value={commandData.command}
                onChange={(e) => setCommandData({...commandData, command: e.target.value})}
                placeholder="e.g., on, off, setLevel"
              />

              <TextField
                fullWidth
                margin="normal"
                label="Arguments (JSON Array)"
                value={commandData.arguments}
                onChange={(e) => setCommandData({...commandData, arguments: e.target.value})}
                placeholder='e.g., [50] for setLevel or [] for no args'
                multiline
                rows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCommandDialog(false)}>Cancel</Button>
            <Button 
              onClick={sendCommand}
              variant="contained"
              disabled={!commandData.capability || !commandData.command}
            >
              Send Command
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default SmartThingsPage;