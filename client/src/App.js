import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SonosPage from './pages/SonosPage';
import AppleTVPage from './pages/AppleTVPage';
import SamsungPage from './pages/SamsungPage';
import RingPage from './pages/RingPage';
import CamerasPage from './pages/CamerasPage';
import EeroPage from './pages/EeroPage';
import HuePage from './pages/HuePage';
import TpLinkPage from './pages/TpLinkPage';
import LGPage from './pages/LGPage';
import LIFXPage from './pages/LIFXPage';
import NanoleafPage from './pages/NanoleafPage';
import WyzePage from './pages/WyzePage';
import MiioPage from './pages/MiioPage';
import AlexaPage from './pages/AlexaPage';
import GoogleHomePage from './pages/GoogleHomePage';
import AuroraPage from './pages/AuroraPage';
import WemoPage from './pages/WemoPage';
import EpsonPage from './pages/EpsonPage';
import SamsungWasherPage from './pages/SamsungWasherPage';
import GEAppliancesPage from './pages/GEAppliancesPage';
import SamsungAppliancesPage from './pages/SamsungAppliancesPage';
import SmartThingsPage from './pages/SmartThingsPage';
import DeviceDetails from './pages/DeviceDetails';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#0f0f23',
      paper: '#1a1a2e',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [devices, setDevices] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    // WebSocket connection for real-time updates
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname;
    const wsPort = process.env.NODE_ENV === 'development' ? '5000' : window.location.port;
    const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message:', data);
      
      if (data.type === 'device_discovered' || data.type === 'device_updated') {
        fetchDevices();
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
    };

    fetchDevices();

    return () => {
      ws.close();
    };
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      const data = await response.json();
      setDevices(data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Navbar toggleSidebar={toggleSidebar} wsConnected={wsConnected} />
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} devices={devices} />
          
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              pt: '80px',
              px: { xs: 2, md: 4 },
              pb: 4,
              width: '100%',
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard devices={devices} onRefresh={fetchDevices} />} />
              <Route path="/sonos" element={<SonosPage />} />
              <Route path="/appletv" element={<AppleTVPage />} />
              <Route path="/samsung" element={<SamsungPage />} />
              <Route path="/lg" element={<LGPage />} />
              <Route path="/ring" element={<RingPage />} />
              <Route path="/cameras" element={<CamerasPage />} />
              <Route path="/eero" element={<EeroPage />} />
              <Route path="/hue" element={<HuePage />} />
              <Route path="/tplink" element={<TpLinkPage />} />
              <Route path="/lifx" element={<LIFXPage />} />
              <Route path="/nanoleaf" element={<NanoleafPage />} />
              <Route path="/wyze" element={<WyzePage />} />
              <Route path="/miio" element={<MiioPage />} />
              <Route path="/alexa" element={<AlexaPage />} />
              <Route path="/google-home" element={<GoogleHomePage />} />
              <Route path="/aurora" element={<AuroraPage />} />
              <Route path="/wemo" element={<WemoPage />} />
              <Route path="/epson" element={<EpsonPage />} />
              <Route path="/samsung-washer" element={<SamsungWasherPage />} />
              <Route path="/ge-appliances" element={<GEAppliancesPage />} />
              <Route path="/samsung-appliances" element={<SamsungAppliancesPage />} />
              <Route path="/smartthings" element={<SmartThingsPage />} />
              <Route path="/device/:id" element={<DeviceDetails />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
