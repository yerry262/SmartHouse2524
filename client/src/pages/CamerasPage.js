import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import axios from 'axios';
import { motion } from 'framer-motion';

const CamerasPage = () => {
  const [cameras, setCameras] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newCamera, setNewCamera] = useState({
    name: '',
    url: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      const response = await axios.get('/api/cameras');
      setCameras(response.data);
    } catch (error) {
      console.error('Error fetching cameras:', error);
    }
  };

  const handleAddCamera = async () => {
    try {
      await axios.post('/api/cameras', newCamera);
      setOpenDialog(false);
      setNewCamera({ name: '', url: '', username: '', password: '' });
      fetchCameras();
    } catch (error) {
      console.error('Error adding camera:', error);
    }
  };

  const handleDeleteCamera = async (id) => {
    try {
      await axios.delete(`/api/cameras/${id}`);
      fetchCameras();
    } catch (error) {
      console.error('Error deleting camera:', error);
    }
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
              Security Cameras
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor your camera feeds
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add Camera
          </Button>
        </Box>

        <Card sx={{ mb: 3, background: 'rgba(102, 126, 234, 0.1)' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              📹 Cameras support RTSP and HTTP streams. Configure camera URLs in the .env file or add them manually.
            </Typography>
          </CardContent>
        </Card>

        {cameras.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <VideocamIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No cameras configured. Click "Add Camera" to get started.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {cameras.map((camera) => (
              <Grid item xs={12} md={6} lg={4} key={camera.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <VideocamIcon sx={{ fontSize: 40, color: '#FF6B6B', mr: 2 }} />
                      <div style={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {camera.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {camera.protocol}
                        </Typography>
                      </div>
                    </Box>

                    {/* Placeholder for video stream */}
                    <Box
                      sx={{
                        width: '100%',
                        height: 180,
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      <CameraAltIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.3)' }} />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => window.open(camera.url, '_blank')}
                      >
                        View Stream
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteCamera(camera.id)}
                      >
                        <DeleteIcon />
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Add Camera Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Camera</DialogTitle>
          <DialogContent>
            <TextField
              label="Camera Name"
              fullWidth
              margin="normal"
              value={newCamera.name}
              onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
            />
            <TextField
              label="Stream URL (RTSP/HTTP)"
              fullWidth
              margin="normal"
              value={newCamera.url}
              onChange={(e) => setNewCamera({ ...newCamera, url: e.target.value })}
              placeholder="rtsp://192.168.1.100:554/stream1"
            />
            <TextField
              label="Username (optional)"
              fullWidth
              margin="normal"
              value={newCamera.username}
              onChange={(e) => setNewCamera({ ...newCamera, username: e.target.value })}
            />
            <TextField
              label="Password (optional)"
              type="password"
              fullWidth
              margin="normal"
              value={newCamera.password}
              onChange={(e) => setNewCamera({ ...newCamera, password: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCamera} variant="contained">
              Add Camera
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default CamerasPage;
