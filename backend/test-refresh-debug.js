const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4000';

async function testRefreshTokenDebug() {
  console.log('🔍 Testing Refresh Token Debug...\n');

  try {
    // Test 1: Admin Login
    console.log('1️⃣ Testing Admin Login...');
    const adminLoginResponse = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    console.log('Admin Login Status:', adminLoginResponse.status);
    const adminLoginData = await adminLoginResponse.json();
    console.log('Admin Login Response:', adminLoginData);
    
    if (adminLoginData.success) {
      const adminCookies = adminLoginResponse.headers.get('set-cookie');
      console.log('Admin Cookies:', adminCookies);
      
      // Test 2: Admin Refresh Token
      console.log('\n2️⃣ Testing Admin Refresh Token...');
      const adminRefreshResponse = await fetch(`${BASE_URL}/api/admin/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': adminCookies
        }
      });

      console.log('Admin Refresh Status:', adminRefreshResponse.status);
      const adminRefreshData = await adminRefreshResponse.json();
      console.log('Admin Refresh Response:', adminRefreshData);
    }

    // Test 3: Admin Dashboard (should work with refresh)
    console.log('\n3️⃣ Testing Admin Dashboard...');
    const adminDashboardResponse = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminLoginData.token}`,
        'Cookie': adminLoginResponse.headers.get('set-cookie')
      }
    });

    console.log('Admin Dashboard Status:', adminDashboardResponse.status);
    const adminDashboardData = await adminDashboardResponse.json();
    console.log('Admin Dashboard Response:', adminDashboardData);

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Run the test
testRefreshTokenDebug(); 