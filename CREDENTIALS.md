# SmartHouse 2524 - Required Credentials & Commands

## 🔑 Credentials Checklist

### ✅ No Credentials Required
- [x] Sonos Speakers/Amps - Auto-discovered
- [x] Samsung Smart TVs - Auto-discovered
- [x] IP Cameras - Can add via UI

### ⚠️ Credentials Required

#### 🍳 GE SmartHQ Appliances
```env
GE_USERNAME=your_ge_email@example.com
GE_PASSWORD=your_ge_password
```

#### 🏠 Samsung SmartThings Appliances
```env
SAMSUNG_SMARTTHINGS_TOKEN=your_smartthings_personal_access_token
```

#### 🧺 Samsung Smart Washer
```env
SMARTTHINGS_TOKEN=your_smartthings_personal_access_token
```

**Obtaining Token:**
1. Go to [SmartThings Developer Portal](https://account.smartthings.com/tokens)
2. Sign in with your Samsung account
3. Click "Create new token"
4. Name: "SmartHouse 2524"
5. Select permissions: "Devices (read/write)"
6. Copy the generated token
7. Add to your .env file

**Testing:**
```powershell
# Test SmartThings API connection
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.smartthings.com/v1/devices
```

---

#### 🔔 Ring Doorbell
```env
RING_EMAIL=your_ring_email@example.com
RING_PASSWORD=your_ring_password
```

**Obtaining Credentials:**
1. Use your existing Ring account credentials
2. Enable 2FA in Ring app (recommended)
3. On first connection, you may need to provide 2FA code

**Testing:**
```powershell
# Test Ring API connection
curl http://localhost:5000/api/ring/devices
```

---

#### 🔵 Eero Network
```env
EERO_EMAIL=your_eero_email@example.com
EERO_PASSWORD=your_eero_password
```

**Important:** Eero doesn't have an official public API.

**Options:**
1. Use `eero-client` npm package (reverse-engineered)
2. Use Eero mobile app API endpoints
3. Community libraries may break with updates

**Installation (if using eero-client):**
```powershell
npm install eero-client
```

---

#### 🍳 GE SmartHQ Appliances
```env
GE_USERNAME=your_ge_email@example.com
GE_PASSWORD=your_ge_password
```

**Obtaining Credentials:**
1. Use your existing GE SmartHQ account credentials
2. If you don't have an account, download GE SmartHQ app and create one
3. Register your GE appliances in the app first
4. Use the same credentials in .env file

**Testing:**
```powershell
# Test GE API connection
curl http://localhost:5000/api/ge-appliances/appliances
```

**Supported Appliances:**
- GE Profile & Cafe Refrigerators
- GE Smart Ovens & Ranges
- GE Dishwashers
- GE Washers & Dryers

---

#### 🏠 Samsung SmartThings Appliances
```env
SAMSUNG_SMARTTHINGS_TOKEN=your_smartthings_personal_access_token
```

**Note:** This is the same token used for Samsung Smart Washer. If you already have `SMARTTHINGS_TOKEN` set, the Samsung Appliances integration will use it automatically.

**Obtaining Token:**
1. Go to [SmartThings Developer Portal](https://account.smartthings.com/tokens)
2. Sign in with your Samsung account
3. Click "Create new token"
4. Name: "SmartHouse 2524"
5. Select permissions: "Devices (read/write)"
6. Copy the generated token
7. Add to your .env file

**Testing:**
```powershell
# Test SmartThings Appliances API
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.smartthings.com/v1/devices
```

**Supported Appliances:**
- Samsung Family Hub Refrigerators
- Samsung Smart Refrigerators
- Samsung Smart Ovens
- Samsung Smart Washers & Dryers

---

#### 📺 Apple TV
```env
APPLE_TV_IPS=192.168.1.100,192.168.1.101
```

**Prerequisites:**
```powershell
# 1. Install Python 3
# Download from: https://www.python.org/downloads/

# 2. Install pyatv
pip install pyatv

# Verify installation
atvremote --version
```

**Pairing Process:**
```powershell
# 1. Scan for Apple TVs on network
atvremote scan

# 2. Pair with Apple TV (shows pairing code on TV)
atvremote --id <APPLE_TV_IP> pair

# 3. Enter the code shown on your TV screen

# 4. Test connection
atvremote --id <APPLE_TV_IP> playing
```

**Credentials File Location:**
- Windows: `C:\Users\<username>\.pyatv\credentials.txt`
- Mac/Linux: `~/.pyatv/credentials.txt`

---

## 📹 Camera Configuration

### Finding Your Camera's RTSP URL

**Common Formats by Brand:**

**Hikvision:**
```
rtsp://username:password@IP:554/Streaming/Channels/101
rtsp://username:password@IP:554/Streaming/Channels/102  (substream)
```

**Dahua/Amcrest:**
```
rtsp://username:password@IP:554/cam/realmonitor?channel=1&subtype=0  (main)
rtsp://username:password@IP:554/cam/realmonitor?channel=1&subtype=1  (sub)
```

**Reolink:**
```
rtsp://username:password@IP:554/h264Preview_01_main
rtsp://username:password@IP:554/h264Preview_01_sub
```

**Axis:**
```
rtsp://username:password@IP:554/axis-media/media.amp
```

**Generic ONVIF:**
```
rtsp://username:password@IP:554/stream1
rtsp://username:password@IP:554/stream2
```

**Testing Camera URLs:**
```powershell
# Use VLC Media Player
# 1. Download VLC from https://www.videolan.org/
# 2. Open VLC → Media → Open Network Stream
# 3. Paste your RTSP URL
# 4. If it plays, the URL is correct!
```

---

## 🌐 Samsung TV App IDs

Common streaming apps you can launch:

```javascript
const SAMSUNG_APP_IDS = {
  'Netflix': '11101200001',
  'YouTube': '111299001912',
  'Prime Video': '3201512006785',
  'Disney+': '3201901017640',
  'Hulu': '3201601007625',
  'HBO Max': '3201601007230',
  'Spotify': '3201606009684',
  'Apple TV': '3201807016597',
  'Plex': '3201512006785',
};
```

**Finding More App IDs:**
```powershell
# Get all installed apps on your TV
curl http://localhost:5000/api/samsung/YOUR_TV_IP/apps
```

---

## 🔧 Required NPM Packages

All packages are already in package.json, but here's the list:

### Backend Dependencies
```json
{
  "express": "^4.18.2",           // Web server
  "cors": "^2.8.5",                // Cross-origin requests
  "dotenv": "^16.3.1",             // Environment variables
  "axios": "^1.6.2",               // HTTP requests
  "ws": "^8.14.2",                 // WebSocket server
  "node-ssdp": "^4.0.1",           // Device discovery (UPnP)
  "bonjour": "^3.5.0",             // mDNS discovery (Apple TV, Sonos)
  "node-sonos": "^1.15.0",         // Sonos control
  "ring-client-api": "^11.7.2",    // Ring integration
  "samsung-tv-control": "^1.3.1"   // Samsung TV control
}
```

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "@mui/material": "^5.14.20",     // Material-UI components
  "@mui/icons-material": "^5.14.19", // Material icons
  "framer-motion": "^10.16.16",    // Animations
  "recharts": "^2.10.3",           // Charts
  "axios": "^1.6.2"                // HTTP client
}
```

---

## 🚀 Useful Commands

### Installation
```powershell
# Install all dependencies (server + client)
npm run install-all

# Install server dependencies only
npm install

# Install client dependencies only
cd client
npm install
```

### Running
```powershell
# Start both server and client
npm start

# Start server only
npm run server

# Start client only
npm run client

# Build for production
npm run build
```

### Device Control
```powershell
# Discover all devices
curl -X POST http://localhost:5000/api/devices/discover

# Get all devices
curl http://localhost:5000/api/devices

# Control Sonos
curl -X POST http://localhost:5000/api/sonos/192.168.1.50/play
curl -X POST http://localhost:5000/api/sonos/192.168.1.50/pause
curl -X POST http://localhost:5000/api/sonos/192.168.1.50/volume -H "Content-Type: application/json" -d "{\"level\":50}"

# Control Samsung TV
curl -X POST http://localhost:5000/api/samsung/192.168.1.60/key -H "Content-Type: application/json" -d "{\"key\":\"KEY_VOLUP\"}"
```

### Network Tools
```powershell
# Find your IP address
ipconfig

# Find all devices on network
arp -a

# Test port connectivity
Test-NetConnection -ComputerName 192.168.1.50 -Port 554

# Scan network (requires nmap)
nmap -sn 192.168.1.0/24
```

---

## 📝 Environment Variables Reference

Complete .env template with all options:

```env
# =================================
# SERVER CONFIGURATION
# =================================
PORT=5000
NODE_ENV=development

# =================================
# NETWORK CONFIGURATION
# =================================
LOCAL_NETWORK_SUBNET=192.168.1.0/24
DISCOVERY_TIMEOUT=10000

# =================================
# EERO MESH NETWORK
# =================================
EERO_EMAIL=your_eero_email@example.com
EERO_PASSWORD=your_eero_password
EERO_VERIFICATION_CODE=your_2fa_code

# =================================
# RING DOORBELL & CAMERAS
# =================================
RING_EMAIL=your_ring_email@example.com
RING_PASSWORD=your_ring_password
RING_2FA_CODE=your_2fa_code

# =================================
# SONOS SPEAKERS (Auto-discovered)
# =================================
SONOS_AUTO_DISCOVER=true

# =================================
# APPLE TV
# =================================
# Comma-separated list of Apple TV IP addresses
APPLE_TV_IPS=192.168.1.100,192.168.1.101

# =================================
# SAMSUNG SMART TVs (Auto-discovered)
# =================================
SAMSUNG_TV_AUTO_DISCOVER=true

# =================================
# IP CAMERAS
# =================================
# Comma-separated list of camera RTSP/HTTP URLs
CAMERA_URLS=rtsp://admin:password@192.168.1.50:554/stream1,rtsp://admin:password@192.168.1.51:554/stream1
CAMERA_USERNAME=admin
CAMERA_PASSWORD=your_camera_password

# =================================
# ADVANCED SETTINGS
# =================================
# WebSocket port (optional, defaults to same as PORT)
WS_PORT=5000

# Enable debug logging
DEBUG=true

# API rate limiting
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX=100    # requests per window
```

---

## 🔐 Security Best Practices

1. **Never commit .env to Git**
   ```powershell
   # Already in .gitignore, but verify:
   echo .env >> .gitignore
   ```

2. **Use strong passwords**
   - Different password for each service
   - Use a password manager

3. **Enable 2FA where available**
   - Ring account
   - Eero account

4. **Network security**
   - Keep devices on isolated VLAN if possible
   - Use WPA3 encryption on WiFi
   - Regularly update device firmware

5. **Server security**
   - Run on secure, private network only
   - Don't expose to public internet without proper authentication
   - Use HTTPS in production
   - Keep dependencies updated

---

## 📞 Getting Credentials

### Ring
- Website: https://ring.com/
- Login with existing account
- No special API access needed

### Eero
- Website: https://eero.com/
- Login with existing account
- Note: Uses unofficial API

### Camera Admin Password
- Usually found on camera label or in manual
- Default passwords often need to be changed on first use
- Check manufacturer's website for default credentials

### Samsung TV
- No credentials needed
- Accept connection prompt on TV first time

### Apple TV
- No account credentials needed
- Pairing is done via pyatv with PIN shown on TV

---

## ✅ Setup Verification Checklist

- [ ] Node.js installed (v16+)
- [ ] Python installed (for Apple TV)
- [ ] All npm packages installed
- [ ] .env file created and configured
- [ ] Apple TV paired (if applicable)
- [ ] Ring credentials added (if applicable)
- [ ] Camera URLs tested in VLC
- [ ] Server starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] WebSocket connects successfully
- [ ] Device discovery finds devices
- [ ] Can control at least one device

---

**🎉 Once everything is checked off, you're ready to go!**

For detailed instructions, see README.md and SETUP.md
