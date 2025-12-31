# SmartHouse 2524 - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies

```powershell
# Navigate to project directory
cd c:\Users\jerry\Desktop\SmartHouse2524

# Install all dependencies
npm run install-all
```

### 2. Configure Environment

```powershell
# Copy example environment file
copy .env.example .env

# Edit .env with your text editor
notepad .env
```

**Minimum Configuration:**
```env
PORT=5000
NODE_ENV=development
LOCAL_NETWORK_SUBNET=192.168.1.0/24
```

### 3. Run the Application

```powershell
npm start
```

The application will open at `http://localhost:3000`

---

## 📋 Device-Specific Setup

### ✅ Quick Setup (No Credentials Needed)

These devices work automatically:

#### 🎵 Sonos Speakers
- **Status**: Works automatically
- **Setup**: None required, auto-discovered
- **Test**: Go to Sonos page → Click "Discover"

#### 📺 Samsung TVs
- **Status**: Works automatically
- **Setup**: Accept connection on TV first time
- **Test**: Go to Samsung page → Select TV → Send command

#### 📹 IP Cameras
- **Status**: Works automatically
- **Setup**: Add camera URLs in the app or .env
- **Test**: Go to Cameras page → Click "Add Camera"

---

### ⚠️ Requires Credentials

#### 🔔 Ring Doorbell

**Add to .env:**
```env
RING_EMAIL=your_email@example.com
RING_PASSWORD=your_password
```

**2FA Setup:**
- First login may require 2FA code
- Check server console for instructions

---

#### 🔵 Eero Network

**Status:** Requires unofficial API library

**Add to .env:**
```env
EERO_EMAIL=your_email@example.com
EERO_PASSWORD=your_password
```

**Note:** May require additional npm package installation

---

#### 📺 Apple TV

**Prerequisites:**
```powershell
# Install Python (if not installed)
# Download from https://www.python.org/downloads/

# Install pyatv
pip install pyatv
```

**Pair Your Apple TV:**
```powershell
# Find your Apple TV
atvremote scan

# Pair with it (replace IP)
atvremote --id 192.168.1.100 pair
```

**Add to .env:**
```env
APPLE_TV_IPS=192.168.1.100,192.168.1.101
```

---

## 🎯 Common IP Camera URLs

### Find Your Camera's RTSP URL

Most IP cameras use this format:
```
rtsp://username:password@camera-ip:port/stream-path
```

### Popular Brands:

**Hikvision:**
```env
CAMERA_URLS=rtsp://admin:password@192.168.1.50:554/Streaming/Channels/101
```

**Dahua:**
```env
CAMERA_URLS=rtsp://admin:password@192.168.1.50:554/cam/realmonitor?channel=1&subtype=0
```

**Amcrest:**
```env
CAMERA_URLS=rtsp://admin:password@192.168.1.50:554/cam/realmonitor?channel=1&subtype=1
```

**Generic ONVIF:**
```env
CAMERA_URLS=rtsp://admin:password@192.168.1.50:554/stream1
```

**Test Your Camera URL:**
```powershell
# Use VLC Media Player
# File → Open Network Stream → Paste RTSP URL
```

---

## 🔍 Finding Device IP Addresses

### Method 1: Router Admin Page
1. Login to your router (usually 192.168.1.1 or 192.168.0.1)
2. Look for "Connected Devices" or "DHCP Clients"
3. Find device by name or MAC address

### Method 2: Use the App
1. Start the application
2. Click "Discover Devices" on Dashboard
3. Wait 10-15 seconds
4. Devices will appear with IP addresses

### Method 3: Network Scanner
```powershell
# Windows - Find all devices on network
arp -a
```

---

## ✅ Testing Your Setup

### 1. Backend Health Check
```powershell
# Open PowerShell
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-12-30T..."}
```

### 2. Device Discovery Test
```powershell
# Discover devices via API
curl -X POST http://localhost:5000/api/devices/discover
```

### 3. WebSocket Test
```powershell
# Check browser console at http://localhost:3000
# Should see: "WebSocket connected"
```

---

## 🐛 Quick Troubleshooting

### Problem: Devices not discovered
**Solution:**
- Wait 15 seconds after clicking Discover
- Check if devices are on same WiFi network
- Disable VPN temporarily
- Check firewall settings

### Problem: Samsung TV won't connect
**Solution:**
- Accept the connection prompt on your TV
- Make sure TV is on and connected to WiFi
- Try power cycling the TV

### Problem: Camera stream won't load
**Solution:**
- Test URL in VLC Media Player first
- Check username/password
- Verify camera port is accessible
- Some cameras need /stream1 or /stream2

### Problem: Ring/Eero not working
**Solution:**
- Verify credentials in .env
- Check for typos in email/password
- Handle 2FA if enabled
- Check server console for error messages

### Problem: Port already in use
**Solution:**
```powershell
# Change port in .env
PORT=5001
```

---

## 📱 Mobile Access

To access from other devices on your network:

1. Find your computer's IP address:
```powershell
ipconfig
# Look for "IPv4 Address"
```

2. Access from mobile:
```
http://YOUR_COMPUTER_IP:3000
```

---

## 🔐 Sample .env File

```env
# Server
PORT=5000
NODE_ENV=development

# Network
LOCAL_NETWORK_SUBNET=192.168.1.0/24
DISCOVERY_TIMEOUT=10000

# Ring (Optional)
RING_EMAIL=your_email@example.com
RING_PASSWORD=your_password

# Eero (Optional)
EERO_EMAIL=your_email@example.com
EERO_PASSWORD=your_password

# Apple TV (Optional)
APPLE_TV_IPS=192.168.1.100,192.168.1.101

# Cameras (Optional - Or add via UI)
CAMERA_URLS=rtsp://admin:password@192.168.1.50:554/stream1,rtsp://admin:password@192.168.1.51:554/stream1
CAMERA_USERNAME=admin
CAMERA_PASSWORD=camera_password
```

---

## 🎉 You're All Set!

Access your SmartHouse dashboard at:
**http://localhost:3000**

### Quick Navigation:
- **Dashboard**: Overview of all devices
- **Sonos**: Music control
- **Apple TV**: Remote control
- **Samsung TVs**: TV control
- **Ring**: Doorbell monitoring
- **Cameras**: Security feeds
- **Eero**: Network status

---

## 📞 Need Help?

1. Check the full README.md for detailed documentation
2. Review server console for error messages
3. Test individual API endpoints
4. Verify all credentials in .env
5. Ensure devices are on the same network

**Happy smart home controlling! 🏠✨**
