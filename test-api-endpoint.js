// Direct API test - run in Node.js
const http = require('http');

function makeRequest(path, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function test() {
  try {
    console.log('Step 1: Login to get token...');
    const loginRes = await makeRequest(
      '/api/auth/login',
      'POST',
      { 'Content-Type': 'application/json' }
    );
    
    // Need to send POST body - let me revise this approach
    console.log('Login endpoint status:', loginRes.statusCode);
    
    // For now, use a pre-known token or manual login
    console.log('\nNote: Need to update script to send POST body');
    console.log('Using curl instead...');
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
