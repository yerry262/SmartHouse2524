# SmartHouse2524 Service Management Script
# Run as: .\service.ps1 [start|stop|restart|status|logs]

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "install", "uninstall")]
    [string]$Action = "status"
)

$ProjectPath = "C:\Users\jerry\Desktop\SmartHouse2524"

function Show-Status {
    Write-Host "`n=== SmartHouse2524 Service Status ===" -ForegroundColor Cyan
    pm2 list
    Write-Host ""
}

function Start-Services {
    Write-Host "`nStarting SmartHouse2524 services..." -ForegroundColor Green
    Set-Location $ProjectPath
    pm2 start ecosystem.config.js
    pm2 save
    Show-Status
}

function Stop-Services {
    Write-Host "`nStopping SmartHouse2524 services..." -ForegroundColor Yellow
    pm2 stop all
    Show-Status
}

function Restart-Services {
    Write-Host "`nRestarting SmartHouse2524 services..." -ForegroundColor Cyan
    pm2 restart all
    pm2 save
    Show-Status
}

function Show-Logs {
    Write-Host "`n=== SmartHouse2524 Logs ===" -ForegroundColor Cyan
    pm2 logs --lines 50
}

function Install-Service {
    Write-Host "`nInstalling SmartHouse2524 as Windows service..." -ForegroundColor Green
    npm install -g pm2 pm2-windows-startup
    Set-Location $ProjectPath
    pm2 start ecosystem.config.js
    pm2 save
    pm2-startup install
    Write-Host "`n✅ Services installed and configured to start on boot!" -ForegroundColor Green
    Show-Status
}

function Uninstall-Service {
    Write-Host "`nUninstalling SmartHouse2524 Windows service..." -ForegroundColor Red
    pm2 stop all
    pm2 delete all
    pm2-startup uninstall
    Write-Host "`n✅ Services removed from startup!" -ForegroundColor Green
}

switch ($Action) {
    "start"     { Start-Services }
    "stop"      { Stop-Services }
    "restart"   { Restart-Services }
    "status"    { Show-Status }
    "logs"      { Show-Logs }
    "install"   { Install-Service }
    "uninstall" { Uninstall-Service }
}
