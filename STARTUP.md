# SmartHouse2524 - Startup & Service Management

This document explains how to run SmartHouse2524 as a background service that auto-starts on boot and auto-restarts on crash.

## 🚀 Quick Start

### Start Services
```powershell
cd C:\Users\jerry\Desktop\SmartHouse2524
pm2 start ecosystem.config.js
```

### Check Status
```powershell
pm2 list
```

### View Logs
```powershell
# View all logs (live)
pm2 logs

# View last 50 lines
pm2 logs --lines 50

# View specific service logs
pm2 logs smarthouse-backend
pm2 logs smarthouse-frontend
```

---

## 📦 PM2 Process Manager

SmartHouse2524 uses **PM2** (Process Manager 2) to run as a background service with:
- ✅ Auto-restart on crash
- ✅ Auto-start on Windows boot
- ✅ Background execution (no terminal window needed)
- ✅ Log management
- ✅ Process monitoring

### Services
| Service | Port | Description |
|---------|------|-------------|
| `smarthouse-backend` | 5000 | Express.js API server |
| `smarthouse-frontend` | 3000 | React development server |

---

## 🛠️ Service Commands

### Using PowerShell Script
```powershell
cd C:\Users\jerry\Desktop\SmartHouse2524

# Check status
.\service.ps1 status

# Start services
.\service.ps1 start

# Stop services
.\service.ps1 stop

# Restart services
.\service.ps1 restart

# View logs
.\service.ps1 logs

# Install as Windows startup service
.\service.ps1 install

# Uninstall from Windows startup
.\service.ps1 uninstall
```

### Using PM2 Directly
```powershell
# Start all services
pm2 start ecosystem.config.js

# Stop all services
pm2 stop all

# Restart all services
pm2 restart all

# Delete all processes
pm2 delete all

# Save current process list (for startup restore)
pm2 save

# Monitor in real-time
pm2 monit
```

---

## 📋 Log Files

Logs are stored in `C:\Users\jerry\Desktop\SmartHouse2524\logs\`:

| File | Description |
|------|-------------|
| `backend-out.log` | Backend console output |
| `backend-error.log` | Backend errors |
| `frontend-out.log` | Frontend console output |
| `frontend-error.log` | Frontend errors |

### Viewing Logs
```powershell
# Live tail all logs
pm2 logs

# Last N lines (no live tail)
pm2 logs --lines 100 --nostream

# Backend only
pm2 logs smarthouse-backend --lines 50

# Clear all logs
pm2 flush
```

---

## 🔄 Auto-Start on Windows Boot

PM2 is configured to start automatically when Windows boots.

### Verify Startup Configuration
```powershell
# Check if PM2 startup is installed
pm2-startup status
```

### Re-install Startup (if needed)
```powershell
# Install PM2 Windows startup
npm install -g pm2-windows-startup
pm2-startup install

# Save current processes for restore on boot
pm2 save
```

### Remove from Startup
```powershell
pm2-startup uninstall
```

---

## ⚙️ Configuration

The PM2 configuration is in `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'smarthouse-backend',
      script: 'index.js',
      cwd: 'C:/Users/jerry/Desktop/SmartHouse2524/server',
      exec_mode: 'fork',
      autorestart: true,        // Auto-restart on crash
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      restart_delay: 3000,      // Wait 3s before restart
      max_restarts: 10,         // Max 10 restarts in min_uptime
      min_uptime: '10s',        // Consider started after 10s
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'smarthouse-frontend',
      script: 'node_modules/react-scripts/scripts/start.js',
      cwd: 'C:/Users/jerry/Desktop/SmartHouse2524/client',
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        BROWSER: 'none'         // Don't auto-open browser
      }
    }
  ]
};
```

---

## 🔍 Troubleshooting

### Services Not Starting
```powershell
# Check PM2 daemon status
pm2 ping

# Kill PM2 daemon and restart
pm2 kill
pm2 start ecosystem.config.js
```

### Port Already in Use
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process by PID
taskkill /PID <PID> /F
```

### View Detailed Process Info
```powershell
pm2 show smarthouse-backend
pm2 show smarthouse-frontend
```

### Reset Everything
```powershell
pm2 delete all
pm2 kill
pm2 start ecosystem.config.js
pm2 save
```

---

## 🌐 Access Points

Once running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

### Test API
```powershell
# Test backend is running
Invoke-RestMethod -Uri "http://localhost:5000/api/devices" -TimeoutSec 5

# Test Sonos discovery
Invoke-RestMethod -Uri "http://localhost:5000/api/sonos/discover" -TimeoutSec 10
```

---

## 📊 Monitoring

### Real-time Dashboard
```powershell
pm2 monit
```

This shows:
- CPU usage
- Memory usage
- Uptime
- Restart count
- Live logs

### Process Details
```powershell
pm2 describe smarthouse-backend
```

---

*Last Updated: December 31, 2025*
