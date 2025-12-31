import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import VideocamIcon from '@mui/icons-material/Videocam';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from 'axios';
import { motion } from 'framer-motion';

const RingPage = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/ring/devices');
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching Ring devices:', error);
    }
    setLoading(false);
  };

  const toggleMotionDetection = async (deviceId, enabled) => {
    try {
      await axios.post(`/api/ring/camera/${deviceId}/motion`, { enabled });
      fetchDevices();
    } catch (error) {
      console.error('Error toggling motion detection:', error);
    }
  };

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
              Ring Doorbell & Cameras
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor and control your Ring devices
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchDevices}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        <Card sx={{ mb: 3, background: 'rgba(255, 193, 7, 0.1)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              🔑 Credentials Required
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure your Ring email and password in the .env file. You may need to handle 2FA authentication.
            </Typography>
          </CardContent>
        </Card>

        {devices.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary">
                No Ring devices found. Check your credentials in the .env file.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {devices.map((device) => (
              <Grid item xs={12} md={6} key={device.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <VideocamIcon sx={{ fontSize: 40, color: '#00B5E2', mr: 2 }} />
                      <div>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {device.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {device.type} • {device.location}
                        </Typography>
                      </div>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {device.battery && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Battery Level
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {device.battery}%
                          </Typography>
                        </Box>
                      )}

                      <FormControlLabel
                        control={
                          <Switch
                            defaultChecked
                            onChange={(e) => toggleMotionDetection(device.id, e.target.checked)}
                          />
                        }
                        label="Motion Detection"
                      />

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<VideocamIcon />}
                          fullWidth
                          onClick={() => {/* View stream */}}
                        >
                          View Live
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<NotificationsIcon />}
                          fullWidth
                          onClick={() => {/* View events */}}
                        >
                          Events
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </motion.div>
    </Container>
  );
};

export default RingPage;
