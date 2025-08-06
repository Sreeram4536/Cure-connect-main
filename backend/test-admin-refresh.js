const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4000';

async function testAdminRefresh() {
  console.log('🔍 Testing Admin Refresh Token...\n');

  try {
    // Step 1: Admin Login
    console.log('1️⃣ Admin Login...');
    const loginResponse = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    console.log('Login Status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login Response:', loginData);

    if (!loginData.success) {
      console.log('❌ Login failed');
      return;
    }

    // Get cookies from login response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies from login:', cookies);

    // Step 2: Test Refresh Token
    console.log('\n2️⃣ Testing Refresh Token...');
    const refreshResponse = await fetch(`${BASE_URL}/api/admin/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    });

    console.log('Refresh Status:', refreshResponse.status);
    const refreshData = await refreshResponse.json();
    console.log('Refresh Response:', refreshData);

    // Step 3: Test Dashboard with new token
    if (refreshData.success && refreshData.token) {
      console.log('\n3️⃣ Testing Dashboard with new token...');
      const dashboardResponse = await fetch(`${BASE_URL}/api/admin/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshData.token}`,
          'Cookie': cookies
        }
      });

      console.log('Dashboard Status:', dashboardResponse.status);
      const dashboardData = await dashboardResponse.json();
      console.log('Dashboard Response:', dashboardData);
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Run the test
testAdminRefresh(); 