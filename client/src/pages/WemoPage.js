import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Box,
  Chip,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import PowerIcon from '@mui/icons-material/Power';
import BoltIcon from '@mui/icons-material/Bolt';
import InfoIcon from '@mui/icons-material/Info';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import OutletIcon from '@mui/icons-material/Outlet';
import RefreshIcon from '@mui/icons-material/Refresh';
import ApiIcon from '@mui/icons-material/Api';
import { motion } from 'framer-motion';

const WemoPage = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceDetails, setDeviceDetails] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);

  useEffect(() => {
    discoverDevices();
    const interval = setInterval(discoverDevices, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const discoverDevices = async () => {
    // Don't show loading spinner on background refreshes
    if (devices.length === 0) setLoading(true);
    
    try {
      const response = await fetch('/api/wemo/status/all');
      const data = await response.json();
      
      if (data.devices) {
        setDevices(data.devices);
        setError(null);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Failed to discover WeMo devices:', err);
      // Don't set error state on every poll failure to avoid UI flickering
      if (devices.length === 0) {
        setError('Failed to discover WeMo devices. Server might be offline.');
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePower = async (host, currentState) => {
    try {
      // Optimistic update
      setDevices(devices.map(d => 
        d.host === host ? { ...d, binaryState: !currentState } : d
      ));

      const response = await fetch(`/api/wemo/${host}/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: !currentState })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        // Revert on failure
        setDevices(devices.map(d => 
          d.host === host ? { ...d, binaryState: currentState } : d
        ));
        console.error('Failed to toggle power:', data.error);
      }
    } catch (err) {
      console.error('Failed to toggle power:', err);
      // Revert on failure
      setDevices(devices.map(d => 
        d.host === host ? { ...d, binaryState: currentState } : d
      ));
    }
  };

  const showDeviceDetails = async (host) => {
    try {
      const response = await fetch(`/api/wemo/${host}/status`);
      const data = await response.json();
      setDeviceDetails(data);
      setSelectedDevice(host);
      setDetailsDialog(true);
    } catch (err) {
      console.error('Failed to get device details:', err);
    }
  };

  const getDeviceIcon = (device) => {
    if (device.modelName === 'Socket') {
      return <OutletIcon />;
    } else if (device.modelName === 'LightSwitch') {
      return <LightbulbIcon />;
    }
    return <PowerIcon />;
  };

  const getDeviceTypeLabel = (device) => {
    if (device.modelName === 'Socket') return 'Smart Outlet';
    if (device.modelName === 'LightSwitch') return 'Smart Switch';
    return 'WeMo Device';
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleTestApi = async (host) => {
    setApiTestLoading(true);
    try {
      const response = await fetch(`/api/wemo/${host}/info`);
      const data = await response.json();
      setApiTestResult(data);
      setApiTestTimestamp(new Date().toLocaleString());
    } catch (err) {
      setApiTestResult({ error: err.message });
      setApiTestTimestamp(new Date().toLocaleString());
    }
    setApiTestLoading(false);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BoltIcon sx={{ fontSize: 40, mr: 2, color: '#76b900' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Belkin WeMo ({devices.length} devices)
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={discoverDevices}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && devices.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {devices.map((device, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={device.host}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getDeviceIcon(device)}
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                            {device.friendlyName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getDeviceTypeLabel(device)}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton 
                        size="small" 
                        onClick={() => showDeviceDetails(device.host)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <InfoIcon />
                      </IconButton>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        IP: {device.host}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Model: {device.modelName}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip 
                        label={device.binaryState ? 'ON' : 'OFF'} 
                        color={device.binaryState ? 'success' : 'default'}
                        variant={device.binaryState ? 'filled' : 'outlined'}
                        size="small"
                      />
                      <Chip 
                        label="Online" 
                        color="success" 
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </CardContent>

                  <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!device.binaryState}
                          onChange={() => togglePower(device.host, device.binaryState)}
                          color="primary"
                        />
                      }
                      label={device.binaryState ? 'Turn Off' : 'Turn On'}
                      sx={{ width: '100%', margin: 0 }}
                    />
                  </CardActions>
                </Card>
              </motion.div>
            </Grid>
          ))}

          {devices.length === 0 && !loading && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <BoltIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No WeMo devices found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Make sure your WeMo devices are connected to the same network and powered on.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={discoverDevices}
                  sx={{ mt: 2 }}
                  startIcon={<RefreshIcon />}
                >
                  Scan Again
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Device Details Dialog */}
      <Dialog 
        open={detailsDialog} 
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Device Details - {deviceDetails?.friendlyName}
        </DialogTitle>
        <DialogContent>
          {deviceDetails && (
            <>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ApiIcon /> API Response
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleTestApi(selectedDevice)}
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
            {apiTestResult && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1, maxHeight: 150, overflow: 'auto' }}>
                <pre style={{ margin: 0, fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(apiTestResult, null, 2)}
                </pre>
              </Box>
            )}
            <List>
              <ListItem>
                <ListItemIcon><PowerSettingsNewIcon /></ListItemIcon>
                <ListItemText 
                  primary="Status" 
                  secondary={deviceDetails.binaryState ? 'ON' : 'OFF'}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="IP Address" 
                  secondary={deviceDetails.host}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Model" 
                  secondary={deviceDetails.modelName}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Device Type" 
                  secondary={deviceDetails.deviceType}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Serial Number" 
                  secondary={deviceDetails.serialNumber}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Manufacturer" 
                  secondary={deviceDetails.manufacturer}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Last Updated" 
                  secondary={formatLastUpdate(deviceDetails.lastUpdate)}
                />
              </ListItem>
            </List>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default WemoPage;
