const fs = require('fs');
const path = require('path');

const devicesFile = path.join(__dirname, '../data/devices.json');
const backupFile = path.join(__dirname, '../data/devices.backup.1767252676559.json');

// Read current devices and backup
let devices = JSON.parse(fs.readFileSync(devicesFile, 'utf8'));
let backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

console.log('Fixing Apple TV devices...\n');

// Find the correct Apple TV entries from backup
const livingRoomTV = backup.find(d => 
  d.type === 'appletv' && 
  d.name === 'Living Room' && 
  d.metadata && 
  d.metadata.addresses && 
  d.metadata.addresses.includes('192.168.4.33')
);

const gameRoomTV = backup.find(d => 
  d.type === 'appletv' && 
  d.name === 'Game Room' && 
  d.metadata && 
  d.metadata.addresses && 
  d.metadata.addresses.includes('192.168.4.25')
);

// Extract MAC addresses from deviceid in txt
const extractMAC = (device) => {
  if (device.metadata && device.metadata.txt && device.metadata.txt.deviceid) {
    return device.metadata.txt.deviceid;
  }
  return null;
};

// Create corrected Apple TV entries with IPv4 addresses
const correctedAppleTVs = [];

if (livingRoomTV) {
  const mac = extractMAC(livingRoomTV);
  const livingRoom = {
    id: mac ? mac.replace(/:/g, '').toLowerCase() : '321409baf838',
    type: 'appletv',
    name: 'Living Room',
    hostname: livingRoomTV.hostname,
    ip: '192.168.4.33',
    port: 7000,
    mac: mac,
    status: 'online',
    lastSeen: new Date().toISOString(),
    metadata: livingRoomTV.metadata,
    firstSeen: livingRoomTV.firstSeen
  };
  correctedAppleTVs.push(livingRoom);
  console.log('✓ Added Living Room Apple TV');
  console.log('  IP:', livingRoom.ip);
  console.log('  MAC:', livingRoom.mac);
}

if (gameRoomTV) {
  const mac = extractMAC(gameRoomTV);
  const gameRoom = {
    id: mac ? mac.replace(/:/g, '').toLowerCase() : '42930684ff1',
    type: 'appletv',
    name: 'Game Room',
    hostname: gameRoomTV.hostname,
    ip: '192.168.4.25',
    port: 7000,
    mac: mac,
    status: 'online',
    lastSeen: new Date().toISOString(),
    metadata: gameRoomTV.metadata,
    firstSeen: gameRoomTV.firstSeen
  };
  correctedAppleTVs.push(gameRoom);
  console.log('✓ Added Game Room Apple TV');
  console.log('  IP:', gameRoom.ip);
  console.log('  MAC:', gameRoom.mac);
}

// Remove all existing Apple TV entries (including Mac Studio)
const beforeCount = devices.length;
devices = devices.filter(d => d.type !== 'appletv');
const removed = beforeCount - devices.length;
console.log(`\n✓ Removed ${removed} incorrect Apple TV entries (including Mac Studio)`);

// Add the corrected Apple TVs
devices = devices.concat(correctedAppleTVs);

console.log(`\n✓ Total devices: ${devices.length}`);
console.log('✓ Apple TVs: ' + devices.filter(d => d.type === 'appletv').length);

// Create backup of current state
const backupFile2 = devicesFile.replace('.json', `.backup.${Date.now()}.json`);
fs.writeFileSync(backupFile2, fs.readFileSync(devicesFile));
console.log(`\n✓ Backup created: ${backupFile2}`);

// Save corrected devices
fs.writeFileSync(devicesFile, JSON.stringify(devices, null, 2));
console.log(`✓ Corrected devices saved to: ${devicesFile}`);

console.log('\n✅ Apple TV devices fixed!');
