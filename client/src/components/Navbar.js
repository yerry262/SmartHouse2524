import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Chip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = ({ toggleSidebar, wsConnected }) => {
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
          sx={{ fontWeight: 600 }}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
