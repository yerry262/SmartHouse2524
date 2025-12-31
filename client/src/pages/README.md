# SmartHouse2524 - Pages Documentation

This directory contains all the page components for the SmartHouse2524 smart home control dashboard.

## Overview

Each page represents either a dashboard view or a dedicated control interface for specific smart device types.

---

## Core Pages

### Dashboard.js
The main home page showing all discovered devices with quick status overview and navigation.

### DeviceDetails.js
A detailed device view that opens when clicking on any device. Provides:
- Device information (IP, port, last seen, metadata)
- Device-specific controls based on type
- Real-time status updates for supported devices

---

## Components with API Integration

### DeviceCard.js (`../components/DeviceCard.js`)
The device card component displayed on the Dashboard automatically fetches **friendly names** from device APIs for supported device types.

#### How It Works:
When a DeviceCard mounts, it checks the device type and fetches the friendly name from the appropriate API:

| Device Type | API Endpoint | Name Source |
|-------------|--------------|-------------|
| `appletv` | `/api/appletv/:ip/status` | `device.name` (e.g., "Game Room") |
| `sonos` | `/api/sonos/:ip/status` | `device.name` (e.g., "Family Room") |

#### Before vs After:
| Raw Name (from SSDP/scan) | Friendly Name (from API) |
|---------------------------|--------------------------|
| `Apple TV (25)` | `Game Room` |
| `Apple TV (33)` | `Living Room` |
| `Linux UPnP/1.0 Sonos/57.22-71190 (ZPS9)` | `Family Room` |

#### Implementation:
```javascript
useEffect(() => {
  const fetchFriendlyName = async () => {
    if (device.type === 'appletv') {
      const res = await axios.get(`/api/appletv/${ip}/status`);
      setFriendlyName(res.data.device?.name);
      setDeviceModel(res.data.device?.model);
    } else if (device.type === 'sonos') {
      const res = await axios.get(`/api/sonos/${ip}/status`);
      setFriendlyName(res.data.device?.name);
    }
  };
  fetchFriendlyName();
}, [device]);
```

---

## Device-Specific Pages

### SonosPage.js
**Sonos Speaker Control** - Full control interface for Sonos speakers.

#### Features:
- **Device Discovery**: Automatically discovers Sonos speakers on the network via SSDP
- **Now Playing**: Shows current track with album art, title, artist, and album
- **Playback Controls**: Play, pause, stop, next, previous
- **Volume Control**: Slider with real-time volume adjustment
- **Progress Bar**: Visual track progress with auto-refresh
- **Favorites**: Access and play Sonos favorites
- **Zone/Group Management**: View grouped speakers

#### API Endpoints Used:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sonos/discover` | GET | Discover all Sonos devices with room names |
| `/api/sonos/:ip/status` | GET | Get current playback status, track info, device info |
| `/api/sonos/:ip/position` | GET | Get current track position/duration |
| `/api/sonos/:ip/play` | POST | Start playback |
| `/api/sonos/:ip/pause` | POST | Pause playback |
| `/api/sonos/:ip/stop` | POST | Stop playback |
| `/api/sonos/:ip/next` | POST | Skip to next track |
| `/api/sonos/:ip/previous` | POST | Go to previous track |
| `/api/sonos/:ip/volume` | POST | Set volume (body: `{ level: 0-100 }`) |
| `/api/sonos/:ip/favorites` | GET | Get Sonos favorites list |
| `/api/sonos/:ip/favorite/:id` | POST | Play a specific favorite |
| `/api/sonos/zones/all` | GET | Get all zone/group information |

#### Sonos API Response Examples:

**Status Response** (`/api/sonos/:ip/status`):
```json
{
  "ip": "192.168.4.53",
  "volume": 23,
  "state": "playing",
  "track": {
    "title": "Paper Cuts",
    "artist": "Łaszewo",
    "album": "In Color",
    "duration": 218,
    "position": 54,
    "albumArtURI": "https://i.scdn.co/image/..."
  },
  "device": {
    "name": "Family Room",
    "model": "Sonos Playbar",
    "softwareVersion": "57.22-71190",
    "serialNumber": "00-0E-58-B3-3F-2E:2"
  },
  "timestamp": "2025-12-31T16:17:11.575Z"
}
```

#### DeviceDetails Integration:
When clicking a Sonos device from the Dashboard, the DeviceDetails page shows:
- Friendly device name (e.g., "Family Room (Sonos Playbar)" instead of raw SSDP data)
- Now Playing card with album art and track info
- Playback controls (previous, play/pause, stop, next)
- Volume slider
- Speaker info (room name, model, software version)
- Auto-refresh every 3 seconds for live updates

---

### WemoPage.js
**Belkin WeMo Smart Plug Control**

#### Features:
- Device discovery via SSDP
- Power on/off toggle
- Real-time state display
- Friendly device names from API

#### API Endpoints:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wemo/discover` | GET | Discover WeMo devices |
| `/api/wemo/:ip/info` | GET | Get device info and state |
| `/api/wemo/:ip/power` | POST | Toggle power (body: `{ state: true/false }`) |

---

### TpLinkPage.js
**TP-Link Smart Device Control** (Kasa devices)

#### Features:
- Device discovery
- Power control
- Energy monitoring (for compatible devices)

---

### HuePage.js
**Philips Hue Light Control**

#### Features:
- Bridge discovery and pairing
- Light on/off control
- Brightness adjustment
- Color/temperature control

---

### SamsungPage.js
**Samsung Smart TV Control**

#### Features:
- TV discovery via SSDP
- Remote control commands
- Power state detection

---

### LGPage.js
**LG TV Control**

#### Features:
- WebOS TV discovery
- Remote control interface
- App launching

---

### Other Device Pages:
- **AlexaPage.js** - Amazon Alexa devices
- **AppleTVPage.js** - Apple TV control
- **AuroraPage.js** - Nanoleaf Aurora lights
- **CamerasPage.js** - IP Camera feeds
- **EeroPage.js** - Eero mesh router info
- **EpsonPage.js** - Epson projector/printer control
- **GEAppliancesPage.js** - GE smart appliances
- **GoogleHomePage.js** - Google Cast devices
- **LIFXPage.js** - LIFX smart lights
- **MiioPage.js** - Xiaomi Mi devices
- **NanoleafPage.js** - Nanoleaf panels
- **RingPage.js** - Ring doorbell/cameras
- **SamsungAppliancesPage.js** - Samsung smart appliances
- **SamsungWasherPage.js** - Samsung washer/dryer
- **SmartThingsPage.js** - SmartThings hub integration
- **WyzePage.js** - Wyze cameras and devices

---

## Apple TV Integration

### Requirements
- **pyatv** Python package: `pip install pyatv`
- Apple TV must be on the same network

### API Endpoints:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/appletv/devices` | GET | List all discovered Apple TVs |
| `/api/appletv/:ip/status` | GET | Get device info, name, and playing status |
| `/api/appletv/discover` | POST | Trigger Apple TV discovery |

### Status Response Example (`/api/appletv/:ip/status`):
```json
{
  "ip": "192.168.4.25",
  "device": {
    "name": "Game Room",
    "model": "Apple TV 4K, tvOS 26.1",
    "mac": "42:93:06:84:6F:F1"
  },
  "playing": "  Media type: Unknown\r\nDevice state: Idle\r\n",
  "online": true,
  "timestamp": "2025-12-31T16:28:31.026Z"
}
```

### How Discovery Works:
1. Uses `atvremote scan` command from pyatv
2. Parses output to extract device name, model, IP, and MAC
3. Filters to only include actual Apple TV devices (excludes Macs, speakers)

---

## Adding New Device Support

To add support for a new device type:

1. **Create Backend Route** (`server/routes/newdevice.js`):
   ```javascript
   const express = require('express');
   const router = express.Router();
   
   router.get('/discover', async (req, res) => {
     // Discovery logic
   });
   
   router.get('/:ip/status', async (req, res) => {
     // Get device status
   });
   
   module.exports = router;
   ```

2. **Register Route** in `server/index.js`:
   ```javascript
   const newdeviceRoutes = require('./routes/newdevice');
   app.use('/api/newdevice', newdeviceRoutes);
   ```

3. **Create Frontend Page** (`client/src/pages/NewDevicePage.js`):
   - Import React and Material-UI components
   - Implement discovery and control UI
   - Use axios for API calls

4. **Add to DeviceDetails.js** (optional):
   - Add device-type detection
   - Add specific controls section

5. **Add Navigation** in `client/src/App.js`:
   ```javascript
   <Route path="/newdevice" element={<NewDevicePage />} />
   ```

6. **Add Test API Button** (see section below)

---

## Test API Feature

Each device page includes a **Test API** button that allows developers and users to directly test the backend API and view the raw JSON response. This is useful for debugging, development, and understanding what data is available from each device.

### How It Works

1. **Test API Button**: Calls the device's status or discovery endpoint
2. **API Response Box**: Displays the raw JSON response with syntax highlighting
3. **Timestamp**: Shows when the API was last called
4. **Loading State**: Shows a spinner while the API call is in progress

### Implementation Pattern

To add the Test API feature to a new device page:

#### 1. Add State Variables
```javascript
// API Test state
const [apiTestResult, setApiTestResult] = useState(null);
const [apiTestLoading, setApiTestLoading] = useState(false);
const [apiTestTimestamp, setApiTestTimestamp] = useState(null);
```

#### 2. Add the Handler Function
```javascript
const handleTestApi = async () => {
  setApiTestLoading(true);
  try {
    // For device-specific status (when a device is selected):
    const response = await axios.get(`/api/yourdevice/${selectedDevice}/status`);
    // OR for discovery (when no device selected):
    // const response = await axios.get('/api/yourdevice/discover');
    
    setApiTestResult(response.data);
    setApiTestTimestamp(new Date().toLocaleString());
  } catch (err) {
    setApiTestResult({ 
      error: err.message || 'API request failed',
      status: err.response?.status 
    });
    setApiTestTimestamp(new Date().toLocaleString());
  }
  setApiTestLoading(false);
};
```

#### 3. Add the UI Components
```jsx
import ApiIcon from '@mui/icons-material/Api';

{/* API Test Section */}
<Paper sx={{ p: 2, mt: 2 }}>
  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
    <ApiIcon sx={{ mr: 1 }} /> API Response
  </Typography>
  <Button
    variant="outlined"
    size="small"
    onClick={handleTestApi}
    disabled={apiTestLoading}
    sx={{ mb: 1 }}
  >
    {apiTestLoading ? <CircularProgress size={16} color="inherit" /> : 'Test API'}
  </Button>
  {apiTestTimestamp && (
    <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
      Last tested: {apiTestTimestamp}
    </Typography>
  )}
  
  {apiTestResult ? (
    <Box sx={{ mt: 1 }}>
      {apiTestResult.error ? (
        <Alert severity="error">{apiTestResult.error}</Alert>
      ) : (
        <Box sx={{ 
          bgcolor: 'grey.900', 
          p: 1, 
          borderRadius: 1, 
          maxHeight: 300, 
          overflow: 'auto' 
        }}>
          <pre style={{ margin: 0, fontSize: 12 }}>
            {JSON.stringify(apiTestResult, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  ) : (
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      Click "Test API" to fetch device data
    </Typography>
  )}
</Paper>
```

### Pages with Test API Feature

The following pages have the Test API feature implemented:

| Page | API Endpoint Tested |
|------|---------------------|
| AlexaPage.js | `/api/alexa/devices` |
| AppleTVPage.js | `/api/appletv/:ip/status` |
| EeroPage.js | `/api/eero/network` |
| EpsonPage.js | `/api/epson/discover` |
| HuePage.js | `/api/hue/bridges` or `/api/hue/:bridgeId/lights` |
| LGPage.js | `/api/lg/discover` |
| LIFXPage.js | `/api/lifx/discover` |
| NanoleafPage.js | `/api/nanoleaf/:ip/state` or `/api/nanoleaf/discover` |
| RingPage.js | `/api/ring/devices` |
| SamsungPage.js | `/api/samsung/:ip/status` |
| SmartThingsPage.js | `/api/smartthings/discover` |
| SonosPage.js | `/api/sonos/:ip/status` |
| TpLinkPage.js | `/api/tplink/discover` |
| WemoPage.js | `/api/wemo/status/all` |
| DeviceDetails.js | Dynamic based on device type |

### DeviceDetails.js API Routing

The DeviceDetails component dynamically selects the API endpoint based on device type:

```javascript
const handleTestApi = async () => {
  let endpoint = '';
  if (device.type === 'appletv') {
    endpoint = `/api/appletv/${ip}/status`;
  } else if (device.type === 'sonos') {
    endpoint = `/api/sonos/${ip}/status`;
  } else if (device.type === 'wemo-plug') {
    endpoint = '/api/wemo/status/all';  // Uses discovery since WeMo needs device in cache
  } else if (device.type === 'hue-bridge') {
    endpoint = `/api/hue/${ip}/lights`;
  }
  // ... etc
};
```

### WeMo Special Handling

WeMo devices require special handling because the `wemo-client` package uses a discovery cache. Individual device endpoints (`/api/wemo/:ip/info`) return 404 if the device hasn't been discovered yet.

**Solution**: DeviceDetails.js calls `/api/wemo/status/all` and filters for the specific device:

```javascript
if (device.type === 'wemo-plug' && res.data.devices) {
  const wemoDevice = res.data.devices.find(d => d.host === ip);
  if (wemoDevice) {
    setApiTestResult(wemoDevice);
  } else {
    setApiTestResult({ 
      message: 'Device not found in WeMo discovery. Try running discovery first.',
      allDevices: res.data.devices.map(d => ({ host: d.host, name: d.friendlyName }))
    });
  }
}
```

---

## Development Notes

### Dynamic API URLs
All API calls use relative URLs (e.g., `/api/sonos/...`) which are proxied to the backend via the `proxy` setting in `client/package.json`.

### Real-time Updates
Devices that support real-time status (Sonos, WeMo) use `setInterval` for auto-refresh. The refresh interval is typically 3-5 seconds.

### Error Handling
All API calls should include proper error handling with user-friendly error messages displayed via Material-UI Alert components.

---

## Troubleshooting

### Sonos Not Showing Playback Info
- Ensure the speaker is the coordinator (not a slave in a group)
- Check that the backend server is running on port 5000
- Verify network connectivity to the Sonos speaker

### Device Discovery Issues
- Ensure devices are on the same network/subnet
- Check firewall settings (ports 1400 for Sonos, etc.)
- Try running a subnet scan from the dashboard

---

*Last Updated: December 31, 2025*
