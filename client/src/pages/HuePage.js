import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  Slider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Box
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AddIcon from '@mui/icons-material/Add';
import ApiIcon from '@mui/icons-material/Api';
import { motion } from 'framer-motion';

const HuePage = () => {
  const [bridges, setBridges] = useState([]);
  const [selectedBridge, setSelectedBridge] = useState(null);
  const [lights, setLights] = useState([]);
  const [groups, setGroups] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authDialog, setAuthDialog] = useState(false);
  const [authIp, setAuthIp] = useState('');
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);

  useEffect(() => {
    discoverBridges();
  }, []);

  useEffect(() => {
    if (selectedBridge) {
      loadLights();
      loadGroups();
      loadScenes();
    }
  }, [selectedBridge]);

  const discoverBridges = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/hue/discover');
      const data = await response.json();
      
      if (data.installed === false) {
        setError(data.message);
      } else if (data.bridges) {
        setBridges(data.bridges);
        if (data.bridges.length > 0) {
          setSelectedBridge(data.bridges[0].ipaddress);
        }
      }
    } catch (err) {
      setError('Failed to discover Hue bridges: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAuthDialog = (ip) => {
    setAuthIp(ip);
    setAuthDialog(true);
  };

  const handleTestApi = async () => {
    setApiTestLoading(true);
    try {
      const endpoint = selectedBridge ? `/api/hue/lights` : '/api/hue/discover';
      const response = await fetch(endpoint);
      const data = await response.json();
      setApiTestResult(data);
      setApiTestTimestamp(new Date().toLocaleString());
    } catch (err) {
      setApiTestResult({ error: err.message });
      setApiTestTimestamp(new Date().toLocaleString());
    }
    setApiTestLoading(false);
  };

  const authenticateBridge = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/hue/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress: authIp })
      });
      const data = await response.json();
      
      if (data.error) {
        setError(data.message || data.error);
      } else {
        alert(`Success! Username: ${data.username}\nSave this for future use.`);
        setAuthDialog(false);
        setSelectedBridge(authIp);
      }
    } catch (err) {
      setError('Failed to authenticate: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const connectWithUsername = async (ip, username) => {
    try {
      const response = await fetch('/api/hue/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress: ip, username: username })
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedBridge(ip);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect: ' + err.message);
    }
  };

  const loadLights = async () => {
    if (!selectedBridge) return;
    
    try {
      const response = await fetch(`/api/hue/${selectedBridge}/lights`);
      const data = await response.json();
      
      if (data.lights) {
        setLights(data.lights);
      }
    } catch (err) {
      console.error('Failed to load lights:', err);
    }
  };

  const loadGroups = async () => {
    if (!selectedBridge) return;
    
    try {
      const response = await fetch(`/api/hue/${selectedBridge}/groups`);
      const data = await response.json();
      
      if (data.groups) {
        setGroups(data.groups);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  };

  const loadScenes = async () => {
    if (!selectedBridge) return;
    
    try {
      const response = await fetch(`/api/hue/${selectedBridge}/scenes`);
      const data = await response.json();
      
      if (data.scenes) {
        setScenes(data.scenes);
      }
    } catch (err) {
      console.error('Failed to load scenes:', err);
    }
  };

  const controlLight = async (lightId, state) => {
    try {
      const response = await fetch(`/api/hue/${selectedBridge}/lights/${lightId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      const data = await response.json();
      
      if (data.success) {
        loadLights();
      }
    } catch (err) {
      console.error('Failed to control light:', err);
    }
  };

  const activateScene = async (sceneId) => {
    try {
      const response = await fetch(`/api/hue/${selectedBridge}/scenes/${sceneId}/activate`, {
        method: 'PUT'
      });
      const data = await response.json();
      
      if (data.success) {
        loadLights();
      }
    } catch (err) {
      console.error('Failed to activate scene:', err);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <LightbulbIcon sx={{ fontSize: 40, color: '#FFB300' }} />
        Philips Hue
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Bridges Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Hue Bridges</Typography>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                onClick={discoverBridges}
                disabled={loading}
              >
                Discover Bridges
              </Button>
            </Box>

            <Grid container spacing={2}>
              {bridges.map((bridge) => (
                <Grid item xs={12} md={6} lg={4} key={bridge.ipaddress}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{bridge.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        IP: {bridge.ipaddress}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Model: {bridge.modelid}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => openAuthDialog(bridge.ipaddress)}>
                        Authenticate
                      </Button>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => setSelectedBridge(bridge.ipaddress)}
                      >
                        {selectedBridge === bridge.ipaddress ? 'Selected' : 'Select'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Lights Section */}
        {selectedBridge && lights.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Lights
              </Typography>
              <Grid container spacing={2}>
                {lights.map((light) => (
                  <Grid item xs={12} md={6} lg={4} key={light.id}>
                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Card sx={{ bgcolor: light.state.on ? '#FFF9E6' : 'inherit' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">{light.name}</Typography>
                            <LightbulbIcon sx={{ color: light.state.on ? '#FFB300' : '#ccc' }} />
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            {light.type} • {light.modelid}
                          </Typography>
                          
                          <FormControlLabel
                            control={
                              <Switch
                                checked={light.state.on}
                                onChange={(e) => controlLight(light.id, { on: e.target.checked })}
                              />
                            }
                            label={light.state.on ? 'On' : 'Off'}
                          />

                          {light.state.on && (
                            <>
                              <Typography variant="caption" gutterBottom>
                                Brightness: {Math.round((light.state.brightness / 254) * 100)}%
                              </Typography>
                              <Slider
                                value={light.state.brightness || 0}
                                min={0}
                                max={254}
                                onChange={(e, value) => controlLight(light.id, { brightness: value })}
                                sx={{ mt: 1 }}
                              />
                            </>
                          )}
                          
                          <Chip
                            size="small"
                            label={light.state.reachable ? 'Online' : 'Offline'}
                            color={light.state.reachable ? 'success' : 'error'}
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Scenes Section */}
        {selectedBridge && scenes.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Scenes
              </Typography>
              <Grid container spacing={2}>
                {scenes.map((scene) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={scene.id}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => activateScene(scene.id)}
                      sx={{ height: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                    >
                      {scene.name}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}
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
              <pre style={{ margin: 0, fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(apiTestResult, null, 2)}
              </pre>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Click "Test API" to fetch Hue {selectedBridge ? 'lights' : 'bridge discovery'} data
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Authentication Dialog */}
      <Dialog open={authDialog} onClose={() => setAuthDialog(false)}>
        <DialogTitle>Authenticate with Hue Bridge</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Press the link button on your Hue Bridge, then click "Authenticate" within 30 seconds.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Bridge IP: {authIp}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuthDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={authenticateBridge}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            Authenticate
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HuePage;
