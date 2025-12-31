const { exec } = require('child_process');
const util = require('util');
const dns = require('dns');
const net = require('net');

const execPromise = util.promisify(exec);
const dnsReverse = util.promisify(dns.reverse);

class NetworkScanner {
  constructor() {
    this.commonPorts = {
      21: 'FTP',
      22: 'SSH',
      23: 'Telnet',
      80: 'HTTP',
      443: 'HTTPS',
      554: 'RTSP',
      1400: 'Sonos',
      3689: 'DAAP',
      5000: 'UPnP',
      7000: 'AirPlay',
      8008: 'Chromecast',
      8080: 'HTTP-Alt',
      8443: 'HTTPS-Alt',
      8002: 'Samsung TV',
      9000: 'HTTP-Alt',
      49152: 'UPnP'
    };

    this.deviceSignatures = {
      'sonos': { ports: [1400, 1443], keywords: ['sonos'] },
      'samsung-tv': { ports: [8002, 8001], keywords: ['samsung', 'tv'] },
      'appletv': { ports: [3689, 7000], keywords: ['apple', 'tv'] },
      'camera': { ports: [554, 8000, 80], keywords: ['camera', 'ipc', 'dvr', 'nvr'] },
      'ring': { ports: [443, 6334], keywords: ['ring', 'doorbell'] },
      'eero': { ports: [443, 80], keywords: ['eero', 'router'] },
      'printer': { ports: [631, 9100], keywords: ['printer', 'hp', 'canon', 'epson'] },
      'nas': { ports: [445, 139, 5000, 5001], keywords: ['nas', 'synology', 'qnap'] },
      'roomba': { ports: [8883, 443], keywords: ['irobot', 'roomba', 'braava'] }
    };
  }

  // Scan a single IP address with hostname resolution
  async scanIP(ip, timeout = 1000) {
    const result = {
      ip,
      alive: false,
      hostname: null,
      mac: null,
      openPorts: [],
      deviceType: 'unknown',
      responseTime: null,
      confidence: 0
    };

    try {
      // Check if host is alive (ping)
      const isAlive = await this.ping(ip, timeout);
      
      // Get MAC address even if ping failed (device might be in ARP cache)
      const mac = await this.getMacAddress(ip);
      
      // If we have a MAC address, the device is definitely alive (in ARP table)
      if (mac) {
        result.alive = true;
        result.mac = mac;
      } else if (!isAlive) {
        return result;
      } else {
        result.alive = true;
      }

      // Get hostname
      try {
        const hostnames = await dnsReverse(ip);
        result.hostname = hostnames[0];
      } catch (e) {
        // Hostname not found
      }

      // Scan common ports
      result.openPorts = await this.scanPorts(ip, Object.keys(this.commonPorts).map(Number), 500);

      // Identify device type
      const identification = this.identifyDevice(result.hostname, result.openPorts, result.mac);
      result.deviceType = identification.type;
      result.confidence = identification.confidence;

      // Get vendor from MAC
      result.vendor = this.getVendorFromMac(result.mac);

      return result;
    } catch (error) {
      console.error(`Error scanning ${ip}:`, error.message);
      return result;
    }
  }

  // Scan subnet range
  async scanSubnet(baseIP, startRange = 1, endRange = 255, onProgress = null) {
    const results = [];
    const ipParts = baseIP.split('.');
    const basePrefix = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;

    console.log(`Scanning subnet ${basePrefix}.${startRange} to ${basePrefix}.${endRange}`);

    // Scan in batches to avoid overwhelming the system
    const batchSize = 10;  // Reduced from 20 to prevent crashes
    for (let i = startRange; i <= endRange; i += batchSize) {
      const batch = [];
      const end = Math.min(i + batchSize - 1, endRange);

      for (let j = i; j <= end; j++) {
        const ip = `${basePrefix}.${j}`;
        batch.push(this.scanIP(ip, 500));  // Reduced timeout from 800ms to 500ms
      }

      const batchResults = await Promise.all(batch);
      // Include devices that have MAC address OR open ports OR hostname
      const aliveDevices = batchResults.filter(r => {
        return r.alive && (r.mac || r.openPorts.length > 0 || r.hostname);
      });
      results.push(...aliveDevices);

      if (onProgress) {
        const progress = Math.round((end / (endRange - startRange + 1)) * 100);
        onProgress(progress, results.length);
      }

      console.log(`Scanned ${end}/${endRange} - Found ${results.length} alive devices`);
      
      // Add small delay between batches to keep server responsive
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  // Ping IP address using ICMP-style check
  async ping(ip, timeout = 1000) {
    return new Promise((resolve) => {
      // Try multiple common ports to determine if host is alive
      const checkMethods = [
        this.checkPort(ip, 80, timeout),
        this.checkPort(ip, 443, timeout),
        this.checkPort(ip, 22, timeout),
        this.checkPort(ip, 445, timeout),  // SMB
        this.checkPort(ip, 139, timeout),  // NetBIOS
        this.checkPort(ip, 3689, timeout), // iTunes/AirPlay
        this.checkPort(ip, 5000, timeout), // UPnP/Common
        this.checkPort(ip, 8080, timeout), // HTTP Alt
      ];

      // Host is alive if ANY port responds
      Promise.any(checkMethods)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }

  // Scan multiple ports on an IP
  async scanPorts(ip, ports, timeout = 500) {
    const openPorts = [];
    const promises = ports.map(port => this.checkPort(ip, port, timeout));
    const results = await Promise.all(promises);

    results.forEach((isOpen, index) => {
      if (isOpen) {
        openPorts.push({
          port: ports[index],
          service: this.commonPorts[ports[index]] || 'Unknown'
        });
      }
    });

    return openPorts;
  }

  // Check if a specific port is open
  async checkPort(ip, port, timeout = 500) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timer = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, timeout);

      socket.on('connect', () => {
        clearTimeout(timer);
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        clearTimeout(timer);
        resolve(false);
      });

      socket.connect(port, ip);
    });
  }

  // Get MAC address from ARP table (Windows)
  async getMacAddress(ip) {
    try {
      const { stdout } = await execPromise(`arp -a ${ip}`);
      const match = stdout.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
      return match ? match[0].replace(/-/g, ':').toLowerCase() : null;
    } catch (error) {
      return null;
    }
  }

  // Get vendor from MAC address (first 3 octets)
  getVendorFromMac(mac) {
    if (!mac) return 'Unknown';
    
    const macPrefix = mac.substring(0, 8).toLowerCase();
    const vendors = {
      '18:90:88': 'eero (Amazon)',
      'f4:5c:89': 'Apple',
      'cc:d2:81': 'Apple',
      '50:de:06': 'Apple',
      '00:17:88': 'Philips Hue',
      '00:0c:29': 'VMware',
      '48:d6:d5': 'TP-Link',
      '50:c7:bf': 'TP-Link',
      'b0:be:76': 'Sonos',
      '00:0e:58': 'Sonos',
      '94:9f:3e': 'Sonos',
      '54:2a:1b': 'Sonos',
      '68:55:d4': 'Epson',
      '68:eb:ae': 'Ring',
      'b4:79:a7': 'Samsung Electronics',
      '50:14:79': 'iRobot',
      '80:a5:89': 'iRobot',
      'f0:03:8c': 'iRobot'
    };
    
    return vendors[macPrefix] || 'Unknown';
  }

  // Identify device type based on hostname and open ports
  identifyDevice(hostname, openPorts, mac = null) {
    let bestMatch = { type: 'unknown', confidence: 0 };
    const hostnameStr = (hostname || '').toLowerCase();
    const portNumbers = openPorts.map(p => p.port);
    const macStr = (mac || '').toLowerCase();

    // MAC address based detection (most reliable)
    if (mac) {
      // eero MAC addresses start with 18:90:88
      if (macStr.startsWith('18:90:88')) {
        bestMatch = { type: 'eero', confidence: 98 };
      }
      // Epson MAC addresses
      else if (macStr.startsWith('68:55:d4')) {
        bestMatch = { type: 'printer', confidence: 98 };
      }
      // iRobot Roomba MAC addresses
      else if (macStr.startsWith('50:14:79') || macStr.startsWith('80:a5:89') || macStr.startsWith('f0:03:8c')) {
        bestMatch = { type: 'roomba', confidence: 98 };
      }
    }

    // Enhanced port-based detection (more reliable than missing hostnames)
    // Apple TV detection - port 7000 (AirPlay) + port 49152
    if (bestMatch.confidence < 90 && portNumbers.includes(7000) && portNumbers.includes(49152)) {
      bestMatch = { type: 'appletv', confidence: 95 };
    }
    // eero detection - typically only have 80/443 open
    else if (bestMatch.confidence < 60 && portNumbers.includes(443) && portNumbers.includes(80) && portNumbers.length === 2) {
      // Only identify as eero if vendor matches or is unknown (avoids misidentifying printers/web servers)
      const vendor = this.getVendorFromMac(mac);
      if (vendor === 'eero (Amazon)' || vendor === 'Unknown') {
        bestMatch = { type: 'eero', confidence: 60 };
      }
    }
    // Sonos detection - port 1400
    else if (bestMatch.confidence < 90 && portNumbers.includes(1400)) {
      bestMatch = { type: 'sonos', confidence: 95 };
    }
    
    // Enhanced hostname detection
    if (hostname) {
      // Apple TV detection
      if (hostnameStr.includes('appletv') || hostnameStr.includes('apple-tv') || 
          hostnameStr.match(/^(living|bedroom|game|family|kids)-?room/i)) {
        bestMatch = { type: 'appletv', confidence: 90 };
      }
      // eero detection
      else if (hostnameStr.includes('eero')) {
        bestMatch = { type: 'eero', confidence: 95 };
      }
      // Sonos detection
      else if (hostnameStr.includes('sonos')) {
        bestMatch = { type: 'sonos', confidence: 95 };
      }
      // Samsung TV
      else if (hostnameStr.includes('samsung') || hostnameStr.includes('[tv]')) {
        bestMatch = { type: 'samsung-tv', confidence: 85 };
      }
      // Ring
      else if (hostnameStr.includes('ring') || hostnameStr.includes('doorbell')) {
        bestMatch = { type: 'ring', confidence: 90 };
      }
      // Printer
      else if (hostnameStr.includes('epson') || hostnameStr.includes('hp') || 
               hostnameStr.includes('canon') || hostnameStr.includes('printer')) {
        bestMatch = { type: 'printer', confidence: 90 };
      }
      // Roomba
      else if (hostnameStr.includes('roomba') || hostnameStr.includes('irobot') || hostnameStr.includes('braava')) {
        bestMatch = { type: 'roomba', confidence: 95 };
      }
    }

    // If we still don't have high confidence, check against all signatures
    if (bestMatch.confidence < 80) {
      for (const [deviceType, signature] of Object.entries(this.deviceSignatures)) {
        let confidence = 0;

        // Check hostname keywords
        if (hostname) {
          for (const keyword of signature.keywords) {
            if (hostnameStr.includes(keyword)) {
              confidence += 40;
              break;
            }
          }
        }

        // Check open ports
        const matchingPorts = signature.ports.filter(p => portNumbers.includes(p));
        if (matchingPorts.length > 0) {
          confidence += (matchingPorts.length / signature.ports.length) * 60;
        }

        if (confidence > bestMatch.confidence) {
          bestMatch = { type: deviceType, confidence };
        }
      }
    }

    // Additional heuristics
    if (bestMatch.type === 'unknown') {
      if (portNumbers.includes(554)) {
        bestMatch = { type: 'camera', confidence: 50 };
      } else if (portNumbers.includes(8002) || portNumbers.includes(8001)) {
        bestMatch = { type: 'samsung-tv', confidence: 50 };
      } else if (portNumbers.includes(1400)) {
        bestMatch = { type: 'sonos', confidence: 70 };
      } else if (portNumbers.includes(80) || portNumbers.includes(443)) {
        bestMatch = { type: 'web-device', confidence: 30 };
      }
    }

    return bestMatch;
  }

  // Generate device name based on type and IP
  generateDeviceName(deviceType, ip, hostname) {
    if (hostname && !hostname.includes('.local') && !hostname.includes('dhcp')) {
      return hostname;
    }

    const typeNames = {
      'sonos': 'Sonos Speaker',
      'samsung-tv': 'Samsung TV',
      'appletv': 'Apple TV',
      'camera': 'IP Camera',
      'ring': 'Ring Device',
      'eero': 'Eero Router',
      'printer': 'Printer',
      'nas': 'NAS Storage',
      'web-device': 'Web Device',
      'unknown': 'Unknown Device'
    };

    const ipSuffix = ip.split('.').pop();
    return `${typeNames[deviceType] || 'Device'} (${ipSuffix})`;
  }
}

module.exports = NetworkScanner;
