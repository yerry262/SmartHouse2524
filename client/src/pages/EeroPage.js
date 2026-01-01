import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  LinearProgress,
  CircularProgress,
  Paper,
  Alert
} from '@mui/material';
import RouterIcon from '@mui/icons-material/Router';
import DevicesIcon from '@mui/icons-material/Devices';
import SpeedIcon from '@mui/icons-material/Speed';
import RefreshIcon from '@mui/icons-material/Refresh';
import ApiIcon from '@mui/icons-material/Api';
import axios from 'axios';
import { motion } from 'framer-motion';

const EeroPage = () => {
  const [networkStatus, setNetworkStatus] = useState(null);
  const [devices, setDevices] = useState([]);
  const [clients, setClients] = useState([]);
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);

  useEffect(() => {
    fetchNetworkStatus();
    fetchDevices();
    fetchClients();
  }, []);

  const fetchNetworkStatus = async () => {
    try {
      const response = await axios.get('/api/eero/network');
      setNetworkStatus(response.data);
    } catch (error) {
      console.error('Error fetching network status:', error);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await axios.get('/api/eero');
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error('Error fetching Eero devices:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/eero/clients');
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleRefresh = () => {
    fetchNetworkStatus();
    fetchDevices();
    fetchClients();
  };

  const handleTestApi = async () => {
    setApiTestLoading(true);
    try {
      const response = await axios.get('/api/eero/network');
      setApiTestResult(response.data);
      setApiTestTimestamp(new Date().toLocaleString());
    } catch (err) {
      setApiTestResult({ error: err.message || 'API request failed' });
      setApiTestTimestamp(new Date().toLocaleString());
    }
    setApiTestLoading(false);
  };

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
              Eero Network
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor your mesh Wi-Fi system
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>

        <Card sx={{ mb: 3, background: 'rgba(255, 193, 7, 0.1)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              🔑 API Access Required
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Eero doesn't have an official public API. This requires using community libraries or reverse-engineered methods.
              Configure your Eero credentials in the .env file.
            </Typography>
          </CardContent>
        </Card>

        {/* Network Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <RouterIcon sx={{ fontSize: 40, color: '#00B5AD', mr: 2 }} />
                  <div>
                    <Typography variant="body2" color="text.secondary">
                      Network Status
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {networkStatus?.status || 'Unknown'}
                    </Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DevicesIcon sx={{ fontSize: 40, color: '#667eea', mr: 2 }} />
                  <div>
                    <Typography variant="body2" color="text.secondary">
                      Connected Devices
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {networkStatus?.connected_devices || 0}
                    </Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SpeedIcon sx={{ fontSize: 40, color: '#00D1B2', mr: 2 }} />
                  <div>
                    <Typography variant="body2" color="text.secondary">
                      Internet Speed
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {networkStatus?.speed_mbps || 0} Mbps
                    </Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Eero Devices */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Eero Devices
            </Typography>
            {devices.length === 0 ? (
              <Typography color="text.secondary">
                No Eero devices found. Configure API access in .env file.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {devices.map((device, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box
                      sx={{
                        p: 2,
                        background: 'rgba(102, 126, 234, 0.1)',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {device.name || `Eero ${index + 1}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {device.location || 'Unknown location'}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Connected Clients */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Connected Clients
            </Typography>
            {clients.length === 0 ? (
              <Typography color="text.secondary">
                No client information available. Configure API access in .env file.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {clients.map((client, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {client.name || 'Unknown Device'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {client.mac || 'N/A'}
                      </Typography>
                    </div>
                    <Typography variant="body2">
                      {client.ip || 'N/A'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

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
                <pre style={{ margin: 0, fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(apiTestResult, null, 2)}
                </pre>
              )}
            </Box>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Click "Test API" to fetch Eero network data
              </Typography>
            </Box>
          )}
        </Paper>
      </motion.div>
    </Container>
  );
};

export default EeroPage;
