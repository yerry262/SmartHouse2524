import React, { useState } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Collapse,
  Paper,
  Avatar,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import DevicesIcon from '@mui/icons-material/Devices';
import HomeIcon from '@mui/icons-material/Home';
import SecurityIcon from '@mui/icons-material/Security';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import { motion, AnimatePresence } from 'framer-motion';

// Brand logo URLs (using official or common CDN sources)
const brandLogos = {
  amazon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Amazon_Alexa_App_Logo.png/600px-Amazon_Alexa_App_Logo.png',
  google: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Google_Home_logo.png/600px-Google_Home_logo.png',
  nest: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Nest_Labs_logo.svg/512px-Nest_Labs_logo.svg.png',
  ring: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Ring_logo.svg/512px-Ring_logo.svg.png',
  smartthings: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Samsung_SmartThings_Logo.svg/512px-Samsung_SmartThings_Logo.svg.png',
  apple: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/488px-Apple_logo_black.svg.png',
  tuya: 'https://images.tuyaus.com/smart/logo/tuya-logo.png',
  homeassistant: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Home_Assistant_Logo.svg/512px-Home_Assistant_Logo.svg.png',
  hubitat: 'https://hubitat.com/images/hubitat-logo-white.svg',
  ifttt: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/IFTTT_2021.svg/512px-IFTTT_2021.svg.png',
};

// Account provider configurations
const accountProviders = [
  {
    id: 'amazon',
    name: 'Amazon Alexa',
    logo: brandLogos.amazon,
    color: '#00CAFF',
    bgColor: '#232F3E',
    description: 'Import Echo devices, smart plugs, and Alexa-connected devices',
    authType: 'oauth',
    fields: ['email', 'password'],
    features: ['Echo speakers', 'Smart plugs', 'Routines', 'Groups'],
  },
  {
    id: 'google',
    name: 'Google Home',
    logo: brandLogos.google,
    color: '#4285F4',
    bgColor: '#fff',
    description: 'Sync Chromecast, Home speakers, and Google-connected devices',
    authType: 'oauth',
    fields: ['email'],
    features: ['Chromecast', 'Home speakers', 'Routines', 'Smart displays'],
  },
  {
    id: 'nest',
    name: 'Google Nest',
    logo: brandLogos.nest,
    color: '#00ACC1',
    bgColor: '#fff',
    description: 'Connect Nest thermostats, cameras, doorbells, and sensors',
    authType: 'oauth',
    fields: ['email'],
    features: ['Thermostats', 'Cameras', 'Doorbells', 'Protect sensors'],
  },
  {
    id: 'ring',
    name: 'Ring',
    logo: brandLogos.ring,
    color: '#1C9AD6',
    bgColor: '#fff',
    description: 'Import Ring doorbells, cameras, and alarm systems',
    authType: 'oauth',
    fields: ['email', 'password'],
    features: ['Video doorbells', 'Cameras', 'Alarm', 'Chimes'],
  },
  {
    id: 'smartthings',
    name: 'Samsung SmartThings',
    logo: brandLogos.smartthings,
    color: '#15B8A6',
    bgColor: '#fff',
    description: 'Connect SmartThings hub and all linked devices',
    authType: 'token',
    fields: ['apiToken'],
    features: ['Hub devices', 'Sensors', 'Automations', 'Scenes'],
  },
  {
    id: 'apple',
    name: 'Apple HomeKit',
    logo: brandLogos.apple,
    color: '#A3A3A3',
    bgColor: '#000',
    description: 'Import HomeKit accessories (requires HomeKit bridge)',
    authType: 'local',
    fields: ['bridgeIp', 'pin'],
    features: ['HomeKit devices', 'Scenes', 'Automations'],
  },
  {
    id: 'tuya',
    name: 'Tuya / Smart Life',
    logo: brandLogos.tuya,
    color: '#FF6B35',
    bgColor: '#fff',
    description: 'Connect Tuya-based devices (Smart Life, Gosund, etc.)',
    authType: 'api',
    fields: ['accessId', 'accessKey', 'region'],
    features: ['Smart plugs', 'Bulbs', 'Switches', 'Sensors'],
  },
  {
    id: 'homeassistant',
    name: 'Home Assistant',
    logo: brandLogos.homeassistant,
    color: '#41BDF5',
    bgColor: '#038FC7',
    description: 'Sync devices from your Home Assistant instance',
    authType: 'token',
    fields: ['serverUrl', 'longLivedToken'],
    features: ['All HA entities', 'Automations', 'Scripts'],
  },
  {
    id: 'hubitat',
    name: 'Hubitat Elevation',
    logo: brandLogos.hubitat,
    color: '#00A86B',
    bgColor: '#1a1a2e',
    description: 'Connect Hubitat hub and Z-Wave/Zigbee devices',
    authType: 'api',
    fields: ['hubIp', 'makerApiToken'],
    features: ['Z-Wave devices', 'Zigbee devices', 'Rules'],
  },
  {
    id: 'ifttt',
    name: 'IFTTT',
    logo: brandLogos.ifttt,
    color: '#000000',
    bgColor: '#fff',
    description: 'Trigger IFTTT applets and webhooks',
    authType: 'webhook',
    fields: ['webhookKey'],
    features: ['Applets', 'Webhooks', 'Triggers'],
  },
];

// Brand Logo Component with fallback
const BrandLogo = ({ provider, size = 32 }) => {
  const [imgError, setImgError] = useState(false);
  
  if (imgError || !provider.logo) {
    // Fallback to colored avatar with first letter
    return (
      <Avatar 
        sx={{ 
          width: size, 
          height: size, 
          bgcolor: provider.color,
          fontSize: size * 0.5,
          fontWeight: 700,
        }}
      >
        {provider.name.charAt(0)}
      </Avatar>
    );
  }
  
  return (
    <Avatar
      src={provider.logo}
      alt={provider.name}
      onError={() => setImgError(true)}
      sx={{
        width: size,
        height: size,
        bgcolor: provider.bgColor || '#fff',
        p: 0.5,
        '& img': {
          objectFit: 'contain',
        },
      }}
    />
  );
};

const AccountsPanel = ({ open, onClose, linkedAccounts = {}, onLinkAccount, onUnlinkAccount }) => {
  const [signInDialog, setSignInDialog] = useState({ open: false, provider: null });
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedProvider, setExpandedProvider] = useState(null);
  const [syncingProvider, setSyncingProvider] = useState(null);

  const handleOpenSignIn = (provider) => {
    setSignInDialog({ open: true, provider });
    setFormData({});
    setError(null);
  };

  const handleCloseSignIn = () => {
    setSignInDialog({ open: false, provider: null });
    setFormData({});
    setError(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignIn = async () => {
    const provider = signInDialog.provider;
    if (!provider) return;

    setLoading(true);
    setError(null);

    try {
      // Simulate API call - in production, this would call actual OAuth/API endpoints
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Validate required fields
      const missingFields = provider.fields.filter(f => !formData[f]);
      if (missingFields.length > 0) {
        throw new Error(`Please fill in: ${missingFields.join(', ')}`);
      }

      // Save linked account
      if (onLinkAccount) {
        onLinkAccount(provider.id, {
          ...formData,
          linkedAt: new Date().toISOString(),
          deviceCount: Math.floor(Math.random() * 10) + 1, // Simulated
        });
      }

      handleCloseSignIn();
    } catch (err) {
      setError(err.message || 'Failed to connect account');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = (providerId) => {
    if (onUnlinkAccount) {
      onUnlinkAccount(providerId);
    }
  };

  const handleSync = async (providerId) => {
    setSyncingProvider(providerId);
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncingProvider(null);
  };

  const getFieldLabel = (field) => {
    const labels = {
      email: 'Email Address',
      password: 'Password',
      apiToken: 'API Token / Personal Access Token',
      accessId: 'Access ID',
      accessKey: 'Access Key / Secret',
      region: 'Region (us, eu, cn)',
      serverUrl: 'Server URL (http://homeassistant.local:8123)',
      longLivedToken: 'Long-Lived Access Token',
      hubIp: 'Hub IP Address',
      makerApiToken: 'Maker API Token',
      webhookKey: 'Webhook Key',
      bridgeIp: 'HomeKit Bridge IP',
      pin: 'Setup PIN (XXX-XX-XXX)',
    };
    return labels[field] || field;
  };

  const isFieldSecret = (field) => {
    return ['password', 'apiToken', 'accessKey', 'longLivedToken', 'makerApiToken', 'webhookKey', 'pin'].includes(field);
  };

  const linkedCount = Object.keys(linkedAccounts).length;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 340,
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            pt: '64px',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountCircleIcon sx={{ color: '#667eea', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
                Linked Accounts
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Info Banner */}
          <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'rgba(102, 126, 234, 0.15)', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <InfoIcon sx={{ fontSize: 18, color: '#667eea', mt: 0.3 }} />
              <Typography variant="caption" color="text.secondary">
                Sign in to import devices from cloud services. All data is stored locally — 
                your credentials are never shared. Perfect for local-first or mobile deployment.
              </Typography>
            </Box>
          </Paper>

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              icon={<LinkIcon />}
              label={`${linkedCount} Linked`}
              color="primary"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              icon={<DevicesIcon />}
              label={`${Object.values(linkedAccounts).reduce((sum, acc) => sum + (acc.deviceCount || 0), 0)} Devices`}
              color="secondary"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Account Providers List */}
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
            CLOUD SERVICES
          </Typography>
          
          <List sx={{ mx: -1 }}>
            {accountProviders.map((provider, index) => {
              const isLinked = linkedAccounts[provider.id];
              const isExpanded = expandedProvider === provider.id;
              const isSyncing = syncingProvider === provider.id;

              return (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ListItem 
                    disablePadding 
                    sx={{ 
                      mb: 0.5,
                      flexDirection: 'column',
                      alignItems: 'stretch',
                    }}
                  >
                    <ListItemButton
                      onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
                      sx={{
                        borderRadius: '12px',
                        border: isLinked ? `1px solid ${provider.color}40` : '1px solid transparent',
                        bgcolor: isLinked ? `${provider.color}10` : 'transparent',
                        '&:hover': {
                          background: `${provider.color}20`,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 48 }}>
                        <BrandLogo provider={provider} size={36} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                              {provider.name}
                            </Typography>
                            {isLinked && (
                              <Chip
                                label="Linked"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.65rem',
                                  bgcolor: provider.color,
                                  color: '#fff',
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          isLinked 
                            ? `${linkedAccounts[provider.id].deviceCount || 0} devices synced`
                            : provider.description
                        }
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </ListItemButton>

                    <Collapse in={isExpanded} timeout="auto">
                      <Box sx={{ px: 2, py: 1.5, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '0 0 12px 12px', mt: -0.5 }}>
                        {/* Features */}
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            IMPORTS:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {provider.features.map(feature => (
                              <Chip
                                key={feature}
                                label={feature}
                                size="small"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            ))}
                          </Box>
                        </Box>

                        {/* Actions */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {isLinked ? (
                            <>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={isSyncing ? null : <CloudSyncIcon />}
                                onClick={() => handleSync(provider.id)}
                                disabled={isSyncing}
                                sx={{ flex: 1, fontSize: '0.75rem' }}
                              >
                                {isSyncing ? 'Syncing...' : 'Sync Now'}
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<LinkOffIcon />}
                                onClick={() => handleUnlink(provider.id)}
                                sx={{ fontSize: '0.75rem' }}
                              >
                                Unlink
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<LinkIcon />}
                              onClick={() => handleOpenSignIn(provider)}
                              fullWidth
                              sx={{
                                background: `linear-gradient(135deg, ${provider.color} 0%, ${provider.color}CC 100%)`,
                                fontSize: '0.75rem',
                              }}
                            >
                              Sign In & Link
                            </Button>
                          )}
                        </Box>

                        {/* Linked info */}
                        {isLinked && linkedAccounts[provider.id].linkedAt && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Linked: {new Date(linkedAccounts[provider.id].linkedAt).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </ListItem>
                </motion.div>
              );
            })}
          </List>

          <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Local-first notice */}
          <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <SecurityIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Local-First Privacy
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              SmartHouse runs locally on your network. Cloud account linking is 
              optional and used only to import device lists. All control happens 
              directly to your devices without going through external servers.
            </Typography>
          </Paper>
        </Box>
      </Drawer>

      {/* Sign In Dialog */}
      <Dialog
        open={signInDialog.open}
        onClose={handleCloseSignIn}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          }
        }}
      >
        {signInDialog.provider && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BrandLogo provider={signInDialog.provider} size={48} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Connect {signInDialog.provider.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {signInDialog.provider.authType === 'oauth' && 'Sign in with your account credentials'}
                    {signInDialog.provider.authType === 'token' && 'Enter your API token to connect'}
                    {signInDialog.provider.authType === 'api' && 'Enter your API credentials'}
                    {signInDialog.provider.authType === 'local' && 'Configure local connection'}
                    {signInDialog.provider.authType === 'webhook' && 'Enter your webhook key'}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Alert severity="info" sx={{ mb: 3 }}>
                Your credentials are stored locally and encrypted. They are only used to 
                fetch your device list and are never shared with third parties.
              </Alert>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {signInDialog.provider.fields.map(field => (
                  <TextField
                    key={field}
                    label={getFieldLabel(field)}
                    type={isFieldSecret(field) ? 'password' : 'text'}
                    value={formData[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                    required
                  />
                ))}
              </Box>

              {/* Features preview */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  This will import:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {signInDialog.provider.features.map(feature => (
                    <Chip
                      key={feature}
                      label={feature}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleCloseSignIn} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSignIn}
                disabled={loading}
                startIcon={loading ? null : <LinkIcon />}
                sx={{
                  background: `linear-gradient(135deg, ${signInDialog.provider.color} 0%, ${signInDialog.provider.color}CC 100%)`,
                }}
              >
                {loading ? 'Connecting...' : 'Connect Account'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default AccountsPanel;
