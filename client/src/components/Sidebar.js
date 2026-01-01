import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SpeakerIcon from '@mui/icons-material/Speaker';
import TvIcon from '@mui/icons-material/Tv';
import VideocamIcon from '@mui/icons-material/Videocam';
import RouterIcon from '@mui/icons-material/Router';
import DoorbellIcon from '@mui/icons-material/Doorbell';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PowerIcon from '@mui/icons-material/Power';
import BoltIcon from '@mui/icons-material/Bolt';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import DevicesIcon from '@mui/icons-material/Devices';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import KitchenIcon from '@mui/icons-material/Kitchen';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import PrintIcon from '@mui/icons-material/Print';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Sidebar = ({ open, onClose, devices }) => {
  const navigate = useNavigate();

  // Menu items with deviceType for accurate matching
  const baseMenuItems = [
    { title: 'Dashboard', icon: <DashboardIcon />, path: '/', color: '#667eea', deviceType: null },
    { title: 'Philips Hue', icon: <LightbulbIcon />, path: '/hue', color: '#FFB300', deviceType: 'hue' },
    { title: 'TP-Link Kasa', icon: <PowerIcon />, path: '/tplink', color: '#00BFA5', deviceType: 'tplink' },
    { title: 'Belkin WeMo', icon: <BoltIcon />, path: '/wemo', color: '#76b900', deviceType: 'wemo' },
    { title: 'LIFX Bulbs', icon: <LightbulbIcon />, path: '/lifx', color: '#4CAF50', deviceType: 'lifx' },
    { title: 'Nanoleaf', icon: <LightbulbIcon />, path: '/nanoleaf', color: '#16A085', deviceType: 'nanoleaf' },
    { title: 'Wyze Devices', icon: <DevicesIcon />, path: '/wyze', color: '#00C9FF', deviceType: 'wyze' },
    { title: 'Amazon Alexa', icon: <RecordVoiceOverIcon />, path: '/alexa', color: '#FF9900', deviceType: 'alexa' },
    { title: 'Google Home', icon: <RecordVoiceOverIcon />, path: '/google-home', color: '#4285F4', deviceType: 'google' },
    { title: 'Sonos Speakers', icon: <SpeakerIcon />, path: '/sonos', color: '#00D1B2', deviceType: 'sonos' },
    { title: 'Apple TV', icon: <SmartDisplayIcon />, path: '/appletv', color: '#A3A3A3', deviceType: 'appletv' },
    { title: 'Samsung TVs', icon: <TvIcon />, path: '/samsung', color: '#1428A0', deviceType: 'samsung-tv' },
    { title: 'LG TVs', icon: <TvIcon />, path: '/lg', color: '#A50034', deviceType: 'lg' },
    { title: 'Ring Doorbell', icon: <DoorbellIcon />, path: '/ring', color: '#00B5E2', deviceType: 'ring' },
    { title: 'Cameras', icon: <VideocamIcon />, path: '/cameras', color: '#FF6B6B', deviceType: 'camera' },
    { title: 'Eero Network', icon: <RouterIcon />, path: '/eero', color: '#00B5AD', deviceType: 'eero' },
    { title: 'Xiaomi Devices', icon: <CleaningServicesIcon />, path: '/miio', color: '#FF6900', deviceType: 'miio' },
    { title: 'Aurora Solar', icon: <WbSunnyIcon />, path: '/aurora', color: '#FFB300', deviceType: 'aurora' },
    { title: 'Epson Printers', icon: <PrintIcon />, path: '/epson', color: '#003399', deviceType: 'epson' },
    { title: 'Samsung Washer', icon: <LocalLaundryServiceIcon />, path: '/samsung-washer', color: '#1428A0', deviceType: 'samsung-washer' },
    { title: 'GE Appliances', icon: <KitchenIcon />, path: '/ge-appliances', color: '#0066CC', deviceType: 'ge' },
    { title: 'Samsung Appliances', icon: <KitchenIcon />, path: '/samsung-appliances', color: '#1428A0', deviceType: 'samsung-appliance' },
    { title: 'SmartThings Hub', icon: <DevicesIcon />, path: '/smartthings', color: '#00C851', deviceType: 'smartthings' },
  ];

  const getDeviceCount = (deviceType) => {
    if (!deviceType) return 0;
    
    // Map deviceType identifiers to actual device type patterns
    const typeMatchers = {
      'hue': (type) => type.includes('hue'),
      'tplink': (type) => type.includes('tplink') || type.includes('kasa'),
      'wemo': (type) => type.includes('wemo'),
      'lifx': (type) => type.includes('lifx'),
      'nanoleaf': (type) => type.includes('nanoleaf'),
      'wyze': (type) => type.includes('wyze'),
      'alexa': (type) => type.includes('alexa') || type.includes('echo'),
      'google': (type) => type.includes('google') || type.includes('nest'),
      'sonos': (type) => type.includes('sonos'),
      'appletv': (type) => type.includes('appletv') || type.includes('apple-tv'),
      'samsung-tv': (type) => type.includes('samsung-tv') || (type.includes('samsung') && type.includes('tv')),
      'lg': (type) => type.includes('lg') && (type.includes('tv') || type.includes('webos')),
      'ring': (type) => type.includes('ring'),
      'camera': (type) => type.includes('camera') && !type.includes('ring'),
      'eero': (type) => type.includes('eero'),
      'miio': (type) => type.includes('miio') || type.includes('xiaomi'),
      'aurora': (type) => type.includes('aurora'),
      'epson': (type) => type.includes('epson') || type === 'printer',
      'samsung-washer': (type) => type.includes('samsung') && type.includes('washer'),
      'ge': (type) => type.includes('ge') && !type.includes('google'),
      'samsung-appliance': (type) => type.includes('samsung') && type.includes('appliance'),
      'smartthings': (type) => type.includes('smartthings'),
    };
    
    const matcher = typeMatchers[deviceType];
    if (!matcher) {
      return devices.filter(d => d.type.toLowerCase().includes(deviceType.toLowerCase())).length;
    }
    
    return devices.filter(d => matcher(d.type.toLowerCase())).length;
  };

  // Sort menu items: Dashboard first, then by device count descending
  const menuItems = React.useMemo(() => {
    const dashboard = baseMenuItems.find(item => item.path === '/');
    const otherItems = baseMenuItems.filter(item => item.path !== '/');
    
    // Sort by device count (descending)
    const sortedItems = otherItems.sort((a, b) => {
      const countA = getDeviceCount(a.deviceType);
      const countB = getDeviceCount(b.deviceType);
      return countB - countA;
    });
    
    return [dashboard, ...sortedItems];
  }, [devices]);

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          background: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          pt: '64px',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
          Navigation
        </Typography>
        <List>
          {menuItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: '12px',
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: item.color }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                    }}
                  />
                  {item.deviceType && (
                    <Chip
                      label={getDeviceCount(item.deviceType)}
                      size="small"
                      sx={{
                        backgroundColor: item.color,
                        color: '#fff',
                        fontWeight: 700,
                        minWidth: '24px',
                        height: '24px',
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </motion.div>
          ))}
        </List>

        <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        <Box sx={{ p: 2, background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Total Devices
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
            {devices.length}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Connected to network
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
