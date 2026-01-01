import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Chip, Badge, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = ({ toggleSidebar, toggleAccountsPanel, wsConnected, linkedAccountsCount = 0 }) => {
  const navigate = useNavigate();

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'rgba(26, 26, 46, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <HomeIcon sx={{ mr: 1, fontSize: 28, color: '#667eea' }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            SmartHouse 2524
          </Typography>
        </motion.div>

        <Box sx={{ flexGrow: 1 }} />

        <Chip
          icon={wsConnected ? <WifiIcon /> : <WifiOffIcon />}
          label={wsConnected ? 'Connected' : 'Disconnected'}
          color={wsConnected ? 'success' : 'error'}
          size="small"
          sx={{ fontWeight: 600, mr: 2 }}
        />

        {/* Account / Cloud Sync Button */}
        <Tooltip title={linkedAccountsCount > 0 ? `${linkedAccountsCount} accounts linked` : 'Link cloud accounts'}>
          <IconButton
            color="inherit"
            onClick={toggleAccountsPanel}
            sx={{
              background: linkedAccountsCount > 0 ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.3)',
              },
            }}
          >
            <Badge 
              badgeContent={linkedAccountsCount} 
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.65rem',
                  height: 16,
                  minWidth: 16,
                }
              }}
            >
              {linkedAccountsCount > 0 ? <CloudSyncIcon sx={{ color: '#667eea' }} /> : <AccountCircleIcon />}
            </Badge>
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
