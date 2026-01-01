import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Slider,
  IconButton,
  LinearProgress,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemSecondaryAction,
  Checkbox
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SpeakerIcon from '@mui/icons-material/Speaker';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ApiIcon from '@mui/icons-material/Api';
import GroupIcon from '@mui/icons-material/Group';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import axios from 'axios';
import { motion } from 'framer-motion';

const SonosPage = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [volume, setVolume] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [positionInfo, setPositionInfo] = useState(null);
  const [progress, setProgress] = useState(0);
  
  // API Test state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestTimestamp, setApiTestTimestamp] = useState(null);
  
  // Group management state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [showBondedDevices, setShowBondedDevices] = useState(false);
  const [groupMemberStatuses, setGroupMemberStatuses] = useState({});

  // Get playable speakers (non-bonded) for group operations
  const playableSpeakers = devices.filter(d => !d.isBonded);
  
  // Get the current device's group info
  const currentDeviceInfo = devices.find(d => d.ip === selectedDevice);
  
  // Get all devices in current group
  const groupedDevices = currentDeviceInfo?.group?.isGrouped 
    ? devices.filter(d => currentDeviceInfo.group.members?.includes(d.name))
    : [];

  useEffect(() => {
    discoverDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDeviceStatus = useCallback(async () => {
    if (!selectedDevice) return;
    
    // Check if the selected device is bonded (Sub, Boost, etc.) - show info instead of error
    const device = devices.find(d => d.ip === selectedDevice);
    if (device?.isBonded) {
      // For bonded devices, show their info but explain they don't play independently
      setDeviceStatus({
        isBonded: true,
        bondedRole: device.bondedRole || 'Bonded Device',
        bondedTo: device.bondedTo,
        device: {
          name: device.name,
          model: device.model,
          ip: device.ip,
          serialNumber: device.serialNumber,
          softwareVersion: device.softwareVersion
        }
      });
      setError(null);
      return;
    }
    
    try {
      const [statusRes, posRes] = await Promise.all([
        axios.get(`/api/sonos/${selectedDevice}/status`),
        axios.get(`/api/sonos/${selectedDevice}/position`)
      ]);
      setDeviceStatus(statusRes.data);
      setVolume(statusRes.data.volume);
      setPositionInfo(posRes.data);
      
      // Calculate progress percentage
      if (posRes.data.duration && posRes.data.position) {
        const durationSecs = timeToSeconds(posRes.data.duration);
        const positionSecs = timeToSeconds(posRes.data.position);
        if (durationSecs > 0) {
          setProgress((positionSecs / durationSecs) * 100);
        }
      }
      setError(null);
    } catch (error) {
      console.error('Error getting device status:', error);
      setError('Failed to get device status');
    }
  }, [selectedDevice, devices]);

  useEffect(() => {
    if (selectedDevice) {
      getDeviceStatus();
      getFavorites();
      if (autoRefresh) {
        const interval = setInterval(getDeviceStatus, 2000); // Update every 2 seconds for smoother progress
        return () => clearInterval(interval);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice, autoRefresh, getDeviceStatus]);

  // Convert time string (HH:MM:SS or MM:SS) to seconds
  const timeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const discoverDevices = async () => {
    setLoading(true);
    try {
      // Fetch devices and zones/groups in parallel
      const [devicesRes, zonesRes] = await Promise.all([
        axios.get('/api/sonos/discover'),
        axios.get('/api/sonos/zones/all').catch(() => ({ data: { zones: [] } }))
      ]);
      
      let deviceList = devicesRes.data;
      const zones = zonesRes.data?.zones || [];
      
      // Extract unique groups from zones data (they all report the same groups)
      let allGroups = [];
      if (zones.length > 0 && zones[0].groups) {
        allGroups = zones[0].groups;
      }
      
      // Enrich devices with group info
      deviceList = deviceList.map(device => {
        if (device.isBonded) return device;
        
        // Find which group this device belongs to
        const myGroup = allGroups.find(g => 
          g.members?.includes(device.name) || g.members?.includes(device.roomName)
        );
        
        if (myGroup) {
          // Get other devices in this group (for member IPs)
          const memberDevices = myGroup.members
            ?.filter(name => name !== device.name)
            .map(name => {
              const memberDev = deviceList.find(d => d.name === name || d.roomName === name);
              return memberDev ? { name, ip: memberDev.ip, model: memberDev.model } : { name };
            }) || [];
          
          device.group = {
            name: myGroup.name,
            members: myGroup.members || [],
            memberDevices,
            isGrouped: (myGroup.members?.length || 0) > 1,
            isCoordinator: myGroup.members?.[0] === device.name || myGroup.name.startsWith(device.name)
          };
        }
        
        return device;
      });
      
      // Add bonded device references
      deviceList.forEach(device => {
        if (device.isBonded) {
          const parent = deviceList.find(d => 
            !d.isBonded && (d.name === device.name || d.roomName === device.roomName)
          );
          if (parent) {
            device.bondedTo = { name: parent.name, ip: parent.ip, model: parent.model };
            if (!parent.bondedDevices) parent.bondedDevices = [];
            parent.bondedDevices.push({
              name: device.name,
              ip: device.ip,
              model: device.model,
              role: device.bondedRole || (device.model?.toLowerCase().includes('sub') ? 'Subwoofer' : 'Bonded')
            });
          }
        }
      });
      
      setDevices(deviceList);
      
      if (deviceList.length > 0 && !selectedDevice) {
        // Priority: 1) Playing speaker, 2) First non-bonded speaker, 3) First speaker
        const playingSpeaker = deviceList.find(d => d.state === 'playing' && !d.isBonded);
        const firstPlayableSpeaker = deviceList.find(d => !d.isBonded);
        if (playingSpeaker) {
          setSelectedDevice(playingSpeaker.ip);
        } else if (firstPlayableSpeaker) {
          setSelectedDevice(firstPlayableSpeaker.ip);
        } else {
          setSelectedDevice(deviceList[0].ip);
        }
      }
    } catch (error) {
      console.error('Error discovering Sonos devices:', error);
      setError('Failed to discover Sonos devices. Make sure they are connected.');
    } finally {
      setLoading(false);
    }
  };

  // Group management functions
  const joinGroup = async (targetIp) => {
    if (!selectedDevice || selectedDevice === targetIp) return;
    setGroupLoading(true);
    try {
      await axios.post(`/api/sonos/${selectedDevice}/join/${targetIp}`);
      // Refresh devices to get updated group info
      await discoverDevices();
      setGroupDialogOpen(false);
    } catch (error) {
      console.error('Error joining group:', error);
      setError('Failed to join group');
    } finally {
      setGroupLoading(false);
    }
  };

  const leaveGroup = async () => {
    if (!selectedDevice) return;
    setGroupLoading(true);
    try {
      await axios.post(`/api/sonos/${selectedDevice}/leave`);
      // Refresh devices to get updated group info
      await discoverDevices();
    } catch (error) {
      console.error('Error leaving group:', error);
      setError('Failed to leave group');
    } finally {
      setGroupLoading(false);
    }
  };

  const getFavorites = async () => {
    if (!selectedDevice) return;
    
    try {
      const response = await axios.get(`/api/sonos/${selectedDevice}/favorites`);
      setFavorites(response.data.favorites || []);
    } catch (error) {
      console.error('Error getting favorites:', error);
    }
  };

  const playFavorite = async (favorite) => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/favorite/${encodeURIComponent(favorite.title)}`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error playing favorite:', error);
    }
  };

  const getQueue = async () => {
    if (!selectedDevice) return;
    
    try {
      const response = await axios.get(`/api/sonos/${selectedDevice}/queue`);
      setQueue(response.data.queue);
    } catch (error) {
      console.error('Error getting queue:', error);
    }
  };

  const handlePlay = async () => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/play`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error playing:', error);
    }
  };

  const handlePause = async () => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/pause`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error pausing:', error);
    }
  };

  const handleStop = async () => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/stop`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error stopping:', error);
    }
  };

  const handleNext = async () => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/next`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error skipping to next:', error);
    }
  };

  const handlePrevious = async () => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/previous`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error skipping to previous:', error);
    }
  };

  const handleVolumeChange = async (event, newValue) => {
    setVolume(newValue);
    try {
      await axios.post(`/api/sonos/${selectedDevice}/volume`, { level: newValue });
    } catch (error) {
      console.error('Error changing volume:', error);
    }
  };

  const handleMute = async () => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/mute`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error muting:', error);
    }
  };

  const handleUnmute = async () => {
    try {
      await axios.post(`/api/sonos/${selectedDevice}/unmute`);
      getDeviceStatus();
    } catch (error) {
      console.error('Error unmuting:', error);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '0:00';
    // If it's already a string like "0:03:12" or "0:02:59", convert to mm:ss
    if (typeof duration === 'string' && duration.includes(':')) {
      const parts = duration.split(':').map(Number);
      if (parts.length === 3) {
        // HH:MM:SS format - convert to just MM:SS (or H:MM:SS if > 60 min)
        const totalMinutes = parts[0] * 60 + parts[1];
        const seconds = parts[2];
        if (totalMinutes >= 60) {
          return `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${totalMinutes}:${String(seconds).padStart(2, '0')}`;
      } else if (parts.length === 2) {
        // Already MM:SS
        return `${parts[0]}:${String(parts[1]).padStart(2, '0')}`;
      }
    }
    // If it's a number (seconds), format it
    if (typeof duration === 'number') {
      const mins = Math.floor(duration / 60);
      const secs = Math.floor(duration % 60);
      return `${mins}:${String(secs).padStart(2, '0')}`;
    }
    return duration;
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'playing': return 'success';
      case 'paused': return 'warning';
      case 'stopped': return 'default';
      default: return 'default';
    }
  };

  const getStateIcon = (state) => {
    switch (state) {
      case 'playing': return <PlayArrowIcon />;
      case 'paused': return <PauseIcon />;
      case 'stopped': return <StopIcon />;
      default: return <MusicNoteIcon />;
    }
  };

  const handleTestApi = async () => {
    if (!selectedDevice) return;
    setApiTestLoading(true);
    try {
      const response = await axios.get(`/api/sonos/${selectedDevice}/status`);
      setApiTestResult(response.data);
      setApiTestTimestamp(new Date().toLocaleString());
      
      // If grouped, fetch status for all group members
      if (currentDeviceInfo?.group?.isGrouped && groupedDevices.length > 1) {
        const memberStatuses = {};
        await Promise.all(
          groupedDevices.map(async (dev) => {
            try {
              const res = await axios.get(`/api/sonos/${dev.ip}/status`);
              memberStatuses[dev.ip] = res.data;
            } catch (e) {
              memberStatuses[dev.ip] = { error: e.message };
            }
          })
        );
        setGroupMemberStatuses(memberStatuses);
      }
    } catch (err) {
      setApiTestResult({ error: err.message || 'API request failed', status: err.response?.status });
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SpeakerIcon sx={{ fontSize: 40, mr: 2, color: '#00D1B2' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Sonos Speakers ({playableSpeakers.length})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showBondedDevices}
                  onChange={(e) => setShowBondedDevices(e.target.checked)}
                  color="info"
                  size="small"
                />
              }
              label="Show bonded"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  color="primary"
                />
              }
              label="Auto-refresh"
            />
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={discoverDevices}
              disabled={loading}
            >
              Discover
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Device Selection */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">
                    📡 Speakers & Groups
                  </Typography>
                  {currentDeviceInfo?.group?.isGrouped && (
                    <Tooltip title="Leave current group">
                      <IconButton 
                        size="small" 
                        onClick={leaveGroup}
                        disabled={groupLoading}
                        color="warning"
                      >
                        <LinkOffIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {/* Show Groups Summary */}
                    {(() => {
                      const groups = [];
                      const seenGroups = new Set();
                      devices.filter(d => !d.isBonded && d.group?.isGrouped).forEach(device => {
                        if (!seenGroups.has(device.group.name)) {
                          seenGroups.add(device.group.name);
                          const groupDevices = devices.filter(d => d.group?.name === device.group.name);
                          groups.push({
                            name: device.group.name,
                            members: device.group.members,
                            memberDevices: groupDevices,
                            coordinator: groupDevices.find(d => d.group?.isCoordinator)
                          });
                        }
                      });
                      
                      return groups.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                            🔗 ACTIVE GROUPS
                          </Typography>
                          {groups.map(group => {
                            const isSelected = selectedDevice && group.memberDevices?.some(d => d.ip === selectedDevice);
                            return (
                              <Paper 
                                key={group.name}
                                sx={{ 
                                  p: 1.5, 
                                  mb: 1, 
                                  bgcolor: isSelected ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.05)',
                                  border: '2px solid',
                                  borderColor: isSelected ? 'primary.main' : 'rgba(33, 150, 243, 0.3)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'rgba(33, 150, 243, 0.12)'
                                  }
                                }}
                                onClick={() => group.coordinator && setSelectedDevice(group.coordinator.ip)}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
                                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mt: 0.5 }}>
                                      <GroupIcon sx={{ fontSize: 18 }} />
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        {group.name}
                                      </Typography>
                                      {/* Show each member device */}
                                      {group.memberDevices?.map((dev, idx) => (
                                        <Box 
                                          key={dev.ip}
                                          sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 0.5,
                                            py: 0.25,
                                            pl: 1,
                                            borderLeft: '2px solid',
                                            borderColor: dev.ip === selectedDevice ? 'primary.main' : 'divider',
                                            bgcolor: dev.ip === selectedDevice ? 'rgba(255,255,255,0.05)' : 'transparent',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                                          }}
                                          onClick={(e) => { e.stopPropagation(); setSelectedDevice(dev.ip); }}
                                        >
                                          <Typography variant="caption" sx={{ 
                                            fontWeight: dev.group?.isCoordinator ? 600 : 400,
                                            color: dev.ip === selectedDevice ? 'primary.main' : 'text.secondary'
                                          }}>
                                            {dev.group?.isCoordinator ? '👑 ' : '• '}{dev.name}
                                          </Typography>
                                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                            {dev.model?.replace('Sonos ', '')}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                  </Box>
                                  <Tooltip title="Ungroup speakers">
                                    <IconButton 
                                      size="small" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Ungroup by making non-coordinator leave
                                        const nonCoordinators = devices.filter(d => 
                                          d.group?.name === group.name && !d.group?.isCoordinator
                                        );
                                        if (nonCoordinators.length > 0) {
                                          setSelectedDevice(nonCoordinators[0].ip);
                                          setTimeout(() => leaveGroup(), 100);
                                        }
                                      }}
                                      color="warning"
                                      sx={{ mt: 0.5 }}
                                    >
                                      <LinkOffIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Paper>
                            );
                          })}
                          <Divider sx={{ my: 1.5 }} />
                        </Box>
                      );
                    })()}
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                      📻 ALL SPEAKERS
                    </Typography>
                    <List dense>
                    {devices
                      .filter(d => showBondedDevices || !d.isBonded)
                      .map((device) => (
                      <ListItem
                        key={device.ip}
                        button
                        selected={selectedDevice === device.ip}
                        onClick={() => setSelectedDevice(device.ip)}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          border: device.group?.isGrouped ? '1px solid' : 'none',
                          borderColor: device.group?.isGrouped ? 'primary.main' : 'transparent',
                          backgroundColor: device.group?.isGrouped && device.group?.isCoordinator ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
                          '&.Mui-selected': {
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': {
                              backgroundColor: 'primary.dark',
                            },
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: device.state === 'playing' ? 'success.main' : 
                                     device.state === 'paused' ? 'warning.main' :
                                     device.isBonded ? 'info.main' : 
                                     device.group?.isGrouped ? 'primary.main' : 'grey.600',
                            width: 36,
                            height: 36
                          }}>
                            {device.isSub ? '🔊' : device.isBoost ? '📶' : 
                             device.group?.isGrouped ? <GroupIcon sx={{ fontSize: 18 }} /> : <SpeakerIcon sx={{ fontSize: 18 }} />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                              <Typography variant="body2" sx={{ fontWeight: selectedDevice === device.ip ? 600 : 400 }}>
                                {device.group?.isGrouped ? device.group.name : (device.name || `Sonos ${device.ip}`)}
                              </Typography>
                              {device.state === 'playing' && (
                                <Chip label="▶" size="small" color="success" sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }} />
                              )}
                              {device.bondedDevices?.length > 0 && (
                                <Chip 
                                  label={`+${device.bondedDevices.length}`} 
                                  size="small" 
                                  color="info" 
                                  sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }} 
                                  title={device.bondedDevices.map(b => b.role).join(', ')}
                                />
                              )}
                              {device.isBonded && (
                                <Chip 
                                  label={device.bondedRole || 'Bonded'} 
                                  size="small" 
                                  color="info" 
                                  sx={{ height: 16, fontSize: '0.55rem', '& .MuiChip-label': { px: 0.5 } }} 
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box component="span">
                              <Typography variant="caption" component="span" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                {device.group?.isGrouped && !device.group?.isCoordinator 
                                  ? `Part of ${device.group.name}` 
                                  : device.model || 'Unknown Model'}
                                {device.group?.members?.length > 1 && device.group?.isCoordinator && (
                                  <> • {device.group.members.length} speakers</>
                                )}
                              </Typography>
                              {device.bondedTo && (
                                <Typography variant="caption" component="span" sx={{ display: 'block', color: 'info.main', fontSize: '0.65rem' }}>
                                  → {device.bondedTo.model}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        {!device.isBonded && selectedDevice === device.ip && (
                          <ListItemSecondaryAction>
                            <Tooltip title="Manage group">
                              <IconButton 
                                edge="end" 
                                size="small"
                                onClick={(e) => { e.stopPropagation(); setGroupDialogOpen(true); }}
                              >
                                <LinkIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    ))}
                  </List>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Playback Controls */}
          <Grid item xs={12} md={8}>
            {selectedDevice && deviceStatus?.isBonded ? (
              /* Bonded Device Info Card */
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ width: 80, height: 80, mr: 2, bgcolor: 'info.main', fontSize: '2.5rem' }}>
                      {deviceStatus.bondedRole === 'Subwoofer' ? '🔊' : 
                       deviceStatus.bondedRole === 'WiFi Boost' ? '📶' : '🔗'}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {deviceStatus.device?.name || 'Bonded Device'}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {deviceStatus.device?.model}
                      </Typography>
                      <Chip 
                        label={deviceStatus.bondedRole || 'Bonded Device'} 
                        color="info" 
                        size="small" 
                        sx={{ mt: 1 }} 
                      />
                    </Box>
                  </Box>

                  <Alert severity="info" sx={{ mb: 3 }}>
                    This {deviceStatus.bondedRole?.toLowerCase() || 'device'} is bonded and doesn't play audio independently. 
                    It works together with its paired speaker.
                  </Alert>

                  {deviceStatus.bondedTo && (
                    <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        🔗 Paired With
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <SpeakerIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {deviceStatus.bondedTo.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {deviceStatus.bondedTo.model} • {deviceStatus.bondedTo.ip}
                          </Typography>
                        </Box>
                        <Button 
                          variant="contained" 
                          size="small"
                          onClick={() => setSelectedDevice(deviceStatus.bondedTo.ip)}
                        >
                          Control
                        </Button>
                      </Box>
                    </Paper>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    📋 Device Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">IP Address</Typography>
                      <Typography variant="body2">{deviceStatus.device?.ip}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Serial Number</Typography>
                      <Typography variant="body2">{deviceStatus.device?.serialNumber}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Software Version</Typography>
                      <Typography variant="body2">{deviceStatus.device?.softwareVersion}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Role</Typography>
                      <Typography variant="body2">{deviceStatus.bondedRole}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ) : selectedDevice && deviceStatus ? (
              <Grid container spacing={3}>
                {/* Now Playing / Last Played */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                          {deviceStatus.state === 'playing' ? '🎵 Now Playing' : '⏸️ Last Played'}
                        </Typography>
                        <Chip 
                          icon={getStateIcon(deviceStatus.state)}
                          label={deviceStatus.state.toUpperCase()}
                          color={getStateColor(deviceStatus.state)}
                          variant="filled"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        {deviceStatus.track?.albumArtURI ? (
                          <Avatar 
                            src={deviceStatus.track.albumArtURI} 
                            sx={{ width: 80, height: 80, mr: 2 }}
                          />
                        ) : (
                          <Avatar sx={{ width: 80, height: 80, mr: 2 }}>
                            <MusicNoteIcon sx={{ fontSize: 40 }} />
                          </Avatar>
                        )}
                        
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {deviceStatus.track?.title || 'No track'}
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {deviceStatus.track?.artist || 'Unknown artist'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {deviceStatus.track?.album || 'Unknown album'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDuration(deviceStatus.track?.position)} / {formatDuration(deviceStatus.track?.duration)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Progress Bar */}
                      <Box sx={{ mb: 3 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={progress}
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                            }
                          }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDuration(positionInfo?.position) || '0:00'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDuration(positionInfo?.duration) || '0:00'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Control Buttons */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <IconButton onClick={handlePrevious} size="large">
                          <SkipPreviousIcon />
                        </IconButton>
                        
                        {deviceStatus.state === 'playing' ? (
                          <IconButton 
                            onClick={handlePause} 
                            size="large"
                            sx={{ 
                              backgroundColor: 'primary.main', 
                              color: 'white',
                              '&:hover': { backgroundColor: 'primary.dark' }
                            }}
                          >
                            <PauseIcon />
                          </IconButton>
                        ) : (
                          <IconButton 
                            onClick={handlePlay} 
                            size="large"
                            sx={{ 
                              backgroundColor: 'primary.main', 
                              color: 'white',
                              '&:hover': { backgroundColor: 'primary.dark' }
                            }}
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        )}
                        
                        <IconButton onClick={handleStop} size="large">
                          <StopIcon />
                        </IconButton>
                        
                        <IconButton onClick={handleNext} size="large">
                          <SkipNextIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Volume Control */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <VolumeUpIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Volume ({volume}%)</Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={handleMute} size="small">
                          <VolumeOffIcon />
                        </IconButton>
                        
                        <Slider
                          value={volume}
                          onChange={handleVolumeChange}
                          min={0}
                          max={100}
                          valueLabelDisplay="auto"
                          sx={{ flexGrow: 1 }}
                        />
                        
                        <IconButton onClick={handleUnmute} size="small">
                          <VolumeUpIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Device Info - Shows all grouped devices if in a group */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6">
                          {currentDeviceInfo?.group?.isGrouped ? '👥 Group Info' : '📱 Device Info'}
                        </Typography>
                        {!currentDeviceInfo?.group?.isGrouped && (
                          <Button 
                            size="small" 
                            startIcon={<LinkIcon />}
                            onClick={() => setGroupDialogOpen(true)}
                            variant="outlined"
                          >
                            Group
                          </Button>
                        )}
                        {currentDeviceInfo?.group?.isGrouped && (
                          <Button 
                            size="small" 
                            startIcon={<LinkOffIcon />}
                            onClick={leaveGroup}
                            disabled={groupLoading}
                            color="warning"
                            variant="outlined"
                          >
                            Ungroup
                          </Button>
                        )}
                      </Box>
                      
                      {/* Show group name if grouped */}
                      {currentDeviceInfo?.group?.isGrouped && (
                        <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
                          <Typography variant="body2">
                            <strong>{currentDeviceInfo.group.name}</strong> — {currentDeviceInfo.group.members?.length} speakers playing in sync
                          </Typography>
                        </Alert>
                      )}
                      
                      <Divider sx={{ mb: 2 }} />
                      
                      {/* Show all devices in group, or just the single device */}
                      {(currentDeviceInfo?.group?.isGrouped ? groupedDevices : [currentDeviceInfo]).filter(Boolean).map((dev, idx) => (
                        <Box key={dev.ip} sx={{ mb: idx < groupedDevices.length - 1 ? 2 : 0 }}>
                          {currentDeviceInfo?.group?.isGrouped && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Chip 
                                label={dev.group?.isCoordinator ? '👑 Leader' : `Speaker ${idx + 1}`}
                                size="small"
                                color={dev.group?.isCoordinator ? 'primary' : 'default'}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                              <Typography variant="subtitle2">{dev.name}</Typography>
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: currentDeviceInfo?.group?.isGrouped ? 2 : 0 }}>
                            {!currentDeviceInfo?.group?.isGrouped && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Name</Typography>
                                <Typography variant="body2">{dev.name || 'Unknown'}</Typography>
                              </Box>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Model</Typography>
                              <Typography variant="body2">{dev.model || 'Unknown'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">IP Address</Typography>
                              <Typography variant="body2">{dev.ip}</Typography>
                            </Box>
                            {dev.serialNumber && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Serial</Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{dev.serialNumber}</Typography>
                              </Box>
                            )}
                            {dev.bondedDevices?.length > 0 && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Bonded</Typography>
                                <Typography variant="body2" color="info.main">
                                  +{dev.bondedDevices.map(b => b.role).join(', ')}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          {currentDeviceInfo?.group?.isGrouped && idx < groupedDevices.length - 1 && (
                            <Divider sx={{ my: 1.5 }} />
                          )}
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Original single device info - hidden when showing group
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        📱 Device Info
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Name</Typography>
                          <Typography variant="body2">{deviceStatus.device?.name || 'Unknown'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Model</Typography>
                          <Typography variant="body2">{deviceStatus.device?.model || 'Unknown'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">IP Address</Typography>
                          <Typography variant="body2">{deviceStatus.ip}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Serial Number</Typography>
                          <Typography variant="body2">{deviceStatus.device?.serialNumber || 'Unknown'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Software</Typography>
                          <Typography variant="body2">{deviceStatus.device?.softwareVersion || 'Unknown'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Last Update</Typography>
                          <Typography variant="body2">{new Date(deviceStatus.timestamp).toLocaleTimeString()}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Tabs for Queue and Favorites */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Tabs 
                        value={tabValue} 
                        onChange={(e, v) => setTabValue(v)}
                        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                      >
                        <Tab icon={<QueueMusicIcon />} label="Queue" />
                        <Tab icon={<FavoriteIcon />} label="Favorites" />
                      </Tabs>
                      
                      {/* Queue Tab */}
                      {tabValue === 0 && (
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button 
                              variant="outlined" 
                              size="small"
                              startIcon={<RefreshIcon />}
                              onClick={getQueue}
                            >
                              Refresh Queue
                            </Button>
                          </Box>
                          {queue.length > 0 ? (
                            <List dense>
                              {queue.slice(0, 10).map((track, index) => (
                                <ListItem key={index} divider>
                                  <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                                      {index + 1}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={track.title || 'Unknown track'}
                                    secondary={`${track.artist || 'Unknown artist'} - ${track.album || 'Unknown album'}`}
                                  />
                                </ListItem>
                              ))}
                              {queue.length > 10 && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                                  And {queue.length - 10} more tracks...
                                </Typography>
                              )}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                              Click "Refresh Queue" to load the current queue
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {/* Favorites Tab */}
                      {tabValue === 1 && (
                        <Box>
                          {favorites.length > 0 ? (
                            <Grid container spacing={2}>
                              {favorites.map((fav, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                  <Paper
                                    sx={{ 
                                      p: 2, 
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      '&:hover': { 
                                        transform: 'scale(1.02)',
                                        boxShadow: 4
                                      }
                                    }}
                                    onClick={() => playFavorite(fav)}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Avatar 
                                        src={fav.albumArtURI || fav.albumArtUri} 
                                        sx={{ width: 48, height: 48 }}
                                      >
                                        <FavoriteIcon />
                                      </Avatar>
                                      <Box sx={{ overflow: 'hidden' }}>
                                        <Tooltip title={fav.title}>
                                          <Typography variant="body2" noWrap sx={{ fontWeight: 'bold' }}>
                                            {fav.title}
                                          </Typography>
                                        </Tooltip>
                                        <Typography variant="caption" color="text.secondary" noWrap>
                                          {fav.description || 'Sonos Favorite'}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                              No favorites found. Add favorites in your Sonos app.
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {/* API Test Section */}
                      {tabValue === 0 && (
                        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle1\" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                            <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.3)', maxHeight: 350, overflow: 'auto' }}>
                              {apiTestResult.error ? (
                                <Alert severity="error">{apiTestResult.error}</Alert>
                              ) : currentDeviceInfo?.group?.isGrouped && Object.keys(groupMemberStatuses).length > 0 ? (
                                // Show all group members' statuses
                                <>
                                  <Alert severity="info" sx={{ mb: 2 }}>
                                    Showing status for {Object.keys(groupMemberStatuses).length} grouped speakers
                                  </Alert>
                                  {groupedDevices.map((dev, idx) => {
                                    const status = groupMemberStatuses[dev.ip];
                                    if (!status) return null;
                                    return (
                                      <Box key={dev.ip} sx={{ mb: idx < groupedDevices.length - 1 ? 2 : 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                          <Chip 
                                            label={dev.group?.isCoordinator ? '👑' : `${idx + 1}`}
                                            size="small"
                                            color={dev.group?.isCoordinator ? 'primary' : 'default'}
                                            sx={{ height: 18, minWidth: 24 }}
                                          />
                                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{dev.name}</Typography>
                                        </Box>
                                        {status.error ? (
                                          <Alert severity="error" sx={{ py: 0 }}>{status.error}</Alert>
                                        ) : (
                                          <Box sx={{ pl: 4, fontSize: '0.8rem' }}>
                                            <Typography variant="body2">
                                              <strong>Volume:</strong> {status.volume}% | 
                                              <strong> Playing:</strong> {status.playing ? '▶️ Yes' : '⏹️ No'}
                                            </Typography>
                                            {status.currentTrack?.title && (
                                              <Typography variant="caption" color="text.secondary">
                                                🎵 {status.currentTrack.title} - {status.currentTrack.artist || 'Unknown'}
                                              </Typography>
                                            )}
                                          </Box>
                                        )}
                                        {idx < groupedDevices.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                                      </Box>
                                    );
                                  })}
                                  <Divider sx={{ my: 2 }} />
                                  <Typography variant="caption" color="text.secondary">Raw Response (Leader):</Typography>
                                  <pre style={{ margin: 0, fontSize: '0.6rem', whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'auto' }}>
                                    {JSON.stringify(apiTestResult, null, 2)}
                                  </pre>
                                </>
                              ) : (
                                // Single device status
                                <>
                                  <Box sx={{ mb: 2 }}>
                                    {apiTestResult.device && (
                                      <>
                                        <Typography variant="body2"><strong>Room:</strong> {apiTestResult.device.name}</Typography>
                                        <Typography variant="body2"><strong>Model:</strong> {apiTestResult.device.model}</Typography>
                                      </>
                                    )}
                                    <Typography variant="body2"><strong>Playing:</strong> {apiTestResult.playing ? 'Yes' : 'No'}</Typography>
                                    <Typography variant="body2"><strong>Volume:</strong> {apiTestResult.volume}%</Typography>
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">Raw Response:</Typography>
                                  <pre style={{ margin: 0, fontSize: '0.65rem', whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(apiTestResult, null, 2)}
                                  </pre>
                                </>
                              )}
                            </Paper>
                          ) : (
                            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
                              <Typography variant="body2" color="text.secondary">
                                Click "Test API" to fetch speaker status
                              </Typography>
                            </Paper>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : selectedDevice ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <SpeakerIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a Sonos speaker to control
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>

        {/* Group Management Dialog */}
        <Dialog 
          open={groupDialogOpen} 
          onClose={() => setGroupDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon color="primary" />
              Manage Speaker Group
            </Box>
          </DialogTitle>
          <DialogContent>
            {currentDeviceInfo && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Current Speaker
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <SpeakerIcon />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {currentDeviceInfo.name}
                        </Typography>
                        <Typography variant="caption">
                          {currentDeviceInfo.model} • {currentDeviceInfo.ip}
                        </Typography>
                      </Box>
                    </Box>
                    {currentDeviceInfo.bondedDevices?.length > 0 && (
                      <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                        <Typography variant="caption">
                          Bonded: {currentDeviceInfo.bondedDevices.map(b => `${b.role} (${b.model})`).join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>

                {currentDeviceInfo.group?.isGrouped && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Current Group: {currentDeviceInfo.group.name}
                    </Typography>
                    <Paper sx={{ p: 2 }}>
                      <List dense>
                        {currentDeviceInfo.group.members?.map((member, idx) => (
                          <ListItem key={idx}>
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                width: 32, 
                                height: 32, 
                                bgcolor: member.isCoordinator ? 'primary.main' : 'grey.600' 
                              }}>
                                <SpeakerIcon sx={{ fontSize: 16 }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={member.name}
                              secondary={member.isCoordinator ? 'Group Leader' : member.ip}
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<LinkOffIcon />}
                        onClick={leaveGroup}
                        disabled={groupLoading}
                        fullWidth
                        sx={{ mt: 1 }}
                      >
                        {groupLoading ? <CircularProgress size={20} /> : 'Leave Group'}
                      </Button>
                    </Paper>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Join Another Speaker's Group
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Select a speaker to play the same audio in sync
                </Typography>
                
                <List>
                  {playableSpeakers
                    .filter(d => d.ip !== selectedDevice)
                    .map((device) => (
                    <ListItem
                      key={device.ip}
                      button
                      onClick={() => joinGroup(device.ip)}
                      disabled={groupLoading}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'rgba(33, 150, 243, 0.08)'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          width: 36, 
                          height: 36,
                          bgcolor: device.state === 'playing' ? 'success.main' : 
                                   device.group?.isGrouped ? 'primary.main' : 'grey.600' 
                        }}>
                          {device.group?.isGrouped ? <GroupIcon sx={{ fontSize: 18 }} /> : <SpeakerIcon sx={{ fontSize: 18 }} />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {device.name}
                            {device.state === 'playing' && (
                              <Chip label="▶" size="small" color="success" sx={{ height: 16 }} />
                            )}
                            {device.group?.isGrouped && (
                              <Chip label={`${device.group.members?.length} speakers`} size="small" sx={{ height: 16 }} />
                            )}
                          </Box>
                        }
                        secondary={device.model}
                      />
                      <LinkIcon color="action" />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGroupDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default SonosPage;
