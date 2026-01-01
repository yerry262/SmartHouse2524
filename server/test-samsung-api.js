// Test script for Samsung TV API endpoints
const http = require('http');

const BASE_URL = 'http://localhost:5000';

const testEndpoint = (path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('🧪 Testing Samsung TV API Endpoints\n');
  console.log('='.repeat(50));

  // Test 1: Discover endpoint
  console.log('\n📡 Test 1: GET /api/samsung/discover');
  try {
    const result = await testEndpoint('/api/samsung/discover');
    console.log('✅ Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test 2: Register a TV manually
  const testIp = process.argv[2] || '192.168.4.101';
  console.log(`\n📝 Test 2: POST /api/samsung/register (${testIp})`);
  try {
    const result = await testEndpoint('/api/samsung/register', 'POST', { ip: testIp, name: 'Living Room Samsung TV' });
    console.log('✅ Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test 3: Status endpoint
  console.log(`\n📺 Test 3: GET /api/samsung/${testIp}/status`);
  try {
    const result = await testEndpoint(`/api/samsung/${testIp}/status`);
    console.log('✅ Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test 4: Apps endpoint
  console.log(`\n📱 Test 4: GET /api/samsung/${testIp}/apps`);
  try {
    const result = await testEndpoint(`/api/samsung/${testIp}/apps`);
    console.log('✅ Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test 5: Discover again to see registered TV
  console.log('\n📡 Test 5: GET /api/samsung/discover (after registration)');
  try {
    const result = await testEndpoint('/api/samsung/discover');
    console.log('✅ Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test 6: Send key endpoint
  console.log(`\n🔑 Test 6: POST /api/samsung/${testIp}/key (KEY_INFO)`);
  try {
    const result = await testEndpoint(`/api/samsung/${testIp}/key`, 'POST', { key: 'KEY_INFO' });
    console.log('✅ Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Tests complete!\n');
};

runTests();
