const fs = require('fs');
const path = require('path');

const devicesFile = path.join(__dirname, '../data/devices.json');

// Read devices
let devices = JSON.parse(fs.readFileSync(devicesFile, 'utf8'));

console.log(`Total devices before deduplication: ${devices.length}`);

// Track devices by MAC and IP
const seenMACs = new Map();
const seenIPs = new Map();
const deduplicatedDevices = [];

devices.forEach(device => {
  let isDuplicate = false;
  
  // Check for MAC address duplicates
  if (device.mac) {
    const normalizedMAC = device.mac.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
    if (seenMACs.has(normalizedMAC)) {
      console.log(`Duplicate MAC found: ${device.mac} - ${device.name} (${device.ip}) - Keeping first occurrence`);
      isDuplicate = true;
      
      // Merge metadata if the duplicate has more info
      const existing = seenMACs.get(normalizedMAC);
      if (device.metadata && Object.keys(device.metadata).length > Object.keys(existing.metadata || {}).length) {
        existing.metadata = { ...existing.metadata, ...device.metadata };
      }
    } else {
      seenMACs.set(normalizedMAC, device);
    }
  }
  
  // Check for IP address duplicates (only if not already marked as duplicate by MAC)
  if (!isDuplicate && device.ip) {
    // Skip IPv6 link-local addresses (fe80::) as primary identifiers
    const isIPv6LinkLocal = device.ip.startsWith('fe80::');
    
    if (!isIPv6LinkLocal) {
      if (seenIPs.has(device.ip)) {
        const existing = seenIPs.get(device.ip);
        
        // If existing has no MAC but new one does, replace it
        if (!existing.mac && device.mac) {
          console.log(`Upgrading device at ${device.ip} with MAC ${device.mac}`);
          // Remove the old one and add the new one with MAC
          const index = deduplicatedDevices.findIndex(d => d.id === existing.id);
          if (index !== -1) {
            deduplicatedDevices.splice(index, 1);
          }
          seenIPs.set(device.ip, device);
          if (device.mac) {
            const normalizedMAC = device.mac.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
            seenMACs.set(normalizedMAC, device);
          }
          isDuplicate = false;
        } else {
          console.log(`Duplicate IP found: ${device.ip} - ${device.name} (${device.type}) - Keeping first occurrence`);
          isDuplicate = true;
          
          // Merge metadata
          if (device.metadata && Object.keys(device.metadata).length > Object.keys(existing.metadata || {}).length) {
            existing.metadata = { ...existing.metadata, ...device.metadata };
          }
        }
      } else {
        seenIPs.set(device.ip, device);
      }
    } else {
      // For IPv6 link-local, only keep if there's no IPv4 version
      console.log(`Skipping IPv6 link-local device: ${device.name} (${device.ip})`);
      isDuplicate = true;
    }
  }
  
  if (!isDuplicate) {
    deduplicatedDevices.push(device);
  }
});

console.log(`\nTotal devices after deduplication: ${deduplicatedDevices.length}`);
console.log(`Removed ${devices.length - deduplicatedDevices.length} duplicate entries`);

// Create backup
const backupFile = devicesFile.replace('.json', `.backup.${Date.now()}.json`);
fs.writeFileSync(backupFile, JSON.stringify(devices, null, 2));
console.log(`\nBackup created: ${backupFile}`);

// Write deduplicated devices
fs.writeFileSync(devicesFile, JSON.stringify(deduplicatedDevices, null, 2));
console.log(`\nDeduplicated devices saved to: ${devicesFile}`);

// Show summary by type
const typeCount = {};
deduplicatedDevices.forEach(d => {
  typeCount[d.type] = (typeCount[d.type] || 0) + 1;
});

console.log('\nDevices by type:');
Object.entries(typeCount).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});
