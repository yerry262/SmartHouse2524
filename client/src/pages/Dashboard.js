import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  CircularProgress,
  Menu,
  MenuItem,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SearchIcon from '@mui/icons-material/Search';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import SortIcon from '@mui/icons-material/Sort';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import { motion } from 'framer-motion';
import axios from 'axios';
import DeviceCard from '../components/DeviceCard';
import DeviceStats from '../components/DeviceStats';
import QuickActions from '../components/QuickActions';
import ActivityLog from '../components/ActivityLog';
import SubnetScanDialog from '../components/SubnetScanDialog';

const Dashboard = ({ devices, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [sortAnchor, setSortAnchor] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const handleClearDevices = async () => {
    try {
      await axios.delete('/api/devices/clear');
      onRefresh();
    } catch (error) {
      console.error('Error clearing devices:', error);
    }
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      await axios.post('/api/devices/discover');
      setTimeout(() => {
        onRefresh();
        setDiscovering(false);
      }, 5000);
    } catch (error) {
      console.error('Error discovering devices:', error);
      setDiscovering(false);
    }
  };

  const handleNetworkScan = () => {
    setScanDialogOpen(true);
  };

  const filteredDevices = devices.filter(device => {
    const name = device.name || '';
    const type = device.type || '';
    const ip = device.ip || '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ip.includes(searchQuery)
    );
  });

  // Sort devices based on selected criteria
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    switch (sortBy) {
      case 'status':
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
        return 0;
      case 'ip':
        const aIP = a.ip ? a.ip.split('.').map(n => parseInt(n)).reduce((acc, n) => acc * 256 + n, 0) : 0;
        const bIP = b.ip ? b.ip.split('.').map(n => parseInt(n)).reduce((acc, n) => acc * 256 + n, 0) : 0;
        return aIP - bIP;
      case 'type':
        return (a.type || '').localeCompare(b.type || '');
      case 'name':
      default:
        return (a.name || '').localeCompare(b.name || '');
    }
  });

  const handleSortClick = (event) => {
    setSortAnchor(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchor(null);
  };

  const handleSortSelect = (criteria) => {
    setSortBy(criteria);
    handleSortClose();
  };

  return (
    <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, pt: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
        {/* Device Stats */}
        <DeviceStats devices={devices} />

        {/* Quick Actions and Scenes */}
        <QuickActions />

        {/* Activity Log and Search */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Box sx={{ 
              mb: 3, 
              display: 'flex', 
              gap: 2, 
              flexWrap: 'wrap', 
              alignItems: 'center',
              background: 'rgba(30, 35, 50, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              p: 2,
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <TextField
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ flexGrow: 1 }}
              />
              <IconButton 
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                sx={{ border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
              >
                {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
              </IconButton>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={handleClearDevices}
                sx={{ textTransform: 'none', borderColor: 'rgba(244, 67, 54, 0.5)' }}
              >
                Clear All
              </Button>
              <Button
                variant="contained"
                onClick={handleDiscover}
                disabled={discovering}
                sx={{
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                {discovering ? 'Discovering...' : 'Discover'}
              </Button>
              <Button
                variant="contained"
                startIcon={<NetworkCheckIcon />}
                onClick={handleNetworkScan}
                sx={{ textTransform: 'none', background: 'rgba(255,255,255,0.1)' }}
              >
                Network Scan
              </Button>
              <Button
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={handleSortClick}
                sx={{ textTransform: 'none', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
              >
                Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              </Button>
              <Menu
                anchorEl={sortAnchor}
                open={Boolean(sortAnchor)}
                onClose={handleSortClose}
              >
                <MenuItem onClick={() => handleSortSelect('name')}>Name</MenuItem>
                <MenuItem onClick={() => handleSortSelect('type')}>Type</MenuItem>
                <MenuItem onClick={() => handleSortSelect('ip')}>IP Address</MenuItem>
                <MenuItem onClick={() => handleSortSelect('status')}>Status</MenuItem>
              </Menu>
            </Box>

            {/* Device Grid/List */}
            {viewMode === 'grid' ? (
              <Grid container spacing={3}>
                {sortedDevices.length === 0 ? (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="h6" color="text.secondary">
                          No devices found. Click "Discover" to scan your network.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ) : (
                  sortedDevices.map((device, index) => (
                    <Grid item xs={12} sm={6} md={6} lg={4} key={device.id || index}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <DeviceCard device={device} onRefresh={onRefresh} />
                      </motion.div>
                    </Grid>
                  ))
                )}
              </Grid>
            ) : (
              <Box>
                {sortedDevices.length === 0 ? (
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="h6" color="text.secondary">
                        No devices found. Click "Discover" to scan your network.
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  sortedDevices.map((device, index) => (
                    <motion.div
                      key={device.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Card 
                        sx={{ 
                          mb: 2,
                          opacity: device.status === 'offline' ? 0.6 : 1,
                          '&:hover': { boxShadow: 3 }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {device.name}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                                <Typography variant="body2" color="text.secondary">
                                  IP: {device.ip}
                                </Typography>
                                {device.mac && (
                                  <Typography variant="body2" color="text.secondary">
                                    MAC: {device.mac}
                                  </Typography>
                                )}
                                {device.vendor && device.vendor !== 'Unknown' && (
                                  <Typography variant="body2" color="text.secondary">
                                    Vendor: {device.vendor}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip
                                label={device.status}
                                color={device.status === 'online' ? 'success' : 'error'}
                                size="small"
                              />
                              <Chip label={device.type} size="small" variant="outlined" />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </Box>
            )}
          </Grid>

          {/* Activity Log Sidebar */}
          <Grid item xs={12} md={4}>
            <ActivityLog />
          </Grid>
        </Grid>
      </motion.div>

      <SubnetScanDialog 
        open={scanDialogOpen} 
        onClose={() => setScanDialogOpen(false)} 
        onDevicesFound={onRefresh} 
      />
    </Container>
  );
};

export default Dashboard;
