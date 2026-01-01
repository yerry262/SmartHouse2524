import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  LightbulbOutlined,
  PowerSettingsNew,
  MusicNote,
  Tv,
  Save,
  Add,
  ExpandMore,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';

const QuickActions = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [scenes, setScenes] = useState([
    { id: 1, name: 'Good Morning', icon: '🌅', enabled: true },
    { id: 2, name: 'Movie Night', icon: '🎬', enabled: true },
    { id: 3, name: 'Bedtime', icon: '🌙', enabled: true },
    { id: 4, name: 'Party Mode', icon: '🎉', enabled: true },
  ]);
  const [message, setMessage] = useState('');

  const quickActions = [
    {
      title: 'All Lights Off',
      icon: <PowerSettingsNew />,
      color: '#f5576c',
      action: () => handleQuickAction('lights_off'),
    },
    {
      title: 'All Lights On',
      icon: <LightbulbOutlined />,
      color: '#f093fb',
      action: () => handleQuickAction('lights_on'),
    },
    {
      title: 'Stop Music',
      icon: <MusicNote />,
      color: '#4facfe',
      action: () => handleQuickAction('music_stop'),
    },
    {
      title: 'TVs Off',
      icon: <Tv />,
      color: '#43e97b',
      action: () => handleQuickAction('tvs_off'),
    },
  ];

  const handleQuickAction = async (action) => {
    try {
      await axios.post('/api/devices/quick-action', { action });
      setMessage(`Action "${action}" executed successfully`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Failed to execute action: ${error.message}`);
    }
  };

  const handleSceneClick = async (scene) => {
    try {
      await axios.post('/api/devices/scene', { sceneId: scene.id, name: scene.name });
      setMessage(`Scene "${scene.name}" activated`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Failed to activate scene: ${error.message}`);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      {message && (
        <Alert severity={message.includes('Failed') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Accordion 
            defaultExpanded={false}
            sx={{ 
              background: 'rgba(25, 28, 38, 0.95)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px !important',
              '&:before': { display: 'none' },
              color: '#fff'
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: '#fff' }} />}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Quick Actions
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={6} sm={6} key={index}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={action.icon}
                        onClick={action.action}
                        sx={{
                          py: 2,
                          background: `linear-gradient(135deg, ${action.color} 0%, ${action.color}dd 100%)`,
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        {action.title}
                      </Button>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={6}>
          <Accordion 
            defaultExpanded={false}
            sx={{ 
              background: 'rgba(25, 28, 38, 0.95)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px !important',
              '&:before': { display: 'none' },
              color: '#fff'
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: '#fff' }} />}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Scenes
                </Typography>
                <Button
                  startIcon={<Add />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDialog(true);
                  }}
                  sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  variant="outlined"
                >
                  Add Scene
                </Button>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {scenes.map((scene) => (
                  <motion.div key={scene.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Chip
                      label={`${scene.icon} ${scene.name}`}
                      onClick={() => handleSceneClick(scene)}
                      sx={{
                        py: 2.5,
                        px: 1,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        },
                      }}
                    />
                  </motion.div>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Scene</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Scene Name"
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Icon (emoji)"
            fullWidth
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Devices to include:
          </Typography>
          <FormControlLabel control={<Switch />} label="Living Room Lights" />
          <FormControlLabel control={<Switch />} label="TV" />
          <FormControlLabel control={<Switch />} label="Speakers" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />}>
            Save Scene
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickActions;
