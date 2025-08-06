const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testChat() {
  console.log('🧪 Testing Chat Functionality...\n');

  try {
    // Test 1: Basic server response
    console.log('1. Testing basic server response...');
    const response = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is running:', response.data);
    console.log('');

    // Test 2: Check Socket.IO endpoint
    console.log('2. Testing Socket.IO endpoint...');
    try {
      const socketResponse = await axios.get(`${BASE_URL}/socket.io/`);
      console.log('✅ Socket.IO endpoint is accessible');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Socket.IO endpoint is accessible (400 is expected for invalid requests)');
      } else {
        console.log('❌ Socket.IO endpoint error:', error.message);
      }
    }
    console.log('');

    // Test 3: Check chat routes (will fail with 401 but shows routes exist)
    console.log('3. Testing chat routes...');
    try {
      await axios.get(`${BASE_URL}/api/chat/conversations`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Chat routes are accessible (401 Unauthorized is expected)');
      } else {
        console.log('❌ Chat routes error:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Chat test failed:', error.message);
  }
}

testChat(); 