# SmartHouse 2524 - Smart Home Control System

## Project Overview

A comprehensive, full-stack smart home control system built with React.js and Node.js for managing and monitoring diverse smart home devices including lights, switches, cameras, speakers, and more from a single unified dashboard.

## Supported Devices

- **Lighting**: Philips Hue lights, LIFX bulbs, Wyze lights
- **Switches & Plugs**: TP-Link Kasa devices
- **Cameras**: Wyze cameras, Ring doorbells
- **Speakers**: Sonos speakers and amps
- **Displays**: Apple TVs, Samsung Smart TVs, LG webOS TVs
- **Networks**: Eero mesh networks
- **IoT Devices**: Xiaomi miIO devices
- **Other**: Ring security cameras, and more

## Features

- **Unified Dashboard**: Control all devices from one interface
- **Device Grouping**: Organize devices by room or function
- **Automation**: Create scenes and automation routines
- **Real-Time Status**: Live device status and control
- **Multi-Platform**: Works on desktop, tablet, and mobile
- **Voice Integration**: Support for smart voice commands
- **History & Analytics**: Track device usage patterns

## Architecture

### Frontend (React.js)
- Dashboard with device cards
- Real-time status updates
- Device control interface
- Scene/automation builder
- Settings and configuration

### Backend (Node.js)
- Device API integrations
- WebSocket for real-time updates
- Database for device state
- Authentication and security
- Automation engine

## Tech Stack

- **Frontend**: React 18+ with Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB or PostgreSQL
- **Real-Time**: WebSocket for live updates
- **APIs**: Integration with device cloud APIs
- **Styling**: Tailwind CSS or Material-UI

## Deployment Status

- **Status**: Active Development
- **GitHub**: [yerry262/SmartHouse2524](https://github.com/yerry262/SmartHouse2524)
- **Package Name**: smarthouse2524

## How to Use

### Setup

1. Clone the repository
2. Install backend dependencies: `cd backend && npm install`
3. Install frontend dependencies: `cd frontend && npm install`
4. Configure device credentials (API keys for each device type)
5. Run backend: `npm start`
6. Run frontend: `npm run dev`

### Adding Devices

1. Go to Settings in the dashboard
2. Select device type to add
3. Authenticate with device cloud service
4. Name and assign to room
5. Device appears in dashboard

### Creating Automation

1. Click "Create Scene" or "New Automation"
2. Select trigger (time, device state, etc.)
3. Select actions (turn on/off, set brightness, etc.)
4. Name and save automation

## API Integration Examples

```javascript
// Philips Hue integration
hueService.turnOn(lightId);
hueService.setBrightness(lightId, 100);

// TP-Link Kasa integration
kasaService.toggleSwitch(deviceId);
kasaService.getPowerUsage(deviceId);

// Sonos speaker control
sonosService.play(speakerId, track);
sonosService.setVolume(speakerId, 50);
```

## Device Control Capabilities

- **Turn On/Off**: All devices
- **Brightness**: Lights and dimmers
- **Color Control**: RGB lights
- **Volume**: Speakers
- **Channel/Input**: TVs and displays
- **Recording**: Cameras and security
- **Temperature**: Smart thermostats (if integrated)

## Code Style

- Modular device adapters for each brand
- Clean React component architecture
- RESTful API endpoints
- Secure authentication patterns

## Known Limitations

- Requires device cloud API credentials
- Some devices may not have full feature support
- Response time depends on internet connection and device cloud
- Automation complexity limited by event system

## Future Enhancements

- Local device control (without cloud)
- Energy monitoring and optimization
- AI-powered automation learning
- Voice control integration (Alexa, Google Home)
- Mobile app version
- Advanced scheduling
- Device firmware updates
- Multi-user access control

## Security Considerations

- Never commit API keys or credentials
- Use environment variables for secrets
- Secure WebSocket connections (WSS)
- Authentication required for all endpoints
- Device access logging and auditing

## Last Updated

2026-07-05
