import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Avatar,
  Chip,
  Alert,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SecurityIcon from '@mui/icons-material/Security';
import { motion } from 'framer-motion';
import { useAccounts } from '../contexts/AccountContext';

// Brand configurations matching AccountsPanel
const brandConfigs = {
  amazon: {
    name: 'Amazon Alexa',
    color: '#00CAFF',
    bgColor: '#232F3E',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Amazon_Alexa_App_Logo.png/600px-Amazon_Alexa_App_Logo.png',
    features: ['Echo speakers', 'Smart plugs', 'Routines', 'Voice control'],
  },
  google: {
    name: 'Google Home',
    color: '#4285F4',
    bgColor: '#fff',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Google_Home_logo.png/600px-Google_Home_logo.png',
    features: ['Chromecast', 'Google Home speakers', 'Nest Hub displays', 'Google TV'],
    note: 'Discovers Cast-enabled devices on your network',
  },
  nest: {
    name: 'Google Nest',
    color: '#00ACC1',
    bgColor: '#fff',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Nest_Labs_logo.svg/512px-Nest_Labs_logo.svg.png',
    features: ['Thermostats', 'Cameras', 'Doorbells', 'Protect sensors'],
    redirectTo: 'smartthings',
    redirectMessage: 'Link Nest devices via SmartThings app, then connect SmartThings here',
  },
  ring: {
    name: 'Ring',
    color: '#1C9AD6',
    bgColor: '#fff',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Ring_logo.svg/512px-Ring_logo.svg.png',
    features: ['Video doorbells', 'Cameras', 'Alarm', 'Chimes'],
  },
  smartthings: {
    name: 'Samsung SmartThings',
    color: '#15B8A6',
    bgColor: '#fff',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Samsung_SmartThings_Logo.svg/512px-Samsung_SmartThings_Logo.svg.png',
    features: ['Hub devices', 'Sensors', 'Automations', 'Scenes'],
  },
  apple: {
    name: 'Apple HomeKit',
    color: '#A3A3A3',
    bgColor: '#000',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/488px-Apple_logo_black.svg.png',
    features: ['HomeKit devices', 'Scenes', 'Automations'],
  },
  tuya: {
    name: 'Tuya / Smart Life',
    color: '#FF6B35',
    bgColor: '#fff',
    logo: 'https://images.tuyaus.com/smart/logo/tuya-logo.png',
    features: ['Smart plugs', 'Bulbs', 'Switches', 'Sensors'],
  },
  homeassistant: {
    name: 'Home Assistant',
    color: '#41BDF5',
    bgColor: '#038FC7',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Home_Assistant_Logo.svg/512px-Home_Assistant_Logo.svg.png',
    features: ['All HA entities', 'Automations', 'Scripts'],
  },
};

const AccountRequiredPrompt = ({ 
  providerId, 
  title,
  description,
  showLocalOption = false,
  onTryLocal,
  localOptionText = 'Try Local Discovery Instead',
}) => {
  const { openAccountsPanel, isAccountLinked, getAccountData } = useAccounts();
  const brand = brandConfigs[providerId] || {
    name: providerId,
    color: '#667eea',
    bgColor: '#1a1a2e',
    features: [],
  };
  
  const linked = isAccountLinked(providerId);
  const accountData = getAccountData(providerId);

  if (linked) {
    // Account is linked - show connected status
    return (
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: `linear-gradient(135deg, ${brand.color}15 0%, ${brand.color}05 100%)`,
          border: `1px solid ${brand.color}40`,
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={brand.logo}
            sx={{ 
              width: 48, 
              height: 48, 
              bgcolor: brand.bgColor,
              p: 0.5,
              '& img': { objectFit: 'contain' }
            }}
          >
            {brand.name.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {brand.name}
              </Typography>
              <Chip 
                label="Connected" 
                size="small" 
                color="success"
                sx={{ height: 22, fontSize: '0.7rem' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Linked {accountData?.linkedAt ? new Date(accountData.linkedAt).toLocaleDateString() : 'recently'}
              {accountData?.deviceCount ? ` • ${accountData.deviceCount} devices imported` : ''}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={openAccountsPanel}
            sx={{ borderColor: brand.color, color: brand.color }}
          >
            Manage
          </Button>
        </Box>
      </Paper>
    );
  }

  // Account not linked - show sign in prompt
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Avatar
          src={brand.logo}
          sx={{ 
            width: 80, 
            height: 80, 
            bgcolor: brand.bgColor,
            mx: 'auto',
            mb: 2,
            p: 1,
            '& img': { objectFit: 'contain' }
          }}
        >
          <CloudOffIcon sx={{ fontSize: 40 }} />
        </Avatar>
        
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          {title || `Connect ${brand.name}`}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
          {description || `Sign in to your ${brand.name} account to import and control your devices. Your credentials are stored locally and never shared.`}
        </Typography>

        {/* Features chips */}
        {brand.features.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {brand.features.map(feature => (
              <Chip
                key={feature}
                label={feature}
                size="small"
                sx={{ bgcolor: `${brand.color}20`, color: brand.color }}
              />
            ))}
          </Box>
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={<LinkIcon />}
          onClick={openAccountsPanel}
          sx={{
            background: `linear-gradient(135deg, ${brand.color} 0%, ${brand.color}CC 100%)`,
            px: 4,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Sign In to {brand.name}
        </Button>

        {showLocalOption && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="text"
              size="small"
              onClick={onTryLocal}
              sx={{ color: 'text.secondary' }}
            >
              {localOptionText}
            </Button>
          </Box>
        )}

        {/* Privacy notice */}
        <Alert 
          severity="info" 
          icon={<SecurityIcon />}
          sx={{ 
            mt: 3, 
            textAlign: 'left',
            bgcolor: 'rgba(0,0,0,0.2)',
            '& .MuiAlert-icon': { color: '#4CAF50' }
          }}
        >
          <Typography variant="caption">
            <strong>Local-First Privacy:</strong> Your credentials are encrypted and stored only on this device. 
            SmartHouse connects directly to cloud APIs without any intermediary servers.
          </Typography>
        </Alert>
      </Paper>
    </motion.div>
  );
};

export default AccountRequiredPrompt;
