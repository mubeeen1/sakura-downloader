// Simple test script to verify server is working
const http = require('http');

async function testEndpoint(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting server tests...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await testEndpoint('/health');
    if (healthResponse.statusCode === 200) {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed:', healthResponse.statusCode);
    }

    // Test home page
    console.log('\n2. Testing home page...');
    const homeResponse = await testEndpoint('/');
    if (homeResponse.statusCode === 200) {
      console.log('✅ Home page loaded successfully');
    } else {
      console.log('❌ Home page failed:', homeResponse.statusCode);
    }

    // Test platform pages
    const platforms = ['youtube', 'instagram', 'pinterest'];
    for (const platform of platforms) {
      console.log(`\n3. Testing ${platform} page...`);
      const platformResponse = await testEndpoint(`/${platform}`);
      if (platformResponse.statusCode === 200) {
        console.log(`✅ ${platform} page loaded successfully`);
      } else {
        console.log(`❌ ${platform} page failed:`, platformResponse.statusCode);
      }
    }

    // Test unsupported platform
    console.log('\n4. Testing unsupported platform...');
    const unsupportedResponse = await testEndpoint('/tiktok');
    if (unsupportedResponse.statusCode === 302 || unsupportedResponse.statusCode === 404) {
      console.log('✅ Unsupported platform handled correctly');
    } else {
      console.log('❌ Unsupported platform not handled:', unsupportedResponse.statusCode);
    }

    console.log('\n✨ All tests completed!');
    console.log('\n📝 Next steps:');
    console.log('- Open http://localhost:3000 in your browser');
    console.log('- Test each platform page');
    console.log('- Verify autoscroll functionality');
    console.log('- Check error handling and logging');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running:');
    console.log('   node index.js');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testEndpoint, runTests };
