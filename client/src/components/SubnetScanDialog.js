import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Grid,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import axios from 'axios';

const SubnetScanDialog = ({ open, onClose, onDevicesFound }) => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [subnet, setSubnet] = useState('192.168.1');
  const [startIP, setStartIP] = useState('1');
  const [endIP, setEndIP] = useState('254');
  const [results, setResults] = useState([]);

  const handleScan = async () => {
    setScanning(true);
    setProgress(0);
    setFoundCount(0);
    setResults([]);

    try {
      // Start the scan
      await axios.post('/api/devices/scan-subnet', {
        subnet,
        startIP: parseInt(startIP),
        endIP: parseInt(endIP),
      });

      // Listen for WebSocket updates
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname;
      const wsPort = process.env.NODE_ENV === 'development' ? '5000' : window.location.port;
      const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'scan_progress') {
          setProgress(data.progress);
          setFoundCount(data.foundCount);
        } else if (data.type === 'scan_complete') {
          setResults(data.devices);
          setScanning(false);
          ws.close();
          if (onDevicesFound) {
            onDevicesFound(data.devices);
          }
        }
      };

      ws.onerror = () => {
        setScanning(false);
      };
    } catch (error) {
      console.error('Scan error:', error);
      setScanning(false);
    }
  };

  const handleClose = () => {
    if (!scanning) {
      onClose();
      setProgress(0);
      setFoundCount(0);
      setResults([]);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NetworkCheckIcon />
          <Typography variant="h6">Network Subnet Scanner</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Scans your network subnet to discover devices by checking their IP addresses, 
          open ports, and hostnames. Similar to Angry IP Scanner.
        </Alert>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Subnet (first 3 octets)"
              fullWidth
              value={subnet}
              onChange={(e) => setSubnet(e.target.value)}
              placeholder="192.168.1"
              disabled={scanning}
              helperText="Example: 192.168.1 or 10.0.0"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="Start IP"
              fullWidth
              type="number"
              value={startIP}
              onChange={(e) => setStartIP(e.target.value)}
              disabled={scanning}
              inputProps={{ min: 1, max: 254 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="End IP"
              fullWidth
              type="number"
              value={endIP}
              onChange={(e) => setEndIP(e.target.value)}
              disabled={scanning}
              inputProps={{ min: 2, max: 255 }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Will scan: {subnet}.{startIP} to {subnet}.{endIP} ({parseInt(endIP) - parseInt(startIP) + 1} addresses)
          </Typography>
        </Box>

        {scanning && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                Scanning... {progress}%
              </Typography>
              <Typography variant="body2" color="primary">
                Found: {foundCount} devices
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}

        {results.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Discovered Devices ({results.length})
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {results.map((device) => (
                <Box
                  key={device.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: 2,
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {device.name}
                    </Typography>
                    <Chip
                      label={device.type}
                      size="small"
                      color={device.confidence > 70 ? 'success' : device.confidence > 40 ? 'warning' : 'default'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    IP: {device.ip} {device.mac ? `• MAC: ${device.mac}` : ''}
                  </Typography>
                  {device.hostname && (
                    <Typography variant="body2" color="text.secondary">
                      Hostname: {device.hostname}
                    </Typography>
                  )}
                  {device.openPorts && device.openPorts.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {device.openPorts.slice(0, 5).map((port) => (
                        <Chip
                          key={port.port}
                          label={`${port.port}: ${port.service}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {device.openPorts.length > 5 && (
                        <Chip
                          label={`+${device.openPorts.length - 5} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={scanning}>
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={handleScan}
          disabled={scanning}
        >
          {scanning ? 'Scanning...' : 'Start Scan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubnetScanDialog;
