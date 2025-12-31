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
  OpenInNew as OpenInNewIcon,
  Api as ApiIcon
} from '@mui/icons-material';
import axios from 'axios';
import { motion } from 'framer-motion';

const EpsonPage = () => {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);

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

  const handleTestApi = async () => {
    setApiTestLoading(true);
    try {
      const response = await axios.get('/api/epson/discover');
      setApiTestResult(response.data);
      setApiTestTimestamp(new Date().toLocaleString());
    } catch (err) {
      setApiTestResult({ error: err.message });
      setApiTestTimestamp(new Date().toLocaleString());
    }
    setApiTestLoading(false);
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

      {/* API Test Section */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
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
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 2, borderRadius: 2, maxHeight: 200, overflow: 'auto' }}>
            {apiTestResult.error ? (
              <Alert severity="error">{apiTestResult.error}</Alert>
            ) : (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Printers Found:</strong> {Array.isArray(apiTestResult) ? apiTestResult.length : 0}
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
              Click "Test API" to fetch printer discovery data
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default EpsonPage;
