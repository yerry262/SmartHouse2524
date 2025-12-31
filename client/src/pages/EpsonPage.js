import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  Print as PrintIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import axios from 'axios';
import { motion } from 'framer-motion';

const EpsonPage = () => {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrinters = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/epson/discover');
      setPrinters(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching printers:', err);
      setError('Failed to load printers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  const handleOpenInterface = (ip) => {
    window.open(`http://${ip}`, '_blank');
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 10, pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
          <PrintIcon fontSize="large" />
          Epson Printers
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchPrinters}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : printers.length === 0 ? (
        <Alert severity="info">
          No Epson printers found on the network. Make sure they are powered on and connected.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {printers.map((printer) => (
            <Grid item xs={12} md={6} lg={4} key={printer.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card sx={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 4
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {printer.name || 'Epson Printer'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {printer.ip}
                        </Typography>
                      </Box>
                      <Chip
                        icon={printer.status === 'online' ? <CheckCircleIcon /> : <ErrorIcon />}
                        label={printer.status || 'Unknown'}
                        color={printer.status === 'online' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Device Information
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">MAC Address</Typography>
                          <Typography variant="body2">{printer.mac || 'Unknown'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Vendor</Typography>
                          <Typography variant="body2">{printer.vendor || 'Epson'}</Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        startIcon={<OpenInNewIcon />}
                        onClick={() => handleOpenInterface(printer.ip)}
                      >
                        Open Web Interface
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default EpsonPage;
