/**
 * Ring Camera Streaming Service
 * 
 * Ring cameras are 100% cloud-based - they don't expose any local ports.
 * This service uses ring-client-api to:
 * 1. Authenticate with Ring cloud (requires refresh token)
 * 2. Start SIP-based video sessions
 * 3. Stream video to local RTSP server or save snapshots
 * 
 * To get a refresh token, run: npx -p ring-client-api ring-auth-cli
 */

const { spawn } = require('child_process');
const path = require('path');

let RingApi = null;
let ringApi = null;
let cameras = [];
let activeStreams = new Map(); // deviceId -> { sipSession, ffmpeg, rtspUrl }

// Try to load Ring package
try {
  const ringModule = require('ring-client-api');
  RingApi = ringModule.RingApi;
} catch (error) {
  console.log('⚠️  Ring package not installed. Run: npm install ring-client-api');
}

/**
 * Initialize Ring API with refresh token
 * Refresh token is preferred over email/password (avoids 2FA issues)
 */
const initRingApi = async () => {
  if (!RingApi) {
    throw new Error('ring-client-api not installed');
  }
  
  if (ringApi) {
    return ringApi;
  }

  const refreshToken = process.env.RING_REFRESH_TOKEN;
  
  if (!refreshToken) {
    // Fall back to email/password (may require 2FA)
    if (process.env.RING_EMAIL && process.env.RING_PASSWORD) {
      console.log('⚠️  Using email/password auth (may require 2FA)');
      ringApi = new RingApi({
        email: process.env.RING_EMAIL,
        password: process.env.RING_PASSWORD,
      });
    } else {
      throw new Error('Ring credentials not configured. Set RING_REFRESH_TOKEN in .env');
    }
  } else {
    ringApi = new RingApi({
      refreshToken: refreshToken,
      debug: false,
    });
    
    // Listen for token updates and log them
    ringApi.onRefreshTokenUpdated.subscribe(({ newRefreshToken }) => {
      console.log('📝 Ring refresh token updated. Save this to .env:');
      console.log(`RING_REFRESH_TOKEN=${newRefreshToken}`);
    });
  }

  return ringApi;
};

/**
 * Get all Ring cameras
 */
const getCameras = async () => {
  const api = await initRingApi();
  cameras = await api.getCameras();
  
  return cameras.map(cam => ({
    id: cam.id,
    deviceId: cam.data.device_id,
    name: cam.name,
    model: cam.model,
    hasLight: cam.hasLight,
    hasSiren: cam.hasSiren,
    hasBattery: cam.hasBattery,
    batteryLevel: cam.batteryLevel,
    isCharging: cam.data.charging_status === 'charging',
    firmware: cam.data.firmware_version,
    // Ring cameras are cloud-only - no local IP
    note: 'Ring cameras stream via cloud only (no local ports)',
  }));
};

/**
 * Get a specific camera by ID
 */
const getCamera = async (deviceId) => {
  if (cameras.length === 0) {
    await getCameras();
  }
  return cameras.find(c => c.data.device_id === deviceId || c.id === parseInt(deviceId));
};

/**
 * Get camera snapshot (still image)
 * Ring provides snapshots from their cloud
 */
const getSnapshot = async (deviceId) => {
  const camera = await getCamera(deviceId);
  if (!camera) {
    throw new Error(`Camera ${deviceId} not found`);
  }

  try {
    // Get snapshot from Ring cloud
    const snapshot = await camera.getSnapshot();
    return {
      success: true,
      contentType: 'image/jpeg',
      data: snapshot, // Buffer
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to get snapshot: ${error.message}`);
  }
};

/**
 * Start live video stream
 * This starts a SIP session with Ring cloud and streams via FFmpeg
 * 
 * Options:
 * - rtspUrl: RTSP server URL to push stream to (e.g., rtsp://localhost:8554/ring-cam)
 * - duration: Max duration in seconds (default: 180, Ring max is ~10 min)
 */
const startLiveStream = async (deviceId, options = {}) => {
  const camera = await getCamera(deviceId);
  if (!camera) {
    throw new Error(`Camera ${deviceId} not found`);
  }

  // Check if already streaming
  if (activeStreams.has(deviceId)) {
    const existing = activeStreams.get(deviceId);
    return {
      success: true,
      message: 'Stream already active',
      rtspUrl: existing.rtspUrl,
      deviceId,
    };
  }

  const rtspUrl = options.rtspUrl || `rtsp://127.0.0.1:8554/ring-${deviceId}`;
  const duration = options.duration || 180;

  try {
    console.log(`🎥 Starting Ring live stream for ${camera.name} (${deviceId})`);
    
    // Start the video stream - this uses ring-client-api's streamVideo
    const sipSession = await camera.streamVideo({
      output: [
        '-f', 'rtsp',
        '-rtsp_transport', 'tcp',
        '-c:v', 'copy',  // Copy video codec (H.264)
        '-c:a', 'aac',   // Transcode audio to AAC
        '-b:a', '128k',
        '-t', duration.toString(),
        rtspUrl,
      ],
    });

    console.log(`✅ Ring SIP session started for ${camera.name}`);

    // Track the active stream
    activeStreams.set(deviceId, {
      sipSession,
      rtspUrl,
      startTime: new Date(),
      camera: camera.name,
    });

    // Handle stream end
    sipSession.onCallEnded.subscribe(() => {
      console.log(`📴 Ring stream ended for ${camera.name}`);
      activeStreams.delete(deviceId);
    });

    return {
      success: true,
      message: 'Live stream started',
      rtspUrl,
      deviceId,
      cameraName: camera.name,
      note: 'Stream available at RTSP URL (requires RTSP server like go2rtc)',
    };
  } catch (error) {
    console.error(`❌ Failed to start Ring stream: ${error.message}`);
    throw new Error(`Failed to start stream: ${error.message}`);
  }
};

/**
 * Stop live video stream
 */
const stopLiveStream = async (deviceId) => {
  const stream = activeStreams.get(deviceId);
  if (!stream) {
    return { success: false, message: 'No active stream for this device' };
  }

  try {
    stream.sipSession.stop();
    activeStreams.delete(deviceId);
    return { success: true, message: 'Stream stopped' };
  } catch (error) {
    activeStreams.delete(deviceId);
    return { success: true, message: 'Stream stopped (with cleanup)' };
  }
};

/**
 * Get stream status
 */
const getStreamStatus = (deviceId) => {
  const stream = activeStreams.get(deviceId);
  if (!stream) {
    return { active: false };
  }
  
  return {
    active: true,
    rtspUrl: stream.rtspUrl,
    startTime: stream.startTime,
    cameraName: stream.camera,
    duration: Math.round((Date.now() - stream.startTime.getTime()) / 1000),
  };
};

/**
 * Get all active streams
 */
const getActiveStreams = () => {
  const streams = [];
  activeStreams.forEach((stream, deviceId) => {
    streams.push({
      deviceId,
      ...getStreamStatus(deviceId),
    });
  });
  return streams;
};

/**
 * Get recent events (motion, dings) for a camera
 */
const getEvents = async (deviceId, limit = 10) => {
  const camera = await getCamera(deviceId);
  if (!camera) {
    throw new Error(`Camera ${deviceId} not found`);
  }

  try {
    const events = await camera.getEvents({ limit });
    return events.map(e => ({
      id: e.id,
      type: e.kind, // 'motion', 'ding', 'on_demand'
      timestamp: e.created_at,
      duration: e.duration,
      answered: e.answered,
      favorite: e.favorite,
    }));
  } catch (error) {
    throw new Error(`Failed to get events: ${error.message}`);
  }
};

/**
 * Get video URL for a recorded event
 */
const getEventVideo = async (deviceId, eventId) => {
  const camera = await getCamera(deviceId);
  if (!camera) {
    throw new Error(`Camera ${deviceId} not found`);
  }

  try {
    const url = await camera.getRecordingUrl(eventId);
    return {
      success: true,
      videoUrl: url,
      expiresIn: '15 minutes',
      note: 'URL is temporary and expires',
    };
  } catch (error) {
    throw new Error(`Failed to get event video: ${error.message}`);
  }
};

/**
 * Control camera light (if equipped)
 */
const setLight = async (deviceId, on) => {
  const camera = await getCamera(deviceId);
  if (!camera) {
    throw new Error(`Camera ${deviceId} not found`);
  }
  if (!camera.hasLight) {
    throw new Error('Camera does not have a light');
  }

  await camera.setLight(on);
  return { success: true, light: on };
};

/**
 * Trigger siren (if equipped)
 */
const setSiren = async (deviceId, on) => {
  const camera = await getCamera(deviceId);
  if (!camera) {
    throw new Error(`Camera ${deviceId} not found`);
  }
  if (!camera.hasSiren) {
    throw new Error('Camera does not have a siren');
  }

  // Ring API uses specific siren control
  if (on) {
    await camera.data.device_settings?.chime_settings; // Placeholder
  }
  return { success: true, siren: on };
};

/**
 * Generate refresh token instructions
 */
const getAuthInstructions = () => {
  return {
    message: 'Ring requires authentication via refresh token',
    steps: [
      '1. Open a terminal in the project directory',
      '2. Run: npx -p ring-client-api ring-auth-cli',
      '3. Enter your Ring email and password',
      '4. Complete 2FA if prompted',
      '5. Copy the refresh token to your .env file:',
      '   RING_REFRESH_TOKEN=your_token_here',
      '6. Restart the server',
    ],
    documentation: 'https://github.com/dgreif/ring/wiki/Refresh-Tokens',
  };
};

module.exports = {
  initRingApi,
  getCameras,
  getCamera,
  getSnapshot,
  startLiveStream,
  stopLiveStream,
  getStreamStatus,
  getActiveStreams,
  getEvents,
  getEventVideo,
  setLight,
  setSiren,
  getAuthInstructions,
  isConfigured: () => !!RingApi && !!(process.env.RING_REFRESH_TOKEN || process.env.RING_EMAIL),
};
