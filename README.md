# SmartHouse 2524 - Smart Home Control System

A modern, full-stack smart home control system built with React.js and Node.js for managing and monitoring **Philips Hue lights**, **TP-Link Kasa devices**, **LIFX bulbs**, **Wyze devices**, **Xiaomi miIO devices**, Eero mesh networks, Sonos speakers/amps, Apple TVs, Samsung Smart TVs, LG webOS Smart TVs, Ring doorbells, security cameras, and more.

![Dashboard](https://img.shields.io/badge/Status-Active-green)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)

## 🚀 Features

- **📱 Modern UI**: Sleek, responsive interface with Material-UI and Framer Motion animations
- **🔄 Real-time Updates**: WebSocket connection for live device status updates
- **🔍 Device Discovery**: Automatic network scanning using SSDP and mDNS/Bonjour
- **💡 Philips Hue Control**: Full control of Hue lights, groups, rooms, and scenes
- **🔌 TP-Link Kasa**: Control smart plugs, bulbs, and light strips with energy monitoring
- **💡 LIFX Control**: Direct local control of LIFX smart bulbs and strips
- **📱 Wyze Devices**: Control Wyze cameras, bulbs, plugs, sensors, and thermostats
- **🤖 Xiaomi miIO**: Control Roborock robot vacuums and Xiaomi air purifiers
- **🎵 Sonos Control**: Play/pause, volume, track navigation for Sonos speakers and amps
- **📺 TV Control**: Remote control for Samsung Smart TVs, LG webOS TVs, and Apple TVs
- **🔔 Ring Integration**: Monitor Ring doorbells and cameras
- **📹 Camera Feeds**: View and manage security camera streams
- **🌐 Network Monitoring**: Eero mesh network status and connected devices
- **🔎 Subnet Scanner**: Angry IP Scanner-like port scanning and device identification
- **🎨 Beautiful Design**: Gradient backgrounds, glass morphism effects, and smooth transitions

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Python 3** (for Apple TV control via pyatv)
- **Git** (optional, for version control)

## 🛠️ Installation

### 1. Clone or Navigate to the Repository

```bash
cd c:\Users\jerry\Desktop\SmartHouse2524
```

### 2. Install Dependencies

Install both server and client dependencies:

```bash
npm run install-all
```

Or install them separately:

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Eero Configuration (Note: Requires unofficial API)
EERO_EMAIL=your_eero_email@example.com
EERO_PASSWORD=your_eero_password

# Ring Configuration
RING_EMAIL=your_ring_email@example.com
RING_PASSWORD=your_ring_password

# Wyze Configuration
WYZE_EMAIL=your_wyze_email@example.com
WYZE_PASSWORD=your_wyze_password

# Apple TV Configuration
APPLE_TV_IPS=192.168.1.100,192.168.1.101

# Camera Configuration (RTSP/HTTP URLs)
CAMERA_URLS=rtsp://admin:password@192.168.1.50:554/stream1

# Network Configuration
LOCAL_NETWORK_SUBNET=192.168.1.0/24
DISCOVERY_TIMEOUT=10000
```

### 4. Set Up Apple TV Control (Optional)

For Apple TV control, install `pyatv`:

```bash
pip install pyatv
```

Pair your Apple TV:

```bash
atvremote --id YOUR_APPLE_TV_IP pair
```

## 🚀 Running the Application

### Development Mode

Start both the backend server and React frontend:

```bash
npm start
```

This will:
- Start the Express server on `http://localhost:5000`
- Start the React dev server on `http://localhost:3000`
- Open your browser automatically

### Run Separately

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run client
```

### Production Build

Build the React frontend for production:

```bash
npm run build
```

## 📱 Device Setup & Credentials

### 🔵 Eero Mesh Network

**Status:** ⚠️ Requires unofficial API

Eero doesn't provide a public API. You'll need to:

1. Use a community library like `eero-client` (Node.js)
2. Configure email and password in `.env`
3. Handle session management and 2FA if enabled

**What You Can Control:**
- View network status
- See connected devices
- Monitor internet speed
- View Eero device locations

---

### 🎵 Sonos Speakers & Amps

**Status:** ✅ Ready to use

Sonos devices are discovered automatically on your local network using UPnP.

**Required:**
- Sonos devices on the same network
- No credentials needed

**What You Can Control:**
- Play/Pause/Stop/Skip tracks
- Volume control with real-time slider
- View current track information with album art
- Progress bar with position/duration
- Favorites playback
- Multi-room zone support

**Features:**
- **Now Playing / Last Played**: Shows current or last played track even when stopped
- **Bonded Device Detection**: Subs and Boosts marked as bonded
- **Auto-refresh**: Live status updates every 3 seconds
- **Speaker List**: Shows model, state chips, and color-coded status

**API Endpoints:**
- `GET /api/sonos/discover` - Discover Sonos devices (with state, model, bonded flag)
- `GET /api/sonos/:ip/status` - Full status with track info, device details
- `GET /api/sonos/:ip/position` - Get track position/duration
- `POST /api/sonos/:ip/play` - Start playback
- `POST /api/sonos/:ip/pause` - Pause playback
- `POST /api/sonos/:ip/stop` - Stop playback
- `POST /api/sonos/:ip/next` - Next track
- `POST /api/sonos/:ip/previous` - Previous track
- `POST /api/sonos/:ip/volume` - Set volume (body: `{ level: 0-100 }`)
- `GET /api/sonos/:ip/favorites` - Get favorites list
- `POST /api/sonos/:ip/favorite/:id` - Play a favorite
- `GET /api/sonos/zones/all` - Get all zone/group information

---

### 📺 Apple TV

**Status:** ⚠️ Requires pyatv

Apple TV control requires the `pyatv` Python library.

**Required:**
1. Install pyatv: `pip install pyatv`
2. Find your Apple TV IP address
3. Pair device: `atvremote --id YOUR_IP pair`
4. Add IP addresses to `.env` file

**What You Can Control:**
- Navigation (up, down, left, right, select)
- Play/Pause
- Home/Menu buttons
- App launching

**Commands:**
```bash
# Discover Apple TVs
atvremote scan

# Pair with Apple TV
atvremote --id YOUR_IP pair

# Test connection
atvremote --id YOUR_IP playing
```

---

### 📺 Samsung Smart TVs

**Status:** ✅ Ready to use

Samsung TVs are discovered via SSDP/UPnP.

**Required:**
- Samsung Smart TV (2016 or newer)
- TV and server on same network
- First connection requires accepting prompt on TV

**What You Can Control:**
- Power on/off
- Volume up/down/mute
- Launch apps (Netflix, YouTube, etc.)
- Navigation

**Common App IDs:**
- Netflix: `11101200001`
- YouTube: `111299001912`
- Prime Video: `3201512006785`
- Disney+: `3201901017640`

**API Endpoints:**
- `GET /api/samsung/discover` - Discover Samsung TVs
- `GET /api/samsung/:ip/status` - Get TV status
- `POST /api/samsung/:ip/key` - Send remote key
- `POST /api/samsung/:ip/app` - Launch app
- `GET /api/samsung/:ip/apps` - Get installed apps

---

### 🔔 Ring Doorbell & Cameras

**Status:** ⚠️ Requires credentials

**Required:**
1. Ring account email and password
2. Handle 2FA if enabled
3. Configure credentials in `.env`

**What You Can Control:**
- View live streams
- Access doorbell events
- Toggle motion detection
- View battery levels
- Access recorded videos

**Setup:**
```env
RING_EMAIL=your_email@example.com
RING_PASSWORD=your_password
```

**Note:** First connection may require 2FA verification.

**API Endpoints:**
- `GET /api/ring/devices` - Get all Ring devices
- `GET /api/ring/doorbell/:id/events` - Get doorbell events
- `GET /api/ring/camera/:id/stream` - Get stream URL
- `POST /api/ring/camera/:id/motion` - Toggle motion detection

---

### 📹 Security Cameras

**Status:** ✅ Ready to use

Supports RTSP and HTTP camera streams.

**Required:**
- Camera IP addresses
- RTSP or HTTP stream URLs
- Username/password (if required)

**Setup:**
```env
CAMERA_URLS=rtsp://admin:password@192.168.1.50:554/stream1,rtsp://admin:password@192.168.1.51:554/stream2
CAMERA_USERNAME=admin
CAMERA_PASSWORD=your_password
```

**Common RTSP Formats:**
- Generic: `rtsp://username:password@ip:554/stream1`
- Hikvision: `rtsp://username:password@ip:554/Streaming/Channels/101`
- Dahua: `rtsp://username:password@ip:554/cam/realmonitor?channel=1&subtype=0`
- Amcrest: `rtsp://username:password@ip:554/cam/realmonitor?channel=1&subtype=1`

**What You Can Do:**
- Add/remove cameras
- View live streams
- Capture snapshots
- PTZ control (if supported)

**API Endpoints:**
- `GET /api/cameras` - Get all cameras
- `GET /api/cameras/:id/stream` - Get stream URL
- `GET /api/cameras/:id/snapshot` - Get snapshot
- `POST /api/cameras/:id/ptz` - PTZ control
- `POST /api/cameras` - Add new camera
- `DELETE /api/cameras/:id` - Remove camera

---

### 🍳 GE SmartHQ Appliances

**Status:** ⚠️ Requires credentials

Control your GE smart appliances including refrigerators, ovens, dishwashers, and laundry machines.

**Required:**
1. GE SmartHQ account (create in GE SmartHQ mobile app)
2. GE appliances registered in the app
3. Configure credentials in `.env`

**What You Can Control:**
- **Refrigerators**: Set fridge/freezer temperature, turbo cooling, ice maker control
- **Ovens**: Remote preheat, temperature control
- **Dishwashers**: Monitor status and cycles
- **Laundry**: Monitor washers and dryers

**Setup:**
```env
GE_USERNAME=your_email@example.com
GE_PASSWORD=your_password
```

**Supported Models:**
- GE Profile Refrigerators
- GE Cafe Refrigerators
- GE Smart Ovens & Ranges
- GE Dishwashers
- GE Washers & Dryers

**Temperature Ranges:**
- Fridge: 33°F to 42°F (recommended: 37°F)
- Freezer: -6°F to 6°F (recommended: 0°F)

**API Endpoints:**
- `GET /api/ge-appliances/refrigerators` - Get all refrigerators
- `POST /api/ge-appliances/refrigerators/:id/temperature` - Set temperature
- `POST /api/ge-appliances/refrigerators/:id/icemaker` - Control ice maker
- `POST /api/ge-appliances/refrigerators/:id/turbo` - Enable turbo cooling
- `GET /api/ge-appliances/ovens` - Get all ovens
- `POST /api/ge-appliances/ovens/:id/control` - Control oven

---

### 🏠 Samsung SmartThings Appliances

**Status:** ⚠️ Requires SmartThings token

Control Samsung Family Hub refrigerators and other SmartThings-connected appliances.

**Required:**
1. Samsung SmartThings account
2. Appliances added to SmartThings app
3. Personal Access Token from SmartThings Developer Portal

**What You Can Control:**
- **Refrigerators**: Monitor temperature, door status
- **Ovens**: Monitor cooking status
- **Laundry**: Monitor wash/dry cycles

**Setup:**
```env
SAMSUNG_SMARTTHINGS_TOKEN=your_personal_access_token
```

**Getting Your Token:**
1. Go to https://account.smartthings.com/tokens
2. Sign in with Samsung account
3. Click "Generate new token"
4. Select "Devices" permissions (read/write)
5. Copy and save the token

**Supported Appliances:**
- Samsung Family Hub Refrigerators
- Samsung Smart Refrigerators
- Samsung Smart Ovens
- Samsung Smart Washers & Dryers

**API Endpoints:**
- `GET /api/samsung-appliances/refrigerators` - Get all refrigerators
- `POST /api/samsung-appliances/refrigerators/:id/temperature` - Set temperature
- `GET /api/samsung-appliances/devices` - Get all devices
- `POST /api/samsung-appliances/devices/:id/command` - Execute command

---

## 🌐 API Documentation

### Device Discovery

**Discover All Devices**
```
POST /api/devices/discover
```

**Get All Devices**
```
GET /api/devices
```

**Search Devices**
```
GET /api/devices/search/:query
```

**Get Device Details**
```
GET /api/devices/:id
```

**Remove Device**
```
DELETE /api/devices/:id
```

### WebSocket Events

Connect to `ws://localhost:5000` for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:5000');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle: device_discovered, device_updated, etc.
};
```

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Theme**: Easy on the eyes with customizable Material-UI theme
- **Gradient Backgrounds**: Modern purple/blue gradients throughout
- **Glass Morphism**: Frosted glass effects on cards and panels
- **Smooth Animations**: Framer Motion for fluid transitions
- **Real-time Status**: Live WebSocket updates with connection indicator
- **Sidebar Navigation**: Easy access to all device categories
- **Search & Filter**: Quick device search functionality

## 📁 Project Structure

```
SmartHouse2524/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # Reusable components
│       │   ├── Navbar.js
│       │   ├── Sidebar.js
│       │   └── DeviceCard.js
│       ├── pages/          # Page components
│       │   ├── Dashboard.js
│       │   ├── SonosPage.js
│       │   ├── AppleTVPage.js
│       │   ├── SamsungPage.js
│       │   ├── RingPage.js
│       │   ├── CamerasPage.js
│       │   ├── EeroPage.js
│       │   └── DeviceDetails.js
│       ├── App.js
│       └── index.js
├── server/                 # Node.js backend
│   ├── routes/             # API routes
│   │   ├── devices.js
│   │   ├── sonos.js
│   │   ├── appletv.js
│   │   ├── samsung.js
│   │   ├── ring.js
│   │   ├── cameras.js
│   │   └── eero.js
│   ├── services/           # Business logic
│   │   └── deviceDiscovery.js
│   ├── data/               # Stored device data
│   └── index.js            # Express server
├── .env                    # Environment variables
├── .env.example           # Example environment file
├── package.json           # Server dependencies
└── README.md              # This file
```

## 🔧 Troubleshooting

### Devices Not Discovered

1. **Check Network**: Ensure all devices are on the same network as the server
2. **Firewall**: Disable firewall temporarily to test
3. **Multicast**: Enable multicast/UPnP on your router
4. **Wait Time**: Discovery can take 10-15 seconds

### Samsung TV Not Connecting

1. **Accept Prompt**: First connection requires accepting on TV
2. **Token**: Save the token from first connection
3. **Port**: Ensure port 8002 is accessible

### Ring/Eero Not Working

1. **Credentials**: Double-check email/password in `.env`
2. **2FA**: Handle two-factor authentication
3. **API Access**: These require unofficial APIs which may change

### Camera Streams Not Loading

1. **RTSP Support**: Web browsers don't natively support RTSP
2. **Convert**: Use ffmpeg to convert RTSP to HLS or WebRTC
3. **VLC**: Test stream URLs in VLC first
## 📅 Recent Updates (December 31, 2025)

### 🆕 Test API Feature
Added a **Test API** button to all device pages that allows developers to:
- Test backend API endpoints directly from the UI
- View raw JSON responses with syntax highlighting
- Debug device connectivity and API responses
- See timestamps for when APIs were last called

**Pages with Test API:** AlexaPage, AppleTVPage, DeviceDetails, EeroPage, EpsonPage, HuePage, LGPage, LIFXPage, NanoleafPage, RingPage, SamsungPage, SmartThingsPage, SonosPage, TpLinkPage, WemoPage

### 🎵 Enhanced Sonos Integration
- **Now Playing / Last Played**: Shows "🎵 Now Playing" when a speaker is active, "⏸️ Last Played" when stopped (keeps showing last track info)
- **Bonded Device Detection**: Sonos Subs and Boosts are now marked as "🔗 Bonded" in the speaker list
- **Enhanced Speaker List**: Shows model name, playing state chip, and color-coded avatars
- **Real-time Status**: Auto-refresh for live playback updates, progress bar, album art

### 📊 Dynamic Sidebar Sorting
- Sidebar navigation menu now **sorts by device count** (most devices to least)
- Dashboard stays at top, device categories are sorted dynamically
- Each menu item shows accurate device count for its category
- Device type matching improved for accurate counts

### 🔧 Bug Fixes
- Fixed WeMo API 404 error in DeviceDetails (now uses `/api/wemo/status/all` with filtering)
- Fixed SmartThingsPage.js `handleTestApi` undefined error
- Removed hardcoded localhost IPs - WebSocket URLs now dynamic
- Added missing device type mappings for sidebar counts

### 📺 Apple TV Integration
- Added `/api/appletv/:ip/status` endpoint for device info
- Uses `pyatv` Python package for discovery and status
- Shows device name, model, MAC address, and playing status
- Friendly names displayed instead of raw device identifiers

### 📝 Documentation
- Added comprehensive [client/src/pages/README.md](client/src/pages/README.md) with:
  - Test API feature implementation guide
  - Code patterns for adding Test API to new pages
  - Table of all device pages and their API endpoints
  - WeMo special handling documentation
## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env` file to Git
2. **Network Security**: Run on a secure, private network
3. **HTTPS**: Use HTTPS in production
4. **Authentication**: Add user authentication for production use
5. **API Keys**: Rotate credentials regularly
6. **Firewall**: Configure firewall rules appropriately

## 🚀 Future Enhancements

- [ ] User authentication and authorization
- [ ] Device grouping and scenes
- [ ] Automation rules and scheduling
- [ ] Voice control integration (Alexa, Google Home)
- [ ] Mobile app (React Native)
- [ ] HomeKit integration
- [ ] Energy monitoring dashboard
- [ ] Device usage analytics
- [ ] Push notifications
- [ ] Multi-user support

## 📝 License

This project is for personal use. Ensure you comply with the terms of service for all integrated APIs and services.

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📧 Support

For issues or questions, please create an issue in the repository or contact the system administrator.

---

**Built with ❤️ for SmartHouse 2524**
