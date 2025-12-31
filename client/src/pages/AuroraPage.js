import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  WbSunny,
  Add,
  Refresh,
  PowerSettingsNew,
  Delete,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';

const AuroraPage = () => {
  const [inverters, setInverters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newInverter, setNewInverter] = useState({
    name: '',
    ip: '',
    port: '502',
    serialNumber: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  const fetchInverters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/aurora/inverters');
      setInverters(response.data.inverters || []);
    } catch (error) {
      showMessage('Failed to fetch inverters', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInverters();
  }, [fetchInverters]);

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const addInverter = async () => {
    if (!newInverter.ip) {
      showMessage('IP address is required', 'error');
      return;
    }

    try {
      await axios.post('/api/aurora/add-inverter', newInverter);
      showMessage('Inverter added successfully', 'success');
      setAddDialogOpen(false);
      setNewInverter({ name: '', ip: '', port: '502', serialNumber: '' });
      fetchInverters();
    } catch (error) {
      showMessage('Failed to add inverter', 'error');
    }
  };

  const checkStatus = async (ip) => {
    try {
      const response = await axios.get(`/api/aurora/inverters/${ip}/status`);
      showMessage(
        response.data.online ? 'Inverter is online' : 'Inverter is offline',
        response.data.online ? 'success' : 'warning'
      );
    } catch (error) {
      showMessage('Failed to check status', 'error');
    }
  };

  const deleteInverter = async (id) => {
    try {
      await axios.delete(`/api/aurora/inverters/${id}`);
      showMessage('Inverter removed', 'success');
      fetchInverters();
    } catch (error) {
      showMessage('Failed to remove inverter', 'error');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <WbSunny sx={{ fontSize: 40, color: '#FFB300' }} />
            <Box>
              <Typography variant="h3" component="h1">
                Aurora Solar Inverters
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Power-One/ABB Aurora Solar Panel Monitoring
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchInverters}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddDialogOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #FFB300 0%, #FF6F00 100%)',
              }}
            >
              Add Inverter
            </Button>
          </Box>
        </Box>

        {message && (
          <Alert severity={messageType} sx={{ mb: 3 }} onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}

        {/* Info Card */}
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.1) 0%, rgba(255, 111, 0, 0.1) 100%)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <WbSunny /> Getting Started with Aurora Inverters
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Aurora inverters by Power-One (now ABB) require special setup:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  <strong>1. Find Your Inverter IP</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check the inverter display or your router's DHCP table
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  <strong>2. Enable Web Interface</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Most Aurora inverters have a web interface on port 80
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  <strong>3. Modbus/Aurora Protocol</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  For detailed data, use Aurora Communicator software
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <LinearProgress sx={{ width: '50%' }} />
          </Box>
        ) : inverters.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <WbSunny sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Aurora inverters configured
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Click "Add Inverter" to start monitoring your solar panels
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {inverters.map((inverter) => (
              <Grid item xs={12} md={6} key={inverter.id}>
                <InverterCard
                  inverter={inverter}
                  onCheckStatus={checkStatus}
                  onDelete={deleteInverter}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Add Inverter Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Aurora Inverter</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Inverter Name"
              fullWidth
              value={newInverter.name}
              onChange={(e) => setNewInverter({ ...newInverter, name: e.target.value })}
              placeholder="e.g., Rooftop Inverter"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="IP Address"
              fullWidth
              required
              value={newInverter.ip}
              onChange={(e) => setNewInverter({ ...newInverter, ip: e.target.value })}
              placeholder="192.168.1.100"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Port"
              fullWidth
              value={newInverter.port}
              onChange={(e) => setNewInverter({ ...newInverter, port: e.target.value })}
              placeholder="502 (Modbus TCP)"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Serial Number (Optional)"
              fullWidth
              value={newInverter.serialNumber}
              onChange={(e) => setNewInverter({ ...newInverter, serialNumber: e.target.value })}
              placeholder="Serial number from inverter label"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={addInverter}>
              Add Inverter
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

const InverterCard = ({ inverter, onCheckStatus, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FFB300 0%, #FF6F00 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <WbSunny sx={{ color: '#fff', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h6">{inverter.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {inverter.ip}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={inverter.type}
              size="small"
              sx={{
                background: 'rgba(255, 179, 0, 0.1)',
                color: '#FFB300',
                fontWeight: 600,
              }}
            />
          </Box>

          {/* Placeholder Stats */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', py: 1, bgcolor: 'rgba(255, 179, 0, 0.05)', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ color: '#FFB300', fontWeight: 700 }}>
                  -- kW
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Current Power
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', py: 1, bgcolor: 'rgba(76, 175, 80, 0.05)', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ color: '#4CAF50', fontWeight: 700 }}>
                  -- kWh
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Today's Energy
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="caption">
              Configure Modbus TCP or Aurora protocol for live data monitoring
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PowerSettingsNew />}
              onClick={() => onCheckStatus(inverter.ip)}
              fullWidth
            >
              Check Status
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<Delete />}
              onClick={() => onDelete(inverter.id)}
            >
              Remove
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AuroraPage;
