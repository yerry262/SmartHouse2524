import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  LinearProgress,
  Divider,
  Menu,
  MenuItem,
  Snackbar,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// Get all available camera stream options for a given camera
const getCameraStreamOptions = (camera) => {
  const ip = camera.ip || '';
  const port = camera.port || 80;
  
  // If camera has configured URLs, use those
  if (camera.capabilities?.mjpegStream) {
    return {
      configured: {
        label: 'Configured Stream',
        directUrl: camera.capabilities.mjpegStream,
        proxyUrl: `/api/cameras/${camera.id}/proxy-stream`,
        description: 'The configured stream URL for this camera'
      }
    };
  }
  
  // For cameras with IP, provide multiple options
  if (ip) {
    return {
      desktop: {
        label: 'Desktop (ActiveX)',
        directUrl: `http://${ip}:${port}/video/livesp.asp`,
        proxyUrl: `/api/cameras/proxy/${ip}/${port}/video/livesp.asp`,
        description: 'Best for Chrome/Edge on desktop'
      },
      mobile: {
        label: 'Mobile (HTML5)',
        directUrl: `http://${ip}:${port}/video/livemb.asp`,
        proxyUrl: `/api/cameras/proxy/${ip}/${port}/video/livemb.asp`,
        description: 'Works on iOS Safari and mobile'
      },
      mjpeg: {
        label: 'MJPEG Stream',
        directUrl: `http://${ip}:${port}/media/?action=stream`,
        proxyUrl: `/api/cameras/proxy/${ip}/${port}/media/?action=stream`,
        description: 'Universal MJPEG format'
      }
    };
  }
  
  return {};
};

// Camera Stream Component with live view
const CameraStream = ({ camera, onClose, fullscreen = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useProxy, setUseProxy] = useState(false);
  const [streamType, setStreamType] = useState('mjpeg'); // default to mjpeg for best compatibility

  const streamOptions = getCameraStreamOptions(camera);
  const selectedOption = streamOptions[streamType] || streamOptions.configured || Object.values(streamOptions)[0];
  
  const streamUrl = useProxy 
    ? (selectedOption?.proxyUrl || `/api/cameras/${camera.id}/proxy-stream`)
    : (selectedOption?.directUrl || camera.capabilities?.mjpegStream || camera.url);

  const handleError = () => {
    if (!useProxy) {
      setUseProxy(true);
      setError(null);
    } else {
      setError('Unable to load stream. Camera may be offline or require authentication.');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: fullscreen ? '100vh' : 'auto',
      background: '#000',
      borderRadius: fullscreen ? 0 : 2,
      overflow: 'hidden'
    }}>
      {/* Stream Type Selector */}
      {Object.keys(streamOptions).length > 1 && (
        <Box sx={{ 
          position: 'absolute', 
          top: 8, 
          left: 8, 
          zIndex: 10,
          display: 'flex',
          gap: 0.5,
          flexWrap: 'wrap'
        }}>
          {Object.entries(streamOptions).map(([key, option]) => (
            <Chip
              key={key}
              label={option.label}
              onClick={() => {
                setStreamType(key);
                setUseProxy(false);
                setError(null);
                setLoading(true);
              }}
              size="small"
              color={streamType === key ? 'primary' : 'default'}
              sx={{ 
                bgcolor: streamType === key ? 'primary.main' : 'rgba(0,0,0,0.7)',
                color: 'white',
                fontSize: '0.7rem'
              }}
            />
          ))}
        </Box>
      )}
      
      {loading && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <CircularProgress size={40} sx={{ color: 'white' }} />
          <Typography color="white" sx={{ mt: 1 }}>Loading stream...</Typography>
        </Box>
      )}
      
      {error && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          p: 2
        }}>
          <CameraAltIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
          <Typography color="error">{error}</Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }} 
            onClick={() => window.open(camera.capabilities?.mjpegStream || camera.url, '_blank')}
          >
            Open in Browser
          </Button>
        </Box>
      )}

      <img
        src={streamUrl}
        alt={camera.name}
        style={{
          width: '100%',
          height: fullscreen ? '100vh' : 'auto',
          objectFit: 'contain',
          display: error ? 'none' : 'block'
        }}
        onLoad={() => setLoading(false)}
        onError={handleError}
      />

      {onClose && (
        <IconButton
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            bgcolor: 'rgba(0,0,0,0.5)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
          }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      )}
    </Box>
  );
};

// Camera Card Component
const CameraCard = ({ camera, onDelete, onEdit, onTest, onRefresh, onViewStream, onSnapshot }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(camera.id);
      setTestResult(result);
    } catch (err) {
      setTestResult({ error: err.message });
    }
    setTesting(false);
  };

  const getStatusColor = () => {
    if (testResult?.streamWorking) return 'success';
    if (testResult?.error) return 'error';
    return 'default';
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <VideocamIcon sx={{ fontSize: 40, color: '#FF6B6B', mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {camera.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Chip 
                label={camera.protocol || 'HTTP'} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
              {camera.cameraType && camera.cameraType !== 'unknown' && (
                <Chip 
                  label={camera.cameraType} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
              {testResult && (
                <Chip 
                  label={testResult.streamWorking ? 'Online' : 'Offline'} 
                  size="small" 
                  color={getStatusColor()}
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Box>
          </Box>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Preview Area */}
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
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative',
            '&:hover .preview-overlay': { opacity: 1 }
          }}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? (
            <CameraStream camera={camera} onClose={() => setShowPreview(false)} />
          ) : (
            <>
              <CameraAltIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.3)' }} />
              <Box 
                className="preview-overlay"
                sx={{ 
                  position: 'absolute', 
                  inset: 0, 
                  bgcolor: 'rgba(0,0,0,0.5)', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s'
                }}
              >
                <PlayArrowIcon sx={{ fontSize: 50, color: 'white' }} />
              </Box>
            </>
          )}
        </Box>

        {/* Camera Info */}
        {camera.ip && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            📍 {camera.ip}:{camera.port || 80}
          </Typography>
        )}
        {camera.uid && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.75rem' }}>
            UID: {camera.uid}
          </Typography>
        )}

        {/* Test Result */}
        {testResult && (
          <Box sx={{ mb: 2 }}>
            {testResult.latency && (
              <Typography variant="body2" color="text.secondary">
                ⏱️ Latency: {testResult.latency}ms
              </Typography>
            )}
            {testResult.error && (
              <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                {testResult.error}
              </Alert>
            )}
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={() => onViewStream(camera)}
          >
            Stream
          </Button>
          
          {camera.capabilities?.snapshot && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<PhotoCameraIcon />}
              onClick={() => onSnapshot(camera)}
            >
              Snapshot
            </Button>
          )}
          
          <Button
            variant="outlined"
            size="small"
            startIcon={testing ? <CircularProgress size={16} /> : <NetworkCheckIcon />}
            onClick={handleTest}
            disabled={testing}
          >
            Test
          </Button>
        </Box>
      </CardContent>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => { onViewStream(camera); setAnchorEl(null); }}>
          <PlayArrowIcon sx={{ mr: 1 }} /> View Live Stream
        </MenuItem>
        {camera.capabilities?.snapshot && (
          <MenuItem onClick={() => { onSnapshot(camera); setAnchorEl(null); }}>
            <PhotoCameraIcon sx={{ mr: 1 }} /> Take Snapshot
          </MenuItem>
        )}
        {camera.capabilities?.settings && (
          <MenuItem onClick={() => { window.open(camera.capabilities.settings, '_blank'); setAnchorEl(null); }}>
            <SettingsIcon sx={{ mr: 1 }} /> Camera Settings
          </MenuItem>
        )}
        {camera.capabilities?.liveView && (
          <MenuItem onClick={() => { window.open(camera.capabilities.liveView, '_blank'); setAnchorEl(null); }}>
            <OpenInNewIcon sx={{ mr: 1 }} /> Web Interface
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => { onEdit(camera); setAnchorEl(null); }}>
          <EditIcon sx={{ mr: 1 }} /> Edit Camera
        </MenuItem>
        <MenuItem onClick={() => { onRefresh(camera.id); setAnchorEl(null); }}>
          <RefreshIcon sx={{ mr: 1 }} /> Refresh Capabilities
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onDelete(camera.id); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete Camera
        </MenuItem>
      </Menu>
    </Card>
  );
};

// Main Cameras Page
const CamerasPage = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add', 'edit', 'discover', 'probe'
  const [editingCamera, setEditingCamera] = useState(null);
  const [newCamera, setNewCamera] = useState({
    name: '',
    url: '',
    ip: '',
    port: 80,
    username: 'admin',
    password: '',
  });
  const [discovering, setDiscovering] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState(0);
  const [discoveryResult, setDiscoveryResult] = useState(null);
  const [probeResult, setProbeResult] = useState(null);
  const [probing, setProbing] = useState(false);
  const [streamDialog, setStreamDialog] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cameras');
      setCameras(response.data);
    } catch (error) {
      console.error('Error fetching cameras:', error);
      showSnackbar('Failed to load cameras', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddCamera = async () => {
    try {
      const payload = dialogMode === 'edit' && editingCamera
        ? { ...newCamera }
        : newCamera;

      if (dialogMode === 'edit' && editingCamera) {
        await axios.put(`/api/cameras/${editingCamera.id}`, payload);
        showSnackbar('Camera updated successfully');
      } else {
        await axios.post('/api/cameras', payload);
        showSnackbar('Camera added successfully');
      }
      
      setOpenDialog(false);
      setNewCamera({ name: '', url: '', ip: '', port: 80, username: 'admin', password: '' });
      setEditingCamera(null);
      fetchCameras();
    } catch (error) {
      console.error('Error saving camera:', error);
      showSnackbar('Failed to save camera', 'error');
    }
  };

  const handleDeleteCamera = async (id) => {
    if (!window.confirm('Are you sure you want to delete this camera?')) return;
    
    try {
      await axios.delete(`/api/cameras/${id}`);
      showSnackbar('Camera deleted');
      fetchCameras();
    } catch (error) {
      console.error('Error deleting camera:', error);
      showSnackbar('Failed to delete camera', 'error');
    }
  };

  const handleEditCamera = (camera) => {
    setEditingCamera(camera);
    setNewCamera({
      name: camera.name,
      url: camera.url,
      ip: camera.ip || '',
      port: camera.port || 80,
      username: camera.username || 'admin',
      password: camera.password || '',
    });
    setDialogMode('edit');
    setOpenDialog(true);
  };

  const handleTestCamera = async (id) => {
    const response = await axios.post(`/api/cameras/${id}/test`);
    return response.data;
  };

  const handleRefreshCamera = async (id) => {
    try {
      await axios.post(`/api/cameras/${id}/refresh`);
      showSnackbar('Camera capabilities refreshed');
      fetchCameras();
    } catch (error) {
      showSnackbar('Failed to refresh camera', 'error');
    }
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    setDiscoveryProgress(0);
    setDiscoveryResult(null);
    
    try {
      const response = await axios.post('/api/cameras/discover', {
        username: newCamera.username || 'admin',
        password: newCamera.password || '',
        startRange: 1,
        endRange: 255
      }, { timeout: 180000 }); // 3 minute timeout for full network scan
      
      setDiscoveryResult(response.data);
      if (response.data.new > 0) {
        showSnackbar(`Found ${response.data.new} new camera(s)!`);
        fetchCameras();
      } else if (response.data.found > 0) {
        showSnackbar(`Found ${response.data.found} camera(s), but all already known`);
      } else {
        showSnackbar('No cameras found on the network');
      }
    } catch (error) {
      console.error('Discovery error:', error);
      if (error.code === 'ECONNABORTED') {
        showSnackbar('Discovery timed out - try a smaller IP range', 'warning');
      } else {
        showSnackbar('Camera discovery failed', 'error');
      }
    } finally {
      setDiscovering(false);
    }
  };

  const handleProbe = async () => {
    if (!newCamera.ip) {
      showSnackbar('Please enter an IP address', 'error');
      return;
    }
    
    setProbing(true);
    setProbeResult(null);
    
    try {
      const response = await axios.post('/api/cameras/probe', {
        ip: newCamera.ip,
        port: newCamera.port || 80,
        username: newCamera.username || 'admin',
        password: newCamera.password || ''
      });
      
      setProbeResult(response.data);
      
      if (response.data.isCamera) {
        showSnackbar('Camera detected!');
        // Auto-fill URL if found
        if (response.data.capabilities?.mjpegStream) {
          setNewCamera(prev => ({
            ...prev,
            url: response.data.capabilities.mjpegStream,
            name: prev.name || `IP Camera (${newCamera.ip})`
          }));
        }
      } else {
        showSnackbar('No camera found at this address', 'warning');
      }
    } catch (error) {
      showSnackbar('Probe failed', 'error');
    } finally {
      setProbing(false);
    }
  };

  const handleViewStream = (camera) => {
    setStreamDialog(camera);
  };

  const handleSnapshot = (camera) => {
    if (camera.capabilities?.snapshot) {
      window.open(camera.capabilities.snapshot, '_blank');
    }
  };

  const openAddDialog = () => {
    setDialogMode('add');
    setEditingCamera(null);
    setNewCamera({ name: '', url: '', ip: '', port: 80, username: 'admin', password: '' });
    setProbeResult(null);
    setOpenDialog(true);
  };

  const openDiscoverDialog = () => {
    setDialogMode('discover');
    setDiscoveryResult(null);
    setNewCamera({ name: '', url: '', ip: '', port: 80, username: 'admin', password: '' });
    setOpenDialog(true);
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <div>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Security Cameras
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor and manage your IP cameras
            </Typography>
          </div>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={openDiscoverDialog}
            >
              Discover
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openAddDialog}
            >
              Add Camera
            </Button>
          </Box>
        </Box>

        {/* Info Card */}
        <Card sx={{ mb: 3, background: 'rgba(102, 126, 234, 0.1)' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              📹 <strong>Tip:</strong> Use "Discover" to automatically find IP cameras on your network. 
              Supported: MJPEG streams, Hi3510/generic cameras, Foscam, Axis, Hikvision, Dahua, and more.
              For direct viewing, cameras at <code>http://IP/media/?action=stream</code> work best.
            </Typography>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : cameras.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <VideocamIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No cameras configured
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add a camera manually or discover cameras on your network
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button variant="outlined" startIcon={<SearchIcon />} onClick={openDiscoverDialog}>
                  Discover Cameras
                </Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
                  Add Camera
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          /* Camera Grid */
          <Grid container spacing={3}>
            <AnimatePresence>
              {cameras.map((camera, index) => (
                <Grid item xs={12} md={6} lg={4} key={camera.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CameraCard
                      camera={camera}
                      onDelete={handleDeleteCamera}
                      onEdit={handleEditCamera}
                      onTest={handleTestCamera}
                      onRefresh={handleRefreshCamera}
                      onViewStream={handleViewStream}
                      onSnapshot={handleSnapshot}
                    />
                  </motion.div>
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        )}

        {/* Add/Edit/Discover Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            {dialogMode === 'discover' ? 'Discover Cameras' : 
             dialogMode === 'edit' ? 'Edit Camera' : 'Add New Camera'}
          </DialogTitle>
          <DialogContent>
            {dialogMode === 'discover' ? (
              /* Discovery Mode */
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  This will scan your local network for IP cameras. Enter credentials if your cameras require authentication.
                </Alert>
                
                <TextField
                  label="Username"
                  fullWidth
                  margin="normal"
                  value={newCamera.username}
                  onChange={(e) => setNewCamera({ ...newCamera, username: e.target.value })}
                  placeholder="admin"
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={newCamera.password}
                  onChange={(e) => setNewCamera({ ...newCamera, password: e.target.value })}
                  placeholder="(leave empty if none)"
                />

                {discovering && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Scanning network for cameras...
                    </Typography>
                  </Box>
                )}

                {discoveryResult && (
                  <Alert severity={discoveryResult.new > 0 ? 'success' : 'info'} sx={{ mt: 2 }}>
                    Scanned: {discoveryResult.scanned}<br />
                    Found: {discoveryResult.found} camera(s), {discoveryResult.new} new
                  </Alert>
                )}
              </Box>
            ) : (
              /* Add/Edit Mode */
              <Box>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                  <Tab label="Manual" />
                  <Tab label="Probe IP" />
                </Tabs>

                {tabValue === 0 ? (
                  /* Manual Entry */
                  <>
                    <TextField
                      label="Camera Name"
                      fullWidth
                      margin="normal"
                      value={newCamera.name}
                      onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                      placeholder="Living Room Camera"
                    />
                    <TextField
                      label="Stream URL"
                      fullWidth
                      margin="normal"
                      value={newCamera.url}
                      onChange={(e) => setNewCamera({ ...newCamera, url: e.target.value })}
                      placeholder="http://192.168.1.100/media/?action=stream"
                      helperText="MJPEG stream URL (e.g., /media/?action=stream for Hi3510 cameras)"
                    />
                    <TextField
                      label="Username"
                      fullWidth
                      margin="normal"
                      value={newCamera.username}
                      onChange={(e) => setNewCamera({ ...newCamera, username: e.target.value })}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      fullWidth
                      margin="normal"
                      value={newCamera.password}
                      onChange={(e) => setNewCamera({ ...newCamera, password: e.target.value })}
                    />
                  </>
                ) : (
                  /* Probe Mode */
                  <>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Enter an IP address to probe for camera capabilities
                    </Alert>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        label="IP Address"
                        value={newCamera.ip}
                        onChange={(e) => setNewCamera({ ...newCamera, ip: e.target.value })}
                        placeholder="192.168.1.100"
                        sx={{ flexGrow: 1 }}
                      />
                      <TextField
                        label="Port"
                        type="number"
                        value={newCamera.port}
                        onChange={(e) => setNewCamera({ ...newCamera, port: parseInt(e.target.value) || 80 })}
                        sx={{ width: 100 }}
                      />
                    </Box>
                    <TextField
                      label="Username"
                      fullWidth
                      margin="normal"
                      value={newCamera.username}
                      onChange={(e) => setNewCamera({ ...newCamera, username: e.target.value })}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      fullWidth
                      margin="normal"
                      value={newCamera.password}
                      onChange={(e) => setNewCamera({ ...newCamera, password: e.target.value })}
                    />
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={handleProbe}
                      disabled={probing || !newCamera.ip}
                      startIcon={probing ? <CircularProgress size={16} /> : <SearchIcon />}
                    >
                      {probing ? 'Probing...' : 'Probe Camera'}
                    </Button>

                    {probeResult && (
                      <Card sx={{ mt: 2, bgcolor: probeResult.isCamera ? 'success.dark' : 'grey.800' }}>
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            {probeResult.isCamera ? '✅ Camera Detected!' : '❌ No Camera Found'}
                          </Typography>
                          {probeResult.isCamera && (
                            <>
                              <Typography variant="body2">Type: {probeResult.cameraType}</Typography>
                              {probeResult.capabilities?.mjpegStream && (
                                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                  Stream: {probeResult.capabilities.mjpegStream}
                                </Typography>
                              )}
                              {probeResult.uid && (
                                <Typography variant="body2">UID: {probeResult.uid}</Typography>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {probeResult?.isCamera && (
                      <TextField
                        label="Camera Name"
                        fullWidth
                        margin="normal"
                        value={newCamera.name}
                        onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                        placeholder="Living Room Camera"
                      />
                    )}
                  </>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            {dialogMode === 'discover' ? (
              <Button 
                onClick={handleDiscover} 
                variant="contained" 
                disabled={discovering}
                startIcon={discovering ? <CircularProgress size={16} /> : <SearchIcon />}
              >
                {discovering ? 'Scanning...' : 'Start Discovery'}
              </Button>
            ) : (
              <Button 
                onClick={handleAddCamera} 
                variant="contained"
                disabled={!newCamera.url && !probeResult?.isCamera}
              >
                {dialogMode === 'edit' ? 'Save Changes' : 'Add Camera'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Full Stream Dialog */}
        <Dialog
          open={Boolean(streamDialog)}
          onClose={() => setStreamDialog(null)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { bgcolor: 'black', maxHeight: '90vh' }
          }}
        >
          {streamDialog && (
            <>
              <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {streamDialog.name}
                <Box>
                  {streamDialog.capabilities?.settings && (
                    <Tooltip title="Camera Settings">
                      <IconButton 
                        sx={{ color: 'white' }} 
                        onClick={() => window.open(streamDialog.capabilities.settings, '_blank')}
                      >
                        <SettingsIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {streamDialog.capabilities?.liveView && (
                    <Tooltip title="Web Interface">
                      <IconButton 
                        sx={{ color: 'white' }} 
                        onClick={() => window.open(streamDialog.capabilities.liveView, '_blank')}
                      >
                        <OpenInNewIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Open Stream Directly">
                    <IconButton 
                      sx={{ color: 'white' }} 
                      onClick={() => window.open(streamDialog.capabilities?.mjpegStream || streamDialog.url, '_blank')}
                    >
                      <LinkIcon />
                    </IconButton>
                  </Tooltip>
                  <IconButton sx={{ color: 'white' }} onClick={() => setStreamDialog(null)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ p: 0 }}>
                <CameraStream camera={streamDialog} fullscreen />
              </DialogContent>
            </>
          )}
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
};

export default CamerasPage;
