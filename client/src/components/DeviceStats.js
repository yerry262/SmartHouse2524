import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  Lightbulb,
  Power,
  Tv,
  Videocam,
  Speaker,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const DeviceStats = ({ devices }) => {
  const stats = [
    {
      title: 'Total Devices',
      value: devices.length,
      icon: <Power />,
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'Lights',
      value: devices.filter(d => 
        d.type?.toLowerCase().includes('light') || 
        d.type?.toLowerCase().includes('bulb') ||
        d.type?.toLowerCase().includes('hue')
      ).length,
      icon: <Lightbulb />,
      color: '#f093fb',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      title: 'Displays',
      value: devices.filter(d => 
        d.type?.toLowerCase().includes('tv') || 
        d.type?.toLowerCase().includes('display')
      ).length,
      icon: <Tv />,
      color: '#4facfe',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      title: 'Cameras',
      value: devices.filter(d => 
        d.type?.toLowerCase().includes('camera') ||
        d.type?.toLowerCase().includes('doorbell')
      ).length,
      icon: <Videocam />,
      color: '#43e97b',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
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
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
    {
      title: 'Online',
      value: devices.filter(d => d.online !== false).length,
      icon: <TrendingUp />,
      color: '#30cfd0',
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={4} lg={2} key={stat.title}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              sx={{
                background: stat.gradient,
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
  );
};

export default DeviceStats;
