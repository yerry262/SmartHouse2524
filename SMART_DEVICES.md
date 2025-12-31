# Smart Home Device Integration Guide

This document provides detailed information about supported smart home devices and a comprehensive catalog of 250+ popular devices for potential integration with SmartHouse 2524.

## 🎯 Quick Status Legend
- ✅ **[x]** = Currently Supported
- ⬜ **[ ]** = Not Yet Supported (Future Integration)

## 📚 Table of Contents

- [Philips Hue](#philips-hue)
- [TP-Link Kasa](#tp-link-kasa)
- [Sonos Speakers](#sonos-speakers)
- [Samsung Smart TVs](#samsung-smart-tvs)
- [Apple TV](#apple-tv)
- [Ring Doorbell & Cameras](#ring-doorbell--cameras)
- [Eero Network](#eero-network)
- [Samsung Smart Washer](#samsung-smart-washer)
- [GE SmartHQ Appliances](#ge-smarthq-appliances)
- [Samsung SmartThings Appliances](#samsung-smartthings-appliances)
- [Other Smart Home Devices](#other-smart-home-devices)

---

## 💡 Philips Hue

### Overview
Philips Hue is one of the most popular smart lighting systems. SmartHouse 2524 provides full control over lights, groups, rooms, and scenes.

### Package Information
- **NPM Package**: `node-hue-api` (v5.0.0+)
- **Installation**: `npm install node-hue-api`
- **Documentation**: https://www.npmjs.com/package/node-hue-api

### Supported Devices
- Hue Smart Bulbs (White, White Ambiance, Color)
- Hue Light Strips
- Hue Light Bars
- Hue Go
- Hue Play
- Any Philips Hue compatible bulb

### Features
✅ **Discovery**: Automatic Hue Bridge discovery via UPnP  
✅ **Authentication**: One-time bridge authentication (press link button)  
✅ **Light Control**: On/Off, Brightness (0-254), Color (HSB), Color Temperature  
✅ **Groups/Rooms**: Control multiple lights together  
✅ **Scenes**: Activate pre-configured scenes  
✅ **Real-time Updates**: Instant status feedback via WebSocket  

### Setup Instructions

1. **Install the package**:
   ```bash
   npm install node-hue-api
   ```

2. **Discover your Hue Bridge**:
   - Open the Hue page in SmartHouse 2524
   - Click "Discover Bridges"
   - Your bridge(s) will appear with their IP addresses

3. **Authenticate**:
   - Click "Authenticate" on your bridge
   - Press the physical link button on your Hue Bridge
   - Click "Authenticate" in the dialog within 30 seconds
   - Save the username displayed (stored automatically)

4. **Start Controlling**:
   - All lights, groups, and scenes will load automatically
   - Control individual lights or entire rooms
   - Adjust brightness with sliders
   - Activate scenes with one click

### API Endpoints

```
GET  /api/hue/discover                           - Discover Hue bridges
POST /api/hue/authenticate                       - Authenticate with bridge
POST /api/hue/connect                            - Connect with existing username
GET  /api/hue/:ip/lights                         - Get all lights
GET  /api/hue/:ip/lights/:lightId                - Get specific light
PUT  /api/hue/:ip/lights/:lightId/state          - Control light state
GET  /api/hue/:ip/groups                         - Get all groups/rooms
PUT  /api/hue/:ip/groups/:groupId/state          - Control group
GET  /api/hue/:ip/scenes                         - Get all scenes
PUT  /api/hue/:ip/scenes/:sceneId/activate       - Activate scene
```

### Example Usage

```javascript
// Turn on a light with 50% brightness and warm white
PUT /api/hue/192.168.4.10/lights/1/state
{
  "on": true,
  "brightness": 127,
  "ct": 400
}

// Set color (hue, saturation, brightness)
PUT /api/hue/192.168.4.10/lights/1/state
{
  "on": true,
  "hue": 25500,      // Blue
  "sat": 254,        // Full saturation
  "brightness": 200
}
```

---

## 🔌 TP-Link Kasa

### Overview
TP-Link Kasa devices include smart plugs, smart bulbs, and light strips. The system provides comprehensive control including energy monitoring for compatible plugs.

### Package Information
- **NPM Package**: `tplink-smarthome-api` (v5.0.0)
- **Installation**: `npm install tplink-smarthome-api`
- **Documentation**: https://www.npmjs.com/package/tplink-smarthome-api

### Supported Devices

#### Smart Plugs
- HS100, HS103, HS105, HS107 (Basic plugs)
- HS110 (With energy monitoring)
- HS200, HS210, HS220 (Smart switches)
- HS300 (Power strip)
- KP303, KP400 (Outdoor plugs)
- EP40, ES20M

#### Smart Bulbs
- LB100, LB110, LB120 (White bulbs)
- LB130, LB230 (Color bulbs)
- LB200 (Soft white)
- KL50, KL120, KL125 (New generation)
- KL430 (Light strips)

**Note**: Tapo devices are NOT supported by this package.

### Features
✅ **Auto-Discovery**: Automatically finds all TP-Link devices on your network  
✅ **Smart Plugs**: On/Off control, LED indicator control  
✅ **Energy Monitoring**: Real-time power consumption (HS110 models)  
✅ **Smart Bulbs**: Brightness, color (HSB), color temperature  
✅ **Continuous Monitoring**: Background discovery keeps device list updated  

### Setup Instructions

1. **Install the package**:
   ```bash
   npm install tplink-smarthome-api
   ```

2. **Ensure devices are on your network**:
   - All TP-Link devices must be on the same network
   - Use the Kasa app to initially configure devices
   - No authentication required (local API)

3. **Start Discovery**:
   - Open the TP-Link page in SmartHouse 2524
   - Click "Discover Devices"
   - All devices will appear automatically

4. **Control Devices**:
   - Toggle power on/off
   - Adjust brightness for bulbs
   - View energy consumption for monitoring plugs

### API Endpoints

```
GET  /api/tplink/discover                - Discover all TP-Link devices
GET  /api/tplink/:host                   - Get device info
POST /api/tplink/:host/power             - Turn device on/off
POST /api/tplink/:host/brightness        - Set bulb brightness (0-100)
POST /api/tplink/:host/color             - Set bulb color (HSB)
POST /api/tplink/:host/temperature       - Set color temperature (2500-9000K)
GET  /api/tplink/:host/emeter            - Get energy data (HS110)
POST /api/tplink/:host/led               - Control LED indicator
```

### Example Usage

```javascript
// Turn on a smart plug
POST /api/tplink/192.168.4.20/power
{
  "state": true
}

// Set bulb brightness to 75%
POST /api/tplink/192.168.4.21/brightness
{
  "brightness": 75
}

// Set color to red
POST /api/tplink/192.168.4.21/color
{
  "hue": 0,
  "saturation": 100,
  "brightness": 80
}

// Get energy data
GET /api/tplink/192.168.4.20/emeter
// Returns: { power_mw, voltage_mv, current_ma, dayStats }
```

---

## 🎵 Sonos Speakers

### Package Information
- **NPM Package**: `sonos` (v1.14.2)
- **Installation**: `npm install sonos`
- **Documentation**: https://www.npmjs.com/package/sonos

### Supported Devices
- Sonos One, One SL
- Sonos Play:1, Play:3, Play:5
- Sonos Beam, Arc, Ray (Soundbars)
- Sonos Amp
- Sonos Move, Roam
- Any Sonos-compatible speaker

### Features
✅ Auto-discovery via UPnP  
✅ Playback control (play, pause, next, previous)  
✅ Volume control (0-100)  
✅ Track information  
✅ Group management  

---

## 📺 Samsung Smart TVs

### Package Information
- **NPM Package**: `samsung-tv-control` (v1.3.1)
- **Installation**: `npm install samsung-tv-control`

### Supported Devices
- Samsung Smart TVs (2016+)
- Models with SmartThings support
- Tizen OS-based TVs

### Features
✅ Power on/off  
✅ Volume control  
✅ Channel control  
✅ App launching  
✅ Remote control commands  

---

## 📱 Apple TV

### Package Information
- **Python Package**: `pyatv`
- **Installation**: `pip install pyatv`
- **Documentation**: https://pyatv.dev/

### Supported Devices
- Apple TV 4K (all generations)
- Apple TV HD
- HomePod (limited)

### Features
✅ Playback control  
✅ App switching  
✅ Volume control  
✅ Remote navigation  

---

## � LG webOS Smart TVs

### Overview
LG webOS TVs provide comprehensive control through a WebSocket-based API. SmartHouse 2524 provides full remote control capabilities for LG Smart TVs.

### Package Information
- **NPM Package**: `lgtv2` (v1.6.3)
- **Installation**: `npm install lgtv2`
- **Documentation**: https://www.npmjs.com/package/lgtv2

### Supported Devices
- LG webOS TVs (2014+)
- All models with webOS 2.0 or higher
- Models with "LG Connect Apps" support

### Features
✅ **Power Control**: Turn TV off (power on requires Wake-on-LAN)  
✅ **Volume Control**: Adjust volume (0-100) and mute/unmute  
✅ **Media Controls**: Play, pause, stop, rewind, fast forward  
✅ **Channel Control**: Channel up/down, get current channel  
✅ **App Launching**: Launch Netflix, YouTube, Prime Video, Disney+, etc.  
✅ **Toast Notifications**: Display messages on TV screen  
✅ **App Management**: List and launch installed apps  

### Setup Instructions

1. **Install the package**:
   ```bash
   npm install lgtv2
   ```

2. **Enable LG Connect Apps on your TV**:
   - Open TV Settings
   - Navigate to Network → "LG Connect Apps"
   - Enable the setting
   - Note your TV's IP address (Settings → Network → Status)

3. **Connect to your TV**:
   - Open the LG TV page in SmartHouse 2524
   - Click "Add TV"
   - Enter your TV's IP address
   - Accept the connection prompt on your TV screen

4. **Start Controlling**:
   - Adjust volume with the slider
   - Control playback with media buttons
   - Launch apps with one click
   - Send custom notifications to your TV

### API Endpoints

```
GET  /api/lg/discover                            - Get connected TVs
POST /api/lg/connect                             - Connect to a new TV
GET  /api/lg/:ip/status                          - Get TV status
GET  /api/lg/:ip/volume                          - Get current volume
POST /api/lg/:ip/volume                          - Set volume (0-100)
POST /api/lg/:ip/mute                            - Mute/unmute
POST /api/lg/:ip/power                           - Power off TV
GET  /api/lg/:ip/apps                            - List installed apps
POST /api/lg/:ip/app                             - Launch app by ID
POST /api/lg/:ip/media/:command                  - Media control (play/pause/stop)
POST /api/lg/:ip/channel/:direction              - Channel up/down
GET  /api/lg/:ip/channel                         - Get current channel
POST /api/lg/:ip/toast                           - Show toast notification
```

### Example Usage

```javascript
// Set volume to 30
POST /api/lg/192.168.1.50/volume
{
  "volume": 30
}

// Launch Netflix
POST /api/lg/192.168.1.50/app
{
  "appId": "netflix"
}

// Pause playback
POST /api/lg/192.168.1.50/media/pause

// Show notification
POST /api/lg/192.168.1.50/toast
{
  "message": "Hello from SmartHouse!"
}
```

### Common App IDs

- Netflix: `netflix`
- YouTube: `youtube.leanback.v4`
- Amazon Prime Video: `amazon`
- Disney+: `com.disney.disneyplus-prod`
- Hulu: `hulu`
- Spotify: `spotify-beehive`

### Troubleshooting

**Connection Issues:**
- Ensure "LG Connect Apps" is enabled on your TV
- Check that your TV and server are on the same network
- Accept the pairing prompt on your TV within 30 seconds

**Can't Power On TV:**
- LG TVs cannot be powered on remotely via this API
- Use Wake-on-LAN if your TV supports it
- Alternatively, use HDMI-CEC if connected to other devices

---

## �🔔 Ring Doorbell & Cameras

### Package Information
- **NPM Package**: `ring-client-api` (v11.7.2)
- **Installation**: `npm install ring-client-api`

### Supported Devices
- Ring Video Doorbell (all models)
- Ring Stick Up Cam
- Ring Spotlight Cam
- Ring Floodlight Cam
- Ring Indoor/Outdoor Cam

### Features
✅ Live video streaming  
✅ Motion detection alerts  
✅ Doorbell event notifications  
✅ Two-way audio  
✅ Recording history  

### Setup
Requires Ring account credentials in `.env`:
```env
RING_EMAIL=your_email@example.com
RING_PASSWORD=your_password
```

---

## 🌐 Eero Network

### Features
✅ Network status monitoring  
✅ Connected device list  
✅ Speed test results  
✅ Network health  

**Note**: Eero API is unofficial and may require special setup.

---

## � GE SmartHQ Appliances

### Overview
GE SmartHQ appliances include refrigerators, ovens, dishwashers, and laundry machines. SmartHouse 2524 provides comprehensive control through the GE Home cloud API.

### Package Information
- **NPM Package**: `ge-home` (v1.0.0+)
- **Installation**: `npm install ge-home`
- **Documentation**: https://www.npmjs.com/package/ge-home

### Supported Appliances
- ✅ GE Profile Refrigerators
- ✅ GE Cafe Refrigerators  
- ✅ GE Smart Ovens & Ranges
- ✅ GE Dishwashers
- ✅ GE Washers & Dryers
- ⚠️ Requires GE SmartHQ account

### Features
✅ **Refrigerator Control**: Set fridge/freezer temperature, turbo cooling  
✅ **Ice Maker**: Control ice production modes (on/off/max)  
✅ **Temperature Monitoring**: Real-time temperature readings  
✅ **Door Status**: Monitor door open/closed status  
✅ **Filter Status**: Water filter replacement alerts  
✅ **Oven Control**: Remote preheat and temperature control  
✅ **Cloud-based**: Works from anywhere with internet  

### Setup Instructions

1. **Install the package**:
```bash
npm install ge-home
```

2. **Add credentials to .env**:
```env
GE_USERNAME=your_email@example.com
GE_PASSWORD=your_password
```

3. **Restart server** to load credentials

4. **Access appliances**:
   - Open GE Appliances page in SmartHouse 2524
   - All appliances on your GE account will appear automatically

### API Endpoints

```
GET  /api/ge-appliances/appliances              - Get all GE appliances
GET  /api/ge-appliances/refrigerators           - Get all refrigerators
GET  /api/ge-appliances/ovens                   - Get all ovens
GET  /api/ge-appliances/dishwashers             - Get all dishwashers
GET  /api/ge-appliances/laundry                 - Get washers/dryers
GET  /api/ge-appliances/appliances/:id          - Get specific appliance
POST /api/ge-appliances/refrigerators/:id/temperature  - Set temperature
POST /api/ge-appliances/refrigerators/:id/icemaker     - Control ice maker
POST /api/ge-appliances/refrigerators/:id/turbo        - Enable turbo cooling
POST /api/ge-appliances/ovens/:id/control              - Control oven
```

### Example Usage

```javascript
// Set refrigerator temperature
POST /api/ge-appliances/refrigerators/ABC123/temperature
{
  "compartment": "fridge",
  "temperature": 37
}

// Set freezer temperature
POST /api/ge-appliances/refrigerators/ABC123/temperature
{
  "compartment": "freezer",
  "temperature": 0
}

// Enable turbo cooling
POST /api/ge-appliances/refrigerators/ABC123/turbo
{
  "enabled": true
}

// Set ice maker to max
POST /api/ge-appliances/refrigerators/ABC123/icemaker
{
  "mode": "max"
}

// Preheat oven
POST /api/ge-appliances/ovens/XYZ789/control
{
  "action": "preheat",
  "temperature": 350,
  "mode": "bake"
}
```

### Refrigerator Temperature Ranges
- **Fridge**: 33°F to 42°F (recommended: 37°F)
- **Freezer**: -6°F to 6°F (recommended: 0°F)

### Troubleshooting

**Authentication Failed:**
- Verify GE_USERNAME and GE_PASSWORD in .env file
- Check credentials work on GE SmartHQ app
- Restart server after updating credentials

**No Appliances Found:**
- Ensure appliances are registered in GE SmartHQ app
- Verify appliances are online and connected to Wi-Fi
- Check network connectivity

**Command Not Working:**
- Appliance must be online
- Some features require specific appliance models
- Check appliance compatibility in GE SmartHQ app

---

## 🏠 Samsung SmartThings Appliances

### Overview
Samsung SmartThings appliances include Family Hub refrigerators, smart ovens, and laundry machines. SmartHouse 2524 provides control through the Samsung SmartThings cloud API.

### Package Information
- **API**: Samsung SmartThings REST API
- **No NPM Package Required**: Uses direct HTTP requests with axios
- **Documentation**: https://developer.smartthings.com/

### Supported Appliances
- ✅ **Samsung Family Hub Refrigerators** ✅ *Fully Supported*
- ✅ **Samsung Smart Refrigerators** ✅ *Fully Supported*
- ✅ **Samsung Smart Ovens** ✅ *Fully Supported*
- ✅ **Samsung Smart Washers** ✅ *Fully Supported*
- ✅ **Samsung Smart Dryers** ✅ *Fully Supported*
- ✅ **SmartThings Hub Integration** ✅ *Fully Supported*
- ✅ **All SmartThings Compatible Devices** ✅ *Universal Support*

### Features
✅ **Refrigerator Control**: Monitor temperature and door status  
✅ **Temperature Monitoring**: Real-time temperature readings  
✅ **Door Sensors**: Door open/closed notifications  
✅ **Device Status**: Online/offline status for all appliances  
✅ **Remote Control**: Control appliances from anywhere  
✅ **Cloud-based**: Works via SmartThings cloud platform  

### Setup Instructions

1. **Create SmartThings Personal Access Token**:
   - Go to https://account.smartthings.com/tokens
   - Click "Generate new token"
   - Select all device permissions
   - Copy the token (shown only once)

2. **Add token to .env**:
```env
SAMSUNG_SMARTTHINGS_TOKEN=your_personal_access_token_here
```

3. **Restart server** to load configuration

4. **Access appliances**:
   - Open Samsung Appliances page in SmartHouse 2524
   - All SmartThings appliances will appear automatically

### API Endpoints

```
GET  /api/samsung-appliances/status             - Check configuration status
GET  /api/samsung-appliances/devices            - Get all Samsung devices
GET  /api/samsung-appliances/refrigerators      - Get all refrigerators
GET  /api/samsung-appliances/ovens              - Get all ovens
GET  /api/samsung-appliances/laundry            - Get washers/dryers
GET  /api/samsung-appliances/devices/:id        - Get specific device details
POST /api/samsung-appliances/devices/:id/command  - Execute device command
POST /api/samsung-appliances/refrigerators/:id/temperature  - Set temperature
```

### Example Usage

```javascript
// Get all refrigerators
GET /api/samsung-appliances/refrigerators

// Set refrigerator temperature
POST /api/samsung-appliances/refrigerators/device-id/temperature
{
  "temperature": 37
}

// Execute custom command
POST /api/samsung-appliances/devices/device-id/command
{
  "capability": "temperatureMeasurement",
  "command": "setTemperature",
  "arguments": [37]
}
```

### Troubleshooting

**Not Configured Error:**
- Verify SAMSUNG_SMARTTHINGS_TOKEN is set in .env
- Check token has correct permissions
- Restart server after setting token

**No Appliances Found:**
- Ensure appliances are added to SmartThings app
- Verify appliances are online in SmartThings app
- Check appliances have correct permissions

**API Errors:**
- Token may have expired - generate new token
- Check appliance is online and connected
- Verify appliance supports SmartThings integration

---

## �🏠 Other Smart Home Devices

### Recommended Packages

## 💡 LIFX Smart Bulbs

### Overview
LIFX smart bulbs provide vibrant color lighting without requiring a hub. SmartHouse 2524 provides direct local network control via the LIFX LAN protocol.

### Package Information
- **NPM Package**: `lifx-lan-client` (v2.1.2)
- **Installation**: `npm install lifx-lan-client`
- **Documentation**: https://www.npmjs.com/package/lifx-lan-client

### Supported Devices
- LIFX A19 Color Bulbs
- LIFX BR30 Color Bulbs
- LIFX Mini Color
- LIFX Z LED Light Strip
- LIFX Beam
- LIFX Tile
- LIFX Candle
- LIFX Switch (relay control)
- All LIFX bulbs with firmware 2.0+

### Features
✅ **Auto-Discovery**: Automatic device discovery on local network  
✅ **No Hub Required**: Direct control without bridge  
✅ **Full Color Control**: HSB, RGB, and Hex color support  
✅ **Brightness Control**: 0-100% with smooth fading  
✅ **Color Temperature**: 2500K-9000K adjustable white  
✅ **Waveform Effects**: Built-in pulse, sine, and triangle effects  
✅ **Fade Transitions**: Smooth fade on/off over time  
✅ **Label Management**: Rename lights programmatically  
✅ **Hardware Info**: Query firmware and hardware versions  

### Setup Instructions

1. **Install the package**:
   ```bash
   npm install lifx-lan-client
   ```

2. **Ensure lights are on your network**:
   - Set up LIFX bulbs using the LIFX mobile app
   - Connect bulbs to your Wi-Fi network
   - Ensure SmartHouse server is on the same network

3. **Automatic Discovery**:
   - Open the LIFX page in SmartHouse 2524
   - Lights are discovered automatically every 5 seconds
   - No manual configuration needed!

4. **Start Controlling**:
   - Click on any discovered light
   - Use power controls to turn on/off
   - Adjust color with HSB sliders
   - Apply preset colors with one click
   - Create pulse effects instantly

### API Endpoints

```
GET  /api/lifx/discover                          - Discover LIFX lights
GET  /api/lifx/lights                            - Get all lights
GET  /api/lifx/lights/:id/state                  - Get light state
POST /api/lifx/lights/:id/on                     - Turn light on
POST /api/lifx/lights/:id/off                    - Turn light off
POST /api/lifx/lights/:id/color                  - Set color (HSB)
POST /api/lifx/lights/:id/color-rgb              - Set color (RGB)
POST /api/lifx/lights/:id/color-hex              - Set color (Hex)
POST /api/lifx/lights/:id/label                  - Set light label
POST /api/lifx/lights/:id/waveform               - Apply waveform effect
GET  /api/lifx/lights/:id/hardware               - Get hardware info
```

### Example Usage

```javascript
// Turn on light with 2 second fade
POST /api/lifx/lights/d073d5123456/on
{
  "duration": 2000
}

// Set color to blue at 80% brightness
POST /api/lifx/lights/d073d5123456/color
{
  "hue": 240,
  "saturation": 100,
  "brightness": 80,
  "kelvin": 3500,
  "duration": 500
}

// Set color using hex
POST /api/lifx/lights/d073d5123456/color-hex
{
  "hex": "#FF0000",
  "duration": 1000
}

// Apply pulse effect (SINE wave, 5 cycles)
POST /api/lifx/lights/d073d5123456/waveform
{
  "hue": 120,
  "saturation": 100,
  "brightness": 50,
  "transient": true,
  "period": 1000,
  "cycles": 5,
  "waveform": 1
}
```

### Color Parameters

**HSB (Hue, Saturation, Brightness)**
- Hue: 0-360 (color wheel degrees)
- Saturation: 0-100 (color intensity percentage)
- Brightness: 0-100 (light intensity percentage)
- Kelvin: 2500-9000 (color temperature)

**Waveform Types**
- 0 = SAW
- 1 = SINE (smooth pulse)
- 2 = HALF_SINE
- 3 = TRIANGLE
- 4 = PULSE (sharp on/off)

### Troubleshooting

**Lights Not Discovered:**
- Ensure lights are powered on and connected to Wi-Fi
- Check that server and lights are on same network
- Verify firewall allows UDP broadcast traffic
- Discovery runs automatically every 5 seconds

**Command Not Working:**
- Light may be offline - check power and Wi-Fi
- Try turning light off and on
- Verify light firmware is 2.0 or higher
- Check network connectivity

**Slow Response:**
- LIFX uses UDP protocol - no acknowledgment by default
- Use callbacks for confirmed delivery (adds latency)
- Reduce message rate if controlling multiple lights

---

#### Wyze Cameras & Devices
- **Package**: `wyze-node`
- **Installation**: `npm install wyze-node`
- **Features**: Cameras, sensors, plugs, bulbs

## 📱 Wyze Smart Devices

### Overview
Wyze offers affordable smart home devices including cameras, bulbs, plugs, and sensors. SmartHouse 2524 provides control via the Wyze cloud API.

### Package Information
- **NPM Package**: `wyze-node` (v2.0.6)
- **Installation**: `npm install wyze-node`
- **Documentation**: https://www.npmjs.com/package/wyze-node

### Supported Devices
- ✅ Wyze Cam v1, v2, v3
- ✅ Wyze Cam Pan
- ✅ Wyze Cam Outdoor
- ✅ Wyze Bulb
- ✅ Wyze Plug
- ✅ Wyze Contact Sensor
- ✅ Wyze Motion Sensor

### Features
✅ **Device Discovery**: Get all Wyze devices on account  
✅ **Camera Control**: Power on/off cameras  
✅ **Bulb Control**: Power on/off smart bulbs  
✅ **Plug Control**: Power on/off smart plugs  
✅ **Sensor Status**: View sensor states  
✅ **Cloud-based**: Works from anywhere  

### Setup Instructions

1. **Install the package**:
```bash
npm install wyze-node
```

2. **Add credentials to .env**:
```env
WYZE_EMAIL=your_email@example.com
WYZE_PASSWORD=your_password
```

3. **Restart server** to load credentials

### API Endpoints

```
GET  /api/wyze/devices                           - Get all devices
GET  /api/wyze/cameras                           - Get all cameras
GET  /api/wyze/bulbs                             - Get all bulbs
GET  /api/wyze/plugs                             - Get all plugs
GET  /api/wyze/sensors                           - Get all sensors
POST /api/wyze/devices/:mac/on                   - Turn device on
POST /api/wyze/devices/:mac/off                  - Turn device off
```

### Example Usage

```javascript
// Get all devices
GET /api/wyze/devices

// Turn camera on
POST /api/wyze/devices/ABCDEF123456/on

// Turn bulb off
POST /api/wyze/devices/789012GHIJKL/off

// Get all sensors
GET /api/wyze/sensors
```

### Troubleshooting

**Authentication Failed:**
- Verify WYZE_EMAIL and WYZE_PASSWORD in .env file
- Check credentials work on Wyze app
- Restart server after updating credentials

**Device Not Responding:**
- Device must be online and connected to Wi-Fi
- Check Wyze app to verify device status
- Cloud API may have delays (1-2 seconds typical)

**No Devices Found:**
- Ensure devices are added to your Wyze account
- Verify credentials are correct
- Check network connectivity

---

#### Xiaomi Mi Home Devices
- **Package**: `miio`
- **Installation**: `npm install miio`
- **Features**: Vacuum cleaners, air purifiers, lights, sensors

---

## 🧺 Samsung Smart Washer

### Overview
Samsung smart washers with SmartThings connectivity can be controlled remotely for modern laundry management. SmartHouse 2524 provides full control over washing cycles, modes, and monitoring.

### Package Information
- **NPM Package**: `@smartthings/core-sdk` (v7.0.0+)
- **Installation**: `npm install @smartthings/core-sdk`
- **Documentation**: https://www.npmjs.com/package/@smartthings/core-sdk

### Supported Devices
- ✅ Samsung SmartThings-enabled Washers (2018+)
- ✅ Samsung AddWash Models
- ✅ Samsung FlexWash Models
- ✅ Samsung ActiveWash Models
- ⚠️ Requires SmartThings hub or built-in Wi-Fi

### Features
✅ **Power Control**: Turn washer on/off remotely  
✅ **Cycle Control**: Start and stop wash cycles  
✅ **Mode Selection**: Normal, Delicate, Heavy Duty, Quick, Eco modes  
✅ **Status Monitoring**: Real-time operating state and progress  
✅ **SmartThings Integration**: Works with Samsung's smart home ecosystem  
✅ **Remote Alerts**: Get notifications when cycle completes  

### Setup Instructions

1. **Install the package**:
   ```bash
   npm install @smartthings/core-sdk
   ```

2. **Get SmartThings Personal Access Token**:
   - Go to SmartThings Developer Portal
   - Navigate to Personal Access Tokens
   - Create new token with device control permissions
   - Copy the token

3. **Add token to .env file**:
   ```env
   SMARTTHINGS_TOKEN=your_personal_access_token_here
   ```

4. **Restart server** to load credentials

5. **Discover washers**:
   - Open Samsung Washer page in SmartHouse 2524
   - Click "Discover" to find connected washers
   - Select washer to view controls

### API Endpoints

```
GET  /api/samsung-washer/discover                - Discover Samsung washers
GET  /api/samsung-washer/washers                 - Get all washers
GET  /api/samsung-washer/washers/:id/status      - Get washer status
POST /api/samsung-washer/washers/:id/power       - Turn washer on/off
POST /api/samsung-washer/washers/:id/mode        - Set wash mode
POST /api/samsung-washer/washers/:id/start       - Start washing cycle
POST /api/samsung-washer/washers/:id/stop        - Stop/pause cycle
```

### Example Usage

```javascript
// Turn on washer
POST /api/samsung-washer/washers/abc123/power
{
  "state": true
}

// Set delicate mode
POST /api/samsung-washer/washers/abc123/mode
{
  "mode": "delicate"
}

// Start washing cycle
POST /api/samsung-washer/washers/abc123/start

// Get current status
GET /api/samsung-washer/washers/abc123/status
```

### Available Wash Modes
- `normal` - Standard wash cycle
- `delicate` - Gentle cycle for delicate fabrics
- `heavy` - Heavy duty for heavily soiled items
- `quick` - Quick wash for lightly soiled items
- `eco` - Energy-efficient wash
- `cotton` - Cotton fabric cycle
- `synthetic` - Synthetic fabric cycle
- `wool` - Wool and delicate cycle

### Washer States
- `off` - Washer is powered off
- `on` - Washer is powered on and ready
- `running` - Currently washing
- `pause` - Cycle is paused
- `complete` - Wash cycle finished
- `error` - Error state (check washer display)

### Troubleshooting

**No Washers Found:**
- Ensure washer is connected to SmartThings
- Verify SmartThings token has device permissions
- Check washer is online in SmartThings app
- Make sure washer model supports SmartThings

**Token Required Error:**
- Get Personal Access Token from SmartThings Developer Portal
- Add SMARTTHINGS_TOKEN to .env file
- Restart server after adding token
- Verify token has correct permissions

**Commands Not Working:**
- Check washer is powered on
- Ensure washer door is closed
- Verify no error states on washer
- Some commands require specific washer states

**Connection Failed:**
- Verify washer is on same network as server
- Check SmartThings hub connectivity
- Restart SmartThings hub if needed
- Re-authenticate in SmartThings app

---

## 🤖 Xiaomi miIO Devices (Roborock, Air Purifiers)

### Overview
Xiaomi's miIO protocol is used by many devices including Roborock robot vacuums and Xiaomi air purifiers. SmartHouse 2524 provides local network control via the miIO protocol.

### Package Information
- **NPM Package**: `miio` (v0.15.6)
- **Installation**: `npm install miio`
- **Documentation**: https://www.npmjs.com/package/miio

### Supported Devices
- ✅ Roborock S5, S6, S7 Robot Vacuums
- ✅ Xiaomi Mi Robot Vacuum
- ✅ Xiaomi Air Purifier (all models)
- ✅ Mijia Smart Home Devices
- ⚠️ Requires device token for manual connection

### Features
✅ **Auto-Discovery**: Automatically find devices on network  
✅ **Token Management**: Store tokens for future connections  
✅ **Vacuum Control**: Start cleaning, stop, return to dock  
✅ **Purifier Control**: Power on/off air purifiers  
✅ **Status Monitoring**: Battery level, cleaning state  
✅ **Local Protocol**: Works without internet (after setup)  

### Setup Instructions

1. **Install the package**:
```bash
npm install miio
```

2. **Discover devices automatically**:
   - Click "Discover" button in UI
   - Devices without tokens won't connect automatically
   - Use manual connection for token-required devices

3. **Manual connection with token**:
   - Get device token from Xiaomi Home app or miio CLI
   - Use "Connect" button and enter IP + token
   - Token is a 32-character hexadecimal string

### Getting Device Tokens

**Method 1: Using miio CLI**
```bash
npm install -g miio
miio discover
```

**Method 2: Xiaomi Home App**
- Android: Extract from app database (requires root)
- iOS: Extract from iTunes backup

**Method 3: Network Capture**
- Use Wireshark to capture handshake
- Extract token from provisioning packet

### API Endpoints

```
POST /api/miio/discover                          - Start device discovery
POST /api/miio/connect                           - Connect device with token
GET  /api/miio/vacuums                           - Get all robot vacuums
GET  /api/miio/purifiers                         - Get all air purifiers
POST /api/miio/vacuums/:id/clean                 - Start cleaning
POST /api/miio/vacuums/:id/stop                  - Stop cleaning
POST /api/miio/vacuums/:id/dock                  - Return to charging dock
POST /api/miio/purifiers/:id/on                  - Turn purifier on
POST /api/miio/purifiers/:id/off                 - Turn purifier off
```

### Example Usage

```javascript
// Discover devices
POST /api/miio/discover

// Connect device manually
POST /api/miio/connect
{
  "address": "192.168.1.100",
  "token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}

// Start vacuum cleaning
POST /api/miio/vacuums/12345/clean

// Return vacuum to dock
POST /api/miio/vacuums/12345/dock

// Turn on air purifier
POST /api/miio/purifiers/67890/on
```

### Vacuum States
- `cleaning` - Currently cleaning
- `charging` - At dock, charging
- `docked` - At dock, fully charged
- `returning` - Returning to dock
- `error` - Error state (check device)

### Troubleshooting

**Device Not Discovered:**
- Ensure device is powered on
- Check device and server on same network subnet
- Discovery may take 10-30 seconds
- Some devices require manual token connection

**Token Required Error:**
- Device needs token for connection
- Use manual connection with token
- See "Getting Device Tokens" section above

**Commands Not Working:**
- Verify device is connected (check device list)
- Check device is not in error state
- Ensure firmware is up to date
- Try power cycling the device

**Connection Dropped:**
- Device may have entered deep sleep
- Check network stability
- Reconnect using discovery or manual connection
- Some devices auto-disconnect after 10 minutes

---

## � Nanoleaf Smart Lights

### Overview
Nanoleaf creates innovative smart lighting solutions including the popular Essentials line of smart bulbs and iconic light panel arrays. SmartHouse 2524 provides full control via the official Nanoleaf API.

### Package Information
- **NPM Package**: `nanoleaf-client-multi` (v3.0.1)
- **Installation**: `npm install nanoleaf-client-multi`
- **Documentation**: https://www.npmjs.com/package/nanoleaf-client-multi

### Supported Devices
- ✅ Nanoleaf Essentials A19 Bulbs
- ✅ Nanoleaf Essentials BR30 Floodlights  
- ✅ Nanoleaf Essentials Light Strips
- ✅ Nanoleaf Shapes (Hexagons, Triangles, Mini Triangles)
- ✅ Nanoleaf Canvas (Light Squares)
- ✅ Nanoleaf Aurora (Light Triangles)
- ✅ Nanoleaf Lines (Light Bars)

### Features
✅ **Device Discovery**: Automatic network discovery via mDNS  
✅ **Authentication**: Secure pairing with touch-link method  
✅ **Power Control**: Turn devices on/off  
✅ **Brightness Control**: Adjust brightness 0-100%  
✅ **Color Control**: Full HSL color spectrum  
✅ **Color Temperature**: Warm to cool white (1200K-6500K)  
✅ **Dynamic Effects**: Built-in and custom animations  
✅ **Identify Function**: Flash device to identify  
✅ **Panel Layout**: Get physical layout information (panels only)  

### Setup Instructions

1. **Install the package**:
   ```bash
   npm install nanoleaf-client-multi
   ```

2. **Discover devices**:
   - Open the Nanoleaf page in SmartHouse 2524
   - Click "Discover Devices"
   - Your Nanoleaf devices will appear with their IP addresses

3. **Authenticate**:
   - Click "Authenticate" on your device
   - Hold the power button on your Nanoleaf device for 5-7 seconds
   - The LED will start flashing to indicate pairing mode
   - Click "Authenticate" in the dialog within 30 seconds
   - Save the auth token displayed (stored automatically)

4. **Start Controlling**:
   - All device controls will be available immediately
   - Adjust brightness, color, and effects
   - Apply dynamic lighting effects with one click

### API Endpoints

```
GET  /api/nanoleaf/discover                       - Discover Nanoleaf devices
POST /api/nanoleaf/authenticate                   - Authenticate with device
POST /api/nanoleaf/connect                        - Connect with existing token
GET  /api/nanoleaf/:ip/info                       - Get device information
GET  /api/nanoleaf/:ip/state                      - Get current state
POST /api/nanoleaf/:ip/power                      - Control power on/off
POST /api/nanoleaf/:ip/brightness                 - Set brightness (0-100)
POST /api/nanoleaf/:ip/color                      - Set color (HSL)
POST /api/nanoleaf/:ip/color-temp                 - Set color temperature (1200-6500K)
GET  /api/nanoleaf/:ip/effects                    - Get available effects
POST /api/nanoleaf/:ip/effects/:effectName        - Apply dynamic effect
POST /api/nanoleaf/:ip/identify                   - Identify device (flash)
```

### Example Usage

```javascript
// Discover devices
GET /api/nanoleaf/discover

// Authenticate (device must be in pairing mode)
POST /api/nanoleaf/authenticate
{
  "ip": "192.168.1.100"
}

// Turn on device
POST /api/nanoleaf/192.168.1.100/power
{
  "state": true
}

// Set color to red
POST /api/nanoleaf/192.168.1.100/color
{
  "hue": 0,
  "saturation": 100,
  "lightness": 50
}

// Set warm white
POST /api/nanoleaf/192.168.1.100/color-temp
{
  "temperature": 2700
}

// Apply dynamic effect
POST /api/nanoleaf/192.168.1.100/effects/Northern%20Lights
```

### Color Controls

**HSL Color Model:**
- `hue` - Color hue (0-360 degrees)
- `saturation` - Color saturation (0-100%)
- `lightness` - Brightness level (0-100%)

**Color Temperature:**
- Range: 1200K (warm) to 6500K (cool)
- Typical values: 2700K (warm white), 4000K (neutral), 6000K (cool white)

**Preset Colors:**
- Red (0°), Orange (30°), Yellow (60°), Green (120°)
- Cyan (180°), Blue (240°), Purple (270°), Magenta (300°)
- White (saturation = 0%)

### Dynamic Effects

Nanoleaf devices come with built-in dynamic effects:
- **Fireworks** - Animated bursts of color
- **Forest** - Flowing green nature colors  
- **Nemo** - Ocean-inspired blue movements
- **Northern Lights** - Aurora borealis simulation
- **Rhythm** - Music-responsive lighting (if rhythm module installed)
- **Snowfall** - Gentle white cascading effect

### Troubleshooting

**Device Not Found:**
- Ensure device is connected to same Wi-Fi network
- Check device is powered on and functioning
- Verify network allows mDNS/Bonjour traffic
- Try manual IP entry if auto-discovery fails

**Authentication Failed:**
- Device must be in pairing mode (LED flashing)
- Hold power button for 5-7 seconds until LED flashes
- Complete authentication within 30 seconds
- Ensure no other apps are trying to connect simultaneously

**Commands Not Responding:**
- Verify authentication token is valid
- Check device is powered on
- Network connectivity may be poor
- Try re-authenticating if problems persist

**Effects Not Available:**
- Some effects are model-specific
- Check device firmware is up to date
- Custom effects may need to be installed via Nanoleaf app
- Rhythm effects require rhythm module

**Color Not Accurate:**
- Nanoleaf uses HSL color model vs RGB
- Some colors may appear different than expected
- Use color temperature for precise whites
- Brightness affects color perception

---

## �🔊 Amazon Alexa (Echo Devices)

### Overview
Amazon Alexa powers the Echo family of smart speakers and displays. SmartHouse 2524 provides control via the Alexa cloud API for voice commands, music playback, and smart home routines.

### Package Information
- **NPM Package**: `alexa-remote2` (v8.0.4)
- **Installation**: `npm install alexa-remote2`
- **Documentation**: https://www.npmjs.com/package/alexa-remote2

### Supported Devices
- ✅ Amazon Echo Dot (All Generations)
- ✅ Amazon Echo (All Generations)
- ✅ Amazon Echo Show (All Models)
- ✅ Amazon Echo Studio
- ✅ Amazon Echo Plus
- ✅ Amazon Echo Flex
- ✅ Amazon Echo Auto

### Features
✅ **Device Discovery**: Get all Echo devices on account  
✅ **Text-to-Speech**: Make Alexa speak custom messages  
✅ **Music Control**: Play/pause music, search songs/artists  
✅ **Volume Control**: Adjust volume 0-100  
✅ **Custom Commands**: Send any Alexa voice command  
✅ **Routines**: Execute Alexa routines programmatically  
✅ **Notifications**: Get notifications and reminders  
✅ **Cloud-based**: Works from anywhere  

### Setup Instructions

1. **Install the package**:
```bash
npm install alexa-remote2
```

2. **Add credentials to .env**:
```env
ALEXA_EMAIL=your_amazon_email@example.com
ALEXA_PASSWORD=your_amazon_password
```

3. **Important Notes**:
   - This uses an unofficial API
   - May require 2FA code entry on first login
   - Cookie is automatically refreshed

4. **Restart server** to load credentials

### API Endpoints

```
GET  /api/alexa/devices                          - Get all Echo devices
POST /api/alexa/devices/:serialNumber/speak      - Text-to-speech
POST /api/alexa/devices/:serialNumber/play       - Play music
POST /api/alexa/devices/:serialNumber/pause      - Pause playback
POST /api/alexa/devices/:serialNumber/volume     - Set volume
POST /api/alexa/devices/:serialNumber/command    - Send custom command
GET  /api/alexa/devices/:serialNumber/status     - Get device status
GET  /api/alexa/notifications                    - Get notifications
GET  /api/alexa/routines                         - Get routines
POST /api/alexa/routines/:utteranceId/execute    - Execute routine
```

### Example Usage

```javascript
// Get all devices
GET /api/alexa/devices

// Make Echo speak
POST /api/alexa/devices/G000XX12345678/speak
{
  "text": "Hello, your package has arrived"
}

// Play music
POST /api/alexa/devices/G000XX12345678/play
{
  "query": "play Taylor Swift on Spotify"
}

// Set volume to 50%
POST /api/alexa/devices/G000XX12345678/volume
{
  "volume": 50
}

// Send custom command
POST /api/alexa/devices/G000XX12345678/command
{
  "command": "What's the weather today?"
}

// Execute a routine
POST /api/alexa/routines/amzn1.alexa.routine.xxx/execute
```

### Use Cases

**Home Announcements:**
```javascript
// Announce to all Echo devices
await axios.post('/api/alexa/devices/G000XX12345678/speak', {
  text: "Dinner is ready!"
});
```

**Music Automation:**
```javascript
// Start morning playlist
await axios.post('/api/alexa/devices/G000XX12345678/play', {
  query: "play morning playlist"
});
```

**Voice Notifications:**
```javascript
// Security alert
await axios.post('/api/alexa/devices/G000XX12345678/speak', {
  text: "Alert: Motion detected at front door"
});
```

### Troubleshooting

**Authentication Failed:**
- Verify ALEXA_EMAIL and ALEXA_PASSWORD in .env file
- Check credentials work on Amazon.com
- May need to complete 2FA verification
- Cookie file is stored in project root

**Devices Not Found:**
- Ensure devices are registered to your Amazon account
- Check all devices are online in Alexa app
- Restart server to refresh device list

**Commands Not Working:**
- Device must be online
- Check volume is not muted
- Verify device is not already playing content
- API has 1-2 second delay (cloud-based)

**2FA Issues:**
- First login may prompt for 2FA code
- Enter code when prompted in console
- Cookie is saved for future use
- Cookie expires after ~2 weeks

**Rate Limiting:**
- Amazon may throttle excessive requests
- Limit commands to 1 per second per device
- Distribute commands across multiple devices

---

## 🏠 Google Home & Nest Devices

### Overview
Google Home and Nest devices use the Google Cast protocol for communication. SmartHouse 2524 provides local network control for announcements, media playback, and notifications.

### Package Information
- **NPM Packages**: `castv2-client` (v1.2.0), `google-tts-api` (v0.0.4)
- **Installation**: `npm install castv2-client google-tts-api`
- **Documentation**: https://www.npmjs.com/package/castv2-client

### Supported Devices
- ✅ Google Nest Audio
- ✅ Google Nest Mini (All Generations)
- ✅ Google Nest Hub (All Models)
- ✅ Google Nest Hub Max
- ✅ Google Home (Original)
- ✅ Google Home Mini
- ✅ Google Home Max
- ✅ Chromecast with Google TV
- ✅ Chromecast Audio

### Features
✅ **Auto-Discovery**: Google Cast device discovery  
✅ **Text-to-Speech**: Send announcements to devices  
✅ **Media Playback**: Play audio URLs (MP3, streams)  
✅ **Volume Control**: Adjust volume via Cast protocol  
✅ **Stop Playback**: Stop current media  
✅ **Multi-language**: Supports multiple TTS languages  
✅ **Local Protocol**: Works on local network  

### Setup Instructions

1. **Install the packages**:
```bash
npm install castv2-client google-tts-api
```

2. **Network Requirements**:
   - Devices must be on same network
   - Google Cast traffic must be allowed
   - Port 8009 must be accessible

3. **Discovery**:
   - Click "Discover" to scan network
   - Or manually add devices by IP address

4. **No credentials required** - works via local Cast protocol

### API Endpoints

```
GET  /api/google-home/devices                    - Get all devices
POST /api/google-home/discover                   - Discover devices
POST /api/google-home/add-device                 - Add device manually
POST /api/google-home/devices/:host/speak        - Text-to-speech
POST /api/google-home/devices/:host/play         - Play media URL
POST /api/google-home/devices/:host/volume       - Set volume
POST /api/google-home/devices/:host/stop         - Stop playback
GET  /api/google-home/devices/:host/status       - Get device status
```

### Example Usage

```javascript
// Discover devices
POST /api/google-home/discover

// Add device manually
POST /api/google-home/add-device
{
  "name": "Living Room Speaker",
  "host": "192.168.1.100",
  "port": 8009
}

// Send announcement
POST /api/google-home/devices/192.168.1.100/speak
{
  "text": "Dinner is ready!",
  "language": "en"
}

// Play audio
POST /api/google-home/devices/192.168.1.100/play
{
  "url": "http://example.com/audio.mp3"
}

// Set volume to 60%
POST /api/google-home/devices/192.168.1.100/volume
{
  "volume": 60
}

// Stop playback
POST /api/google-home/devices/192.168.1.100/stop
```

### Supported TTS Languages
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `ja` - Japanese
- `ko` - Korean
- `zh-CN` - Chinese (Simplified)
- And many more...

### Use Cases

**Home Announcements:**
```javascript
// Announce to all devices
await axios.post('/api/google-home/devices/192.168.1.100/speak', {
  text: "The kids are home from school"
});
```

**Security Alerts:**
```javascript
// Motion detected alert
await axios.post('/api/google-home/devices/192.168.1.100/speak', {
  text: "Motion detected at the front door"
});
```

**Music/Radio:**
```javascript
// Play internet radio
await axios.post('/api/google-home/devices/192.168.1.100/play', {
  url: "http://stream.radioparadise.com/mp3-192"
});
```

### Troubleshooting

**Devices Not Discovered:**
- Ensure devices are powered on
- Check firewall allows mDNS (port 5353)
- Verify devices are on same network subnet
- Try manual IP entry instead

**TTS Not Working:**
- Check internet connection (Google TTS requires internet)
- Verify device is not muted
- Try adjusting volume first
- Check device is not already playing content

**Media Playback Issues:**
- URL must be publicly accessible
- Supported formats: MP3, AAC, FLAC, WAV
- Some streams may not work due to codec support
- Try different audio source

**Volume Control Failed:**
- Requires `castv2-client` package
- Check device is responding to Cast commands
- Try restarting the device

**Discovery Takes Long:**
- Normal discovery time is 5-10 seconds
- Some devices may not broadcast immediately
- Retry discovery or add manually

---

#### Nest Thermostats & Cameras
- **Package**: `nest-api`
- **Installation**: `npm install nest-api`
- **Features**: Thermostat control, camera streaming

#### IKEA TRÅDFRI
- **Package**: `node-tradfri-client`
- **Installation**: `npm install node-tradfri-client`
- **Features**: IKEA smart lights, blinds, plugs

#### Belkin WeMo
- **Package**: `wemo-client`
- **Installation**: `npm install wemo-client`
- **Features**: Smart plugs and switches

#### Yeelight
- **Package**: `yeelight-platform`
- **Installation**: `npm install yeelight-platform`
- **Features**: Xiaomi Yeelight bulbs and strips

#### Tuya/Smart Life Devices
- **Package**: `tuyapi`
- **Installation**: `npm install tuyapi`
- **Features**: Generic Tuya-based devices

#### Epson Printers
- **Package**: None (HTTP/SNMP)
- **Installation**: Built-in support
- **Features**: Status monitoring, ink levels (web interface)

---

## 🔧 Adding New Device Support

To add support for a new device type:

1. **Create a route file**: `server/routes/devicename.js`
2. **Add graceful error handling**:
   ```javascript
   let DeviceAPI = null;
   try {
     DeviceAPI = require('device-package');
   } catch (error) {
     console.log('⚠️ Package not installed');
   }
   ```

3. **Create API endpoints** with proper error responses
4. **Update device discovery**: Add detection in `deviceDiscovery.js`
5. **Create React page**: `client/src/pages/DevicenamePage.js`
6. **Add routes** to `App.js` and sidebar

### Example Route Template

```javascript
const express = require('express');
const router = express.Router();

let DeviceAPI = null;
try {
  DeviceAPI = require('device-package');
  console.log('✓ Device package loaded successfully');
} catch (error) {
  console.log('⚠️ Device package not installed. Run: npm install device-package');
}

router.get('/discover', async (req, res) => {
  if (!DeviceAPI) {
    return res.status(503).json({
      error: 'Device package not installed',
      message: 'Install with: npm install device-package',
      installed: false
    });
  }
  
  // Discovery logic here
});

module.exports = router;
```

---

## 📊 Comparison Table

| Device | Auto-Discovery | Cloud API | Local API | Energy Monitor | Color Control |
|--------|---------------|-----------|-----------|----------------|---------------|
| Philips Hue | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ✅ Yes |
| TP-Link Kasa | ✅ Yes | ✅ Yes | ✅ Yes | ✅ HS110 | ✅ Bulbs |
| Sonos | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ❌ N/A |
| Samsung TV | ✅ Yes | ✅ Optional | ✅ Yes | ❌ No | ❌ N/A |
| Apple TV | ⚠️ Manual | ❌ No | ✅ Yes | ❌ No | ❌ N/A |
| Ring | ❌ Manual | ✅ Yes | ❌ No | ❌ No | ❌ N/A |
| Eero | ❌ Manual | ✅ Yes | ❌ No | ❌ No | ❌ N/A |

---

## 🆘 Troubleshooting

### Package Not Installed Errors
If you see `⚠️ Package not installed` messages:
```bash
npm install node-hue-api tplink-smarthome-api sonos ring-client-api samsung-tv-control
```

### Devices Not Discovered
1. Ensure devices are on the same network
2. Check firewall settings (allow UDP/mDNS traffic)
3. Try manual IP entry
4. Use the subnet scanner feature

### Authentication Failures
- **Hue**: Press link button within 30 seconds
- **Ring**: Use correct email/password, may require 2FA
- **Eero**: Unofficial API may have limitations

### Connection Issues
- Verify device IP addresses haven't changed
- Check if device is online and reachable
- Restart the device
- Restart SmartHouse 2524 server

---

## 📖 Additional Resources

- [Philips Hue Developer Docs](https://developers.meethue.com/)
- [TP-Link Kasa API Documentation](https://github.com/plasticrake/tplink-smarthome-api)
- [Sonos Developer Portal](https://developer.sonos.com/)
- [SmartThings API (Samsung)](https://developer.smartthings.com/)
## 📋 Complete Device Catalog (250 Devices)

### 1. Smart Speakers & Displays (20 devices)
- [x] **Amazon Echo Dot (5th Gen)** ✅ *Supported via Alexa API*
- [x] **Amazon Echo Show 8 (3rd Gen)** ✅ *Supported via Alexa API*
- [x] **Google Nest Audio** ✅ *Supported via Google Cast*
- [x] **Google Nest Hub (2nd Gen)** ✅ *Supported via Google Cast*
- [ ] Apple HomePod Mini
- [x] **Amazon Echo (4th Gen)** ✅ *Supported via Alexa API*
- [x] **Google Nest Mini (2nd Gen)** ✅ *Supported via Google Cast*
- [x] **Amazon Echo Show 15** ✅ *Supported via Alexa API*
- [x] **Sonos Era 100** ✅ *Supported via Sonos API*
- [ ] Apple HomePod (2nd Gen)
- [x] **Amazon Echo Show 5** ✅ *Supported via Alexa API*
- [x] **Google Nest Hub Max** ✅ *Supported via Google Cast*
- [x] **Sonos One** ✅ *Supported via Sonos API*
- [x] **Amazon Echo Studio** ✅ *Supported via Alexa API*
- [ ] Bose Home Speaker 500
- [x] **Sonos Roam** ✅ *Supported via Sonos API*
- [x] **Amazon Echo Dot with Clock** ✅ *Supported via Alexa API*
- [ ] Lenovo Smart Display
- [ ] Facebook Portal Mini
- [ ] JBL Link View

### 2. Smart Light Bulbs (30 devices)
- [x] **Philips Hue White & Color A19** ✅ *Supported via Hue API*
- [ ] TP-Link Tapo L535E (Matter)
- [ ] Wiz Tunable Bulb
- [ ] AiDot Linkind Matter Bulb
- [x] **Nanoleaf Essentials A19** ✅ *Supported via Nanoleaf API*
- [ ] Govee RGBIC Bulb
- [x] **Wyze Bulb Color** ✅ *Supported via Wyze API*
- [ ] Sengled Color Bulb
- [x] **LIFX Color A19** ✅ *Supported via LIFX LAN*
- [ ] GE Cync Full Color
- [ ] Meross MSL120
- [ ] Yeelight Color Bulb
- [ ] IKEA Tradfri Color
- [ ] Sylvania Smart+ A19
- [ ] Feit Electric Color Bulb
- [x] **Kasa KL130** ✅ *Supported via TP-Link API*
- [ ] Eve Energy Bulb (Thread)
- [x] **Nanoleaf Matter BR30** ✅ *Supported via Nanoleaf API*
- [x] **Philips Hue Filament** ✅ *Supported via Hue API*
- [ ] Govee Lynx Dream
- [ ] Tapo L630
- [ ] Wiz Color A21
- [ ] Linkind BR30 Floodlight
- [ ] Treatlife Color Bulb
- [ ] Nooie Color Bulb
- [ ] Avatar Controls Bulb
- [ ] Lumary RGBAI Bulb
- [ ] Eufy Lumos Bulb
- [ ] Cree Lighting Bulb
- [ ] EcoSmart A19

### 3. Smart Plugs & Outlets (25 devices)
- [x] **TP-Link Kasa HS103 (Matter)** ✅ *Supported via TP-Link API*
- [ ] Amazon Smart Plug
- [x] **Wyze Plug Outdoor** ✅ *Supported via Wyze API*
- [ ] Meross Outdoor Plug
- [ ] Eve Energy (Thread/Matter)
- [ ] Govee Smart Plug
- [ ] BN-Link Smart Plug
- [ ] Leviton Decora Plug
- [x] **Wemo Mini Plug** ✅ *Supported via WeMo API*
- [ ] Geeni Outdoor Plug
- [x] **Kasa EP40 Outdoor** ✅ *Supported via TP-Link API*
- [ ] Ring Outdoor Plug
- [ ] Tapo P125M (Matter)
- [ ] Sengled Outdoor Plug
- [ ] Lutron Caseta Plug
- [ ] iHome Outdoor Plug
- [ ] Nooie Plug
- [ ] Treatlife Plug
- [ ] Avatar Controls Plug
- [ ] Sonoff S31
- [ ] Shelly Plug
- [ ] Aqara Plug
- [ ] Eve Outdoor Plug
- [x] **Philips Hue Outdoor Plug** ✅ *Supported via Hue API*
- [x] **WeMo Devices** ✅ *Supported via WeMo API* 

### 4. Smart Security Cameras (30 devices)
- [ ] Arlo Pro 6
- [ ] Google Nest Cam (Battery)
- [x] **Ring Stick Up Cam Battery** ✅ *Supported via Ring API*
- [ ] Eufy Indoor Cam E220
- [x] **Wyze Cam v4** ✅ *Supported via Wyze API*
- [ ] Blink Outdoor 4
- [ ] TP-Link Tapo C120
- [ ] Lorex 2K Camera
- [ ] Reolink Argus 4 Pro
- [ ] Eufy SoloCam S340
- [ ] Arlo Essential Indoor
- [x] **Ring Indoor Cam** ✅ *Supported via Ring API*
- [ ] Nest Cam Indoor
- [ ] Aqara G3 Camera Hub
- [ ] Ecobee SmartCamera
- [x] **Wyze Cam Pan v3** ✅ *Supported via Wyze API*
- [ ] Blink Mini 2
- [ ] TP-Link Tapo C210
- [ ] Eufy Cam 3
- [ ] SimpliSafe Outdoor Camera
- [ ] Swann 4K Camera
- [ ] Amcrest 4K Camera
- [ ] Defender GO 2K
- [ ] Psync Genie S
- [ ] Aqara G5 Pro
- [x] **Ring Floodlight Cam** ✅ *Supported via Ring API*
- [ ] Google Nest Doorbell (Wired)
- [ ] Arlo Video Doorbell
- [ ] Eufy Video Doorbell
- [x] **Ring Battery Doorbell Plus** ✅ *Supported via Ring API*

### 5. Smart Thermostats (15 devices)
- [ ] Google Nest Learning Thermostat (4th Gen)
- [ ] Ecobee Smart Thermostat Premium
- [ ] Amazon Smart Thermostat
- [ ] Honeywell Home T10
- [ ] Ecobee Essential
- [ ] Nest Thermostat E
- [ ] Sensi Touch
- [x] **Wyze Thermostat** ✅ *Supported via Wyze API*
- [ ] Mysa for Baseboard
- [ ] Emerson Sensi
- [ ] Vine Smart Thermostat
- [ ] Bosch BCC100
- [ ] Lux Geo
- [ ] Johnson Controls GLAS
- [ ] Sinope TH1124ZB

### 6. Smart Locks & Doorbells (25 devices)
- [ ] Yale Assure Lock 2
- [ ] August Wi-Fi Smart Lock
- [ ] Schlage Encode Plus
- [ ] Ultraloq U-Bolt Pro
- [ ] Eufy Smart Lock S3 Max
- [ ] Aqara U100
- [ ] Level Lock+
- [ ] Kwikset Halo Touch
- [ ] Philips 7000 Series Doorbell
- [x] **Ring Battery Doorbell Pro** ✅ *Supported via Ring API*
- [ ] Google Nest Doorbell (Battery)
- [ ] Arlo Video Doorbell
- [ ] Eufy Dual Camera Doorbell
- [ ] Lorex 2K Doorbell
- [ ] TP-Link Tapo Doorbell
- [ ] Blink Video Doorbell
- [ ] SwannBuddy4K
- [ ] Ecobee Smart Doorbell
- [ ] SimpliSafe Doorbell
- [ ] Vivint Doorbell
- [ ] Yale Approach Lock
- [ ] Nuki Smart Lock
- [ ] Lockly Secure Pro
- [ ] SwitchBot Lock Ultra
- [ ] Defender GO 2K Doorbell

### 7. Robot Vacuums & Mops (30 devices)
- [ ] Ecovacs Deebot X9 Pro Omni
- [x] **Roborock Qrevo Curv** ✅ *Supported via miIO*
- [ ] Dreame X50 Ultra
- [ ] Eufy S1 Pro
- [ ] Narwal Freo Z Ultra
- [ ] Yeedi S20 Infinity
- [ ] iRobot Roomba Combo j9+
- [ ] Shark PowerDetect
- [x] **Roborock S8 Pro Ultra** ✅ *Supported via miIO*
- [ ] Ecovacs Deebot T30 Omni
- [ ] Dreame L40 Ultra
- [ ] Eufy E20 3-in-1
- [ ] Yeedi M12 Pro+
- [x] **Roborock Saros Z70** ✅ *Supported via miIO*
- [ ] Tapo RV30 Max Plus
- [x] **Wyze Robot Vacuum** ✅ *Supported via Wyze API*
- [ ] Shark Matrix Plus
- [ ] Eufy Clean X9
- [ ] iRobot Roomba 205
- [ ] Bissell SpinWave Robot
- [ ] Lefant M320
- [ ] Honiture Q6 Pro
- [ ] ILife V3s Pro
- [ ] Anker Eufy RoboVac 11S
- [ ] Samsung Jet Bot AI+
- [ ] Neato D10
- [ ] Proscenic M9
- [ ] 3i S10 Ultra
- [x] **Roborock Q7 M5+** ✅ *Supported via miIO*
- [ ] Yeedi C12 Plus

### 8. Smart Sensors (Motion, Door, Leak, etc.) (20 devices)
- [ ] Aqara Motion Sensor P1
- [x] **Philips Hue Motion Sensor** ✅ *Supported via Hue API*
- [ ] Eve Motion (Thread)
- [ ] TP-Link Tapo Motion Sensor
- [ ] Aqara Door/Window Sensor P2
- [ ] Eve Door & Window
- [ ] YoLink Door Sensor
- [ ] Aqara Water Leak Sensor
- [ ] Govee Water Sensor
- [ ] Honeywell Leak Detector
- [ ] Centralite Motion Sensor
- [ ] Sonoff Motion Sensor
- [ ] IKEA Tradfri Motion
- [ ] Arlo All-in-One Sensor
- [ ] Ring Contact Sensor
- [ ] SimpliSafe Entry Sensor
- [x] **Wyze Motion Sensor** ✅ *Supported via Wyze API*
- [ ] Ecobee SmartSensor
- [ ] Fibaro Motion Sensor
- [ ] Sengled Motion Sensor

### 9. LED Light Strips & Switches/Dimmers (30 devices)
- [ ] Govee M1 Strip (Matter)
- [x] **Philips Hue Lightstrip** ✅ *Supported via Hue API*
- [ ] TP-Link Tapo L930
- [ ] Govee Neon Rope 2
- [ ] Nanoleaf Essentials Strip
- [ ] Lutron Caseta Dimmer
- [ ] Leviton Decora Dimmer
- [ ] Kasa HS220 Dimmer
- [ ] Meross Dimmer
- [ ] Wemo Dimmer
- [ ] GE Cync Dimmer
- [ ] Treatlife Dimmer
- [ ] Eve Light Switch (Thread)
- [x] **Philips Hue Tap Dial Switch** ✅ *Supported via Hue API*
- [ ] Lutron Diva Dimmer
- [ ] Onforu Warm White Strip
- [ ] Daybetter Tunable Strip
- [ ] Wobane Under Cabinet Kit
- [ ] Govee Warm White Strip
- [ ] Yeelight Obsid RGBIC Strip
- [x] **LIFX Lightstrip** ✅ *Supported via LIFX LAN*
- [ ] Sengled Strip
- [ ] Wyze Light Strip Pro
- [x] **Kasa KL430 Strip** ✅ *Supported via TP-Link API*
- [ ] Twinkly Flex
- [ ] Monster RGB Strip
- [ ] HitLights Strip
- [ ] Lepro RGBIC Strip
- [ ] Corsair iCUE Strip
- [ ] Elgato Light Strip

### 10. Smart Hubs & Bridges (15 devices)
- [ ] Amazon Echo Hub
- [ ] Google Nest Hub
- [ ] Apple HomePod Mini (Thread Router)
- [x] **Philips Hue Bridge Pro** ✅ *Supported via Hue API*
- [ ] Aqara M3 Hub
- [ ] Samsung SmartThings Station
- [ ] Lutron Caseta Hub
- [ ] Sonoff ZBBridge-U
- [ ] Aqara Hub E1
- [ ] SwitchBot Hub 2 (Matter)
- [ ] Eve Thread Hub
- [ ] Zigbee2MQTT Dongle
- [ ] Home Assistant Green
- [ ] Tuya Zigbee Hub
- [x] **Aeotec SmartThings Hub** ✅ *Supported via SmartThings API*

### 11. Miscellaneous Smart Devices (10 devices)
- [ ] Amazon Fire TV Stick 4K
- [ ] Roku Streaming Stick
- [x] **Sonos Beam Soundbar** ✅ *Supported via Sonos API*
- [ ] Nest Protect Smoke Detector
- [ ] Eufy Smart Scale
- [x] **Philips Hue Outdoor Lights** ✅ *Supported via Hue API*
- [x] **Ring Floodlight** ✅ *Supported via Ring API*
- [ ] Wyze Thermostat
- [ ] August Smart Lock Retrofit
- [ ] Ballie AI Robot (Samsung, emerging)

### 11.5. Smart Appliances (10 devices)
- [x] **Samsung Smart Washer** ✅ *Supported via SmartThings API*
- [ ] Samsung Smart Dryer
- [ ] GE Smart Washer
- [ ] GE Smart Dryer
- [ ] Whirlpool Smart Washer
- [ ] LG Smart Washer
- [ ] Samsung Smart Refrigerator
- [ ] LG Smart Refrigerator
- [ ] Samsung Smart Oven
- [ ] GE Smart Dishwasher

### 12. Smart TVs & Streaming (Additional)
- [x] **Samsung Smart TVs (2016+)** ✅ *Supported via Samsung TV Control*
- [x] **Apple TV 4K** ✅ *Supported via pyatv*
- [x] **LG webOS TVs** ✅ *Supported via lgtv2*
- [ ] Sony Bravia TVs
- [ ] Vizio SmartCast TVs

### 13. Network Equipment (Additional)
- [x] **Eero Mesh Network** ✅ *Supported via Eero API*
- [ ] Google Nest Wifi Pro
- [ ] TP-Link Deco Mesh
- [ ] Netgear Orbi
- [ ] AmpliFi Mesh

---

## 📊 Support Summary

### Currently Supported (33 devices/families)
1. ✅ Philips Hue (Bulbs, Strips, Lights, Bridge, Motion Sensors, Switches)
2. ✅ TP-Link Kasa (Smart Plugs, Bulbs, Light Strips)
3. ✅ LIFX (Smart Bulbs, Light Strips)
4. ✅ Wyze (Cameras, Bulbs, Plugs, Sensors, Thermostats)
5. ✅ Xiaomi miIO (Roborock Vacuums, Air Purifiers)
6. ✅ Amazon Alexa (Echo Devices, Echo Shows, Echo Dots)
7. ✅ Google Home/Nest (Nest Audio, Nest Hub, Nest Mini, Chromecast)
8. ✅ Sonos (All Speakers, Soundbars, Amps)
9. ✅ Ring (Doorbells, Cameras, Floodlight Cam)
10. ✅ Samsung Smart TVs
11. ✅ LG webOS Smart TVs
12. ✅ Apple TV
13. ✅ Eero Mesh Network
14. ✅ Belkin WeMo (Smart Plugs, Switches)
15. ✅ Generic IP Cameras (RTSP/HTTP)
16. ✅ Samsung Smart Washer (SmartThings API)
17. ✅ GE SmartHQ Appliances (Refrigerators, Ovens, Dishwashers, Laundry)
18. ✅ Samsung SmartThings Appliances (Family Hub Refrigerators, Ovens, Laundry)

### Not Yet Supported (214+ devices)
All other devices listed above are candidates for future integration.

---

**Last Updated**: December 30, 2025  
**SmartHouse 2524 Version**: 1.0.0  
**Total Devices Cataloged**: 260+  
**Currently Supported**: 33 device families  
**Support Coverage**: ~13%

---

## 📝 Implementation Notes

### TV Support Pattern
Samsung, LG webOS, and Vizio SmartCast TVs all follow similar control patterns:
- Power on/off
- Volume control  
- Input switching
- App launching
- Remote navigation

**Note**: While Vizio SmartCast has an available NPM package (`vizio-smart-cast`), it follows the same pattern as Samsung and LG implementations. Adding Vizio support would be straightforward using the existing TV control architecture.

### Smart Bulb Consolidation
Philips Hue, TP-Link Kasa bulbs, and LIFX bulbs are all fully supported with:
- HSB/RGB color control
- Brightness adjustment
- On/off control
- Scene/effect support

### Future Expansion Priorities
1. ✅ **Robot Vacuums** (Roborock) - COMPLETED
2. ✅ **Additional Camera Brands** (Wyze) - COMPLETED
3. ✅ **Smart Appliances** (GE, Samsung) - COMPLETED  
4. **Thermostats** (Nest, Ecobee) - High value for smart home control
5. **Smart Locks** (August, Yale) - Security integration
6. **Additional Voice Assistants** - Enhanced voice control integration

---

**Last Updated**: December 30, 2025  
**SmartHouse 2524 Version**: 1.0.0
