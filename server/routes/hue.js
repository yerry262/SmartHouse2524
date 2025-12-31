const express = require('express');
const router = express.Router();

// Gracefully load Philips Hue package
let hueApi = null;
let lightState = null;
try {
  const v3 = require('node-hue-api').v3;
  hueApi = v3.api;
  lightState = v3.lightStates.LightState;
  console.log('✓ Philips Hue package loaded successfully');
} catch (error) {
  console.log('⚠️ Philips Hue package (node-hue-api) not installed. Run: npm install node-hue-api');
}

// In-memory storage for discovered bridges and authenticated users
const discoveredBridges = [];
const authenticatedApis = new Map();

/**
 * @route   GET /api/hue/discover
 * @desc    Discover Philips Hue bridges on the network
 */
router.get('/discover', async (req, res) => {
  if (!hueApi) {
    return res.status(503).json({
      error: 'Philips Hue package not installed',
      message: 'Install with: npm install node-hue-api',
      installed: false
    });
  }

  try {
    const discovery = require('node-hue-api').discovery;
    const results = await discovery.nupnpSearch();
    
    discoveredBridges.length = 0;
    discoveredBridges.push(...results);

    const bridges = results.map(bridge => ({
      name: bridge.name,
      ipaddress: bridge.ipaddress,
      modelid: bridge.model?.modelid,
      swversion: bridge.model?.swversion
    }));

    res.json({
      success: true,
      count: bridges.length,
      bridges: bridges
    });
  } catch (error) {
    console.error('Error discovering Hue bridges:', error);
    res.status(500).json({ error: error.message });
  }
});

// Also support POST for discover
router.post('/discover', async (req, res) => {
  if (!hueApi) {
    return res.status(503).json({
      error: 'Philips Hue package not installed',
      message: 'Install with: npm install node-hue-api',
      installed: false
    });
  }

  try {
    const discovery = require('node-hue-api').discovery;
    const results = await discovery.nupnpSearch();
    
    discoveredBridges.length = 0;
    discoveredBridges.push(...results);

    const bridges = results.map(bridge => ({
      name: bridge.name,
      ipaddress: bridge.ipaddress,
      modelid: bridge.model?.modelid,
      swversion: bridge.model?.swversion
    }));

    // Broadcast discoveries
    if (global.broadcast && bridges.length > 0) {
      bridges.forEach(bridge => {
        global.broadcast({
          type: 'device_discovered',
          device: {
            id: `hue_${bridge.ipaddress.replace(/\./g, '_')}`,
            name: `Hue Bridge (${bridge.name})`,
            ip: bridge.ipaddress,
            type: 'Philips Hue Bridge',
            category: 'hub',
          }
        });
      });
    }

    res.json({
      success: true,
      found: bridges.length,
      bridges: bridges
    });
  } catch (error) {
    console.error('Error discovering Hue bridges:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/hue/authenticate
 * @desc    Authenticate with a Hue bridge (requires pressing link button)
 * @body    { ipAddress: "192.168.x.x" }
 */
router.post('/authenticate', async (req, res) => {
  if (!hueApi) {
    return res.status(503).json({
      error: 'Philips Hue package not installed',
      installed: false
    });
  }

  const { ipAddress } = req.body;
  
  if (!ipAddress) {
    return res.status(400).json({ error: 'IP address is required' });
  }

  try {
    const unauthenticatedApi = await hueApi.createLocal(ipAddress).connect();
    const appName = 'SmartHouse2524';
    const deviceName = 'SmartHomeController';
    
    const createdUser = await unauthenticatedApi.users.createUser(appName, deviceName);
    
    // Store the authenticated API
    const authenticatedApi = await hueApi.createLocal(ipAddress).connect(createdUser.username);
    authenticatedApis.set(ipAddress, {
      api: authenticatedApi,
      username: createdUser.username,
      clientkey: createdUser.clientkey
    });

    res.json({
      success: true,
      ipAddress: ipAddress,
      username: createdUser.username,
      clientkey: createdUser.clientkey,
      message: 'Successfully authenticated with Hue Bridge. Save this username for future use.'
    });
  } catch (error) {
    if (error.getHueErrorType && error.getHueErrorType() === 101) {
      res.status(400).json({
        error: 'Link button not pressed',
        message: 'Please press the link button on the Hue Bridge and try again within 30 seconds.'
      });
    } else {
      console.error('Error authenticating with Hue bridge:', error);
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @route   POST /api/hue/connect
 * @desc    Connect to a Hue bridge with existing username
 * @body    { ipAddress: "192.168.x.x", username: "xxx" }
 */
router.post('/connect', async (req, res) => {
  if (!hueApi) {
    return res.status(503).json({ error: 'Philips Hue package not installed', installed: false });
  }

  const { ipAddress, username } = req.body;
  
  if (!ipAddress || !username) {
    return res.status(400).json({ error: 'IP address and username are required' });
  }

  try {
    const authenticatedApi = await hueApi.createLocal(ipAddress).connect(username);
    authenticatedApis.set(ipAddress, { api: authenticatedApi, username: username });

    const config = await authenticatedApi.configuration.getConfiguration();

    res.json({
      success: true,
      bridge: {
        name: config.name,
        ipaddress: config.ipaddress,
        modelid: config.modelid,
        swversion: config.swversion
      }
    });
  } catch (error) {
    console.error('Error connecting to Hue bridge:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/hue/:ipAddress/lights
 * @desc    Get all lights connected to the Hue bridge
 */
router.get('/:ipAddress/lights', async (req, res) => {
  if (!hueApi) {
    return res.status(503).json({ error: 'Philips Hue package not installed', installed: false });
  }

  const { ipAddress } = req.params;
  const apiInfo = authenticatedApis.get(ipAddress);

  if (!apiInfo) {
    return res.status(401).json({
      error: 'Not authenticated with this bridge',
      message: 'Please authenticate or connect first'
    });
  }

  try {
    const lights = await apiInfo.api.lights.getAll();
    const lightData = lights.map(light => ({
      id: light.id,
      name: light.name,
      type: light.type,
      modelid: light.modelid,
      state: {
        on: light.state.on,
        brightness: light.state.bri,
        hue: light.state.hue,
        saturation: light.state.sat,
        colorTemp: light.state.ct,
        reachable: light.state.reachable
      }
    }));

    res.json({ success: true, count: lightData.length, lights: lightData });
  } catch (error) {
    console.error('Error getting lights:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/hue/:ipAddress/lights/:lightId
 * @desc    Get specific light details
 */
router.get('/:ipAddress/lights/:lightId', async (req, res) => {
  if (!hueApi) {
    return res.status(503).json({ error: 'Philips Hue package not installed', installed: false });
  }

  const { ipAddress, lightId } = req.params;
  const apiInfo = authenticatedApis.get(ipAddress);

  if (!apiInfo) {
    return res.status(401).json({ error: 'Not authenticated with this bridge' });
  }

  try {
    const light = await apiInfo.api.lights.getLight(lightId);
    res.json({ success: true, light: light });
  } catch (error) {
    console.error('Error getting light:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/hue/:ipAddress/lights/:lightId/state
 * @desc    Control a specific light
 * @body    { on: true/false, brightness: 0-254, hue: 0-65535, sat: 0-254, ct: 153-500 }
 */
router.put('/:ipAddress/lights/:lightId/state', async (req, res) => {
  if (!hueApi || !lightState) {
    return res.status(503).json({ error: 'Philips Hue package not installed', installed: false });
  }

  const { ipAddress, lightId } = req.params;
  const { on, brightness, hue, sat, ct, effect, alert, transitiontime } = req.body;
  const apiInfo = authenticatedApis.get(ipAddress);

  if (!apiInfo) {
    return res.status(401).json({ error: 'Not authenticated with this bridge' });
  }

  try {
    const state = new lightState();
    
    if (typeof on === 'boolean') state.on(on);
    if (typeof brightness === 'number') state.brightness(brightness);
    if (typeof hue === 'number') state.hue(hue);
    if (typeof sat === 'number') state.sat(sat);
    if (typeof ct === 'number') state.ct(ct);
    if (effect) state.effect(effect);
    if (alert) state.alert(alert);
    if (typeof transitiontime === 'number') state.transitiontime(transitiontime);

    const result = await apiInfo.api.lights.setLightState(lightId, state);

    if (global.broadcast) {
      global.broadcast({
        type: 'hue_light_update',
        ipAddress: ipAddress,
        lightId: lightId,
        state: req.body
      });
    }

    res.json({ success: result, lightId: lightId, state: req.body });
  } catch (error) {
    console.error('Error setting light state:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/hue/:ipAddress/groups
 * @desc    Get all groups/rooms
 */
router.get('/:ipAddress/groups', async (req, res) => {
  if (!hueApi) {
    return res.status(503).json({ error: 'Philips Hue package not installed', installed: false });
  }

  const { ipAddress } = req.params;
  const apiInfo = authenticatedApis.get(ipAddress);

  if (!apiInfo) {
    return res.status(401).json({ error: 'Not authenticated with this bridge' });
  }

  try {
    const groups = await apiInfo.api.groups.getAll();
    const groupData = groups.map(group => ({
      id: group.id,
      name: group.name,
      type: group.type,
      lights: group.lights,
      state: group.state
    }));

    res.json({ success: true, count: groupData.length, groups: groupData });
  } catch (error) {
    console.error('Error getting groups:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/hue/:ipAddress/groups/:groupId/state
 * @desc    Control all lights in a group/room
 */
router.put('/:ipAddress/groups/:groupId/state', async (req, res) => {
  if (!hueApi || !lightState) {
    return res.status(503).json({ error: 'Philips Hue package not installed', installed: false });
  }

  const { ipAddress, groupId } = req.params;
  const { on, brightness, hue, sat, ct, scene } = req.body;
  const apiInfo = authenticatedApis.get(ipAddress);

  if (!apiInfo) {
    return res.status(401).json({ error: 'Not authenticated with this bridge' });
  }

  try {
    const state = new lightState();
    
    if (typeof on === 'boolean') state.on(on);
    if (typeof brightness === 'number') state.brightness(brightness);
    if (typeof hue === 'number') state.hue(hue);
    if (typeof sat === 'number') state.sat(sat);
    if (typeof ct === 'number') state.ct(ct);

    const result = await apiInfo.api.groups.setGroupState(groupId, state);

    res.json({ success: result, groupId: groupId, state: req.body });
  } catch (error) {
    console.error('Error setting group state:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/hue/:ipAddress/scenes
 * @desc    Get all scenes
 */
router.get('/:ipAddress/scenes', async (req, res) => {
  if (!hueApi) {
    return res.status(503).json({ error: 'Philips Hue package not installed', installed: false });
  }

  const { ipAddress } = req.params;
  const apiInfo = authenticatedApis.get(ipAddress);

  if (!apiInfo) {
    return res.status(401).json({ error: 'Not authenticated with this bridge' });
  }

  try {
    const scenes = await apiInfo.api.scenes.getAll();
    const sceneData = scenes.map(scene => ({
      id: scene.id,
      name: scene.name,
      type: scene.type,
      group: scene.group,
      lights: scene.lights
    }));

    res.json({ success: true, count: sceneData.length, scenes: sceneData });
  } catch (error) {
    console.error('Error getting scenes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/hue/:ipAddress/scenes/:sceneId/activate
 * @desc    Activate a scene
 */
router.put('/:ipAddress/scenes/:sceneId/activate', async (req, res) => {
  if (!hueApi) {
    return res.status(503).json({ error: 'Philips Hue package not installed', installed: false });
  }

  const { ipAddress, sceneId } = req.params;
  const apiInfo = authenticatedApis.get(ipAddress);

  if (!apiInfo) {
    return res.status(401).json({ error: 'Not authenticated with this bridge' });
  }

  try {
    const result = await apiInfo.api.scenes.activateScene(sceneId);
    res.json({ success: result, sceneId: sceneId });
  } catch (error) {
    console.error('Error activating scene:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
