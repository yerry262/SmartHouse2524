import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SpeakerIcon from '@mui/icons-material/Speaker';
import TvIcon from '@mui/icons-material/Tv';
import VideocamIcon from '@mui/icons-material/Videocam';
import RouterIcon from '@mui/icons-material/Router';
import DoorbellIcon from '@mui/icons-material/Doorbell';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DeviceCard = ({ device, onRefresh }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const navigate = useNavigate();

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRemove = async (event) => {
    event.stopPropagation();
    try {
      await axios.delete(`/api/devices/${device.id}`);
      onRefresh();
    } catch (error) {
      console.error('Error removing device:', error);
    }
    handleMenuClose();
  };

  const handleCardClick = () => {
    navigate(`/device/${device.id}`);
  };

  const getDeviceIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'sonos':
        return <SpeakerIcon sx={{ fontSize: 40, color: '#00D1B2' }} />;
      case 'samsung-tv':
        return <TvIcon sx={{ fontSize: 40, color: '#1428A0' }} />;
      case 'appletv':
        return <SmartDisplayIcon sx={{ fontSize: 40, color: '#A3A3A3' }} />;
      case 'camera':
        return <VideocamIcon sx={{ fontSize: 40, color: '#FF6B6B' }} />;
      case 'eero':
        return <RouterIcon sx={{ fontSize: 40, color: '#00B5AD' }} />;
      case 'ring':
        return <DoorbellIcon sx={{ fontSize: 40, color: '#00B5E2' }} />;
      default:
        return <DevicesOtherIcon sx={{ fontSize: 40, color: '#667eea' }} />;
    }
  };

  return (
    <>
      <Card
        sx={{
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(102, 126, 234, 0.3)',
          },
          height: '100%',
          opacity: device.status === 'offline' ? 0.6 : 1,
          backgroundColor: device.status === 'offline' ? 'rgba(0,0,0,0.02)' : 'transparent',
        }}
        onClick={handleCardClick}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            {getDeviceIcon(device.type)}
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, noWrap: true }}>
            {device.name}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            IP: {device.ip}
          </Typography>
          
          {device.mac && (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              MAC: {device.mac}
            </Typography>
          )}
          
          {device.vendor && device.vendor !== 'Unknown' && (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Vendor: {device.vendor}
            </Typography>
          )}
          
          {device.hostname && (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Hostname: {device.hostname}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            <Chip
              label={device.status}
              color={device.status === 'online' ? 'success' : 'error'}
              size="small"
            />
            <Chip label={device.type} size="small" variant="outlined" />
          </Box>
        </CardContent>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleCardClick}>View Details</MenuItem>
        <MenuItem onClick={handleRemove} sx={{ color: 'error.main' }}>
          Remove Device
        </MenuItem>
      </Menu>
    </>
  );
};

export default DeviceCard;
