import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  Lightbulb,
  Power,
  Tv,
  Videocam,
  Speaker,
  TrendingUp,
  Outlet,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ClockCalendarCard from './ClockCalendarCard';

const DeviceStats = ({ devices }) => {
  const stats = [
    {
      title: 'Total Devices',
      value: devices.length,
      icon: <Power />,
      color: '#667eea',
      gradient: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
    },
    {
      title: 'Smart Plugs',
      value: devices.filter(d => 
        d.type?.toLowerCase().includes('plug') || 
        d.type?.toLowerCase().includes('outlet') ||
        d.type?.toLowerCase().includes('socket') ||
        (d.type?.toLowerCase().includes('wemo') && !d.model?.toLowerCase().includes('lightswitch')) ||
        (d.type?.toLowerCase().includes('tplink') && d.model?.toLowerCase().includes('plug'))
      ).length,
      icon: <Outlet />,
      color: '#76b900',
      gradient: 'linear-gradient(135deg, rgba(118, 185, 0, 0.2) 0%, rgba(76, 175, 80, 0.2) 100%)',
    },
    {
      title: 'Speakers',
      value: devices.filter(d => 
        d.type?.toLowerCase().includes('speaker') || 
        d.type?.toLowerCase().includes('sonos') ||
        d.type?.toLowerCase().includes('alexa') ||
        d.type?.toLowerCase().includes('google')
      ).length,
      icon: <Speaker />,
      color: '#fa709a',
      gradient: 'linear-gradient(135deg, rgba(250, 112, 154, 0.2) 0%, rgba(254, 225, 64, 0.2) 100%)',
    },
    {
      title: 'Lights',
      value: devices.filter(d => 
        d.type?.toLowerCase().includes('light') || 
        d.type?.toLowerCase().includes('bulb') ||
        d.type?.toLowerCase().includes('hue') ||
        d.type?.toLowerCase().includes('lifx') ||
        d.type?.toLowerCase().includes('nanoleaf') ||
        (d.type?.toLowerCase().includes('wemo') && d.model?.toLowerCase().includes('lightswitch'))
      ).length,
      icon: <Lightbulb />,
      color: '#f093fb',
      gradient: 'linear-gradient(135deg, rgba(240, 147, 251, 0.2) 0%, rgba(245, 87, 108, 0.2) 100%)',
    },
    {
      title: 'Displays',
      value: devices.filter(d => 
        d.type?.toLowerCase().includes('tv') || 
        d.type?.toLowerCase().includes('display')
      ).length,
      icon: <Tv />,
      color: '#4facfe',
      gradient: 'linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)',
    },
    {
      title: 'Cameras',
      value: devices.filter(d => 
        d.type?.toLowerCase().includes('camera') ||
        d.type?.toLowerCase().includes('doorbell')
      ).length,
      icon: <Videocam />,
      color: '#43e97b',
      gradient: 'linear-gradient(135deg, rgba(67, 233, 123, 0.2) 0%, rgba(56, 249, 215, 0.2) 100%)',
    },
    {
      title: 'Online',
      value: devices.filter(d => d.online !== false).length,
      icon: <TrendingUp />,
      color: '#30cfd0',
      gradient: 'linear-gradient(135deg, rgba(48, 207, 208, 0.2) 0%, rgba(51, 8, 103, 0.2) 100%)',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={4} lg={3}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          style={{ height: '100%' }}
        >
          <ClockCalendarCard />
        </motion.div>
      </Grid>
      <Grid item xs={12} md={8} lg={9}>
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={stat.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 1) * 0.1 }}
              >
                <Card
                  sx={{
                background: stat.gradient,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  transition: 'transform 0.3s ease',
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      {stat.title}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    >
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {React.cloneElement(stat.icon, {
                      sx: { fontSize: 28, color: '#fff' },
                    })}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      ))}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default DeviceStats;
