const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4000';

async function testRefreshToken() {
  console.log('🧪 Testing Refresh Token Fix...\n');

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

    const adminLoginData = await adminLoginResponse.json();
    console.log('Admin Login Response:', adminLoginData.success ? '✅ Success' : '❌ Failed');
    
    if (adminLoginData.success) {
      const adminCookies = adminLoginResponse.headers.get('set-cookie');
      console.log('Admin Cookies Set:', adminCookies ? '✅ Yes' : '❌ No');
      
      // Test 2: Admin Refresh Token
      console.log('\n2️⃣ Testing Admin Refresh Token...');
      const adminRefreshResponse = await fetch(`${BASE_URL}/api/admin/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': adminCookies
        }
      });

      const adminRefreshData = await adminRefreshResponse.json();
      console.log('Admin Refresh Response:', adminRefreshData.success ? '✅ Success' : '❌ Failed');
      if (!adminRefreshData.success) {
        console.log('Admin Refresh Error:', adminRefreshData.message);
      }
    }

    // Test 3: User Login
    console.log('\n3️⃣ Testing User Login...');
    const userLoginResponse = await fetch(`${BASE_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'user123'
      })
    });

    const userLoginData = await userLoginResponse.json();
    console.log('User Login Response:', userLoginData.success ? '✅ Success' : '❌ Failed');
    
    if (userLoginData.success) {
      const userCookies = userLoginResponse.headers.get('set-cookie');
      console.log('User Cookies Set:', userCookies ? '✅ Yes' : '❌ No');
      
      // Test 4: User Refresh Token
      console.log('\n4️⃣ Testing User Refresh Token...');
      const userRefreshResponse = await fetch(`${BASE_URL}/api/user/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': userCookies
        }
      });

      const userRefreshData = await userRefreshResponse.json();
      console.log('User Refresh Response:', userRefreshData.success ? '✅ Success' : '❌ Failed');
      if (!userRefreshData.success) {
        console.log('User Refresh Error:', userRefreshData.message);
      }
    }

    // Test 5: Doctor Login
    console.log('\n5️⃣ Testing Doctor Login...');
    const doctorLoginResponse = await fetch(`${BASE_URL}/api/doctor/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'doctor@example.com',
        password: 'doctor123'
      })
    });

    const doctorLoginData = await doctorLoginResponse.json();
    console.log('Doctor Login Response:', doctorLoginData.success ? '✅ Success' : '❌ Failed');
    
    if (doctorLoginData.success) {
      const doctorCookies = doctorLoginResponse.headers.get('set-cookie');
      console.log('Doctor Cookies Set:', doctorCookies ? '✅ Yes' : '❌ No');
      
      // Test 6: Doctor Refresh Token
      console.log('\n6️⃣ Testing Doctor Refresh Token...');
      const doctorRefreshResponse = await fetch(`${BASE_URL}/api/doctor/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': doctorCookies
        }
      });

      const doctorRefreshData = await doctorRefreshResponse.json();
      console.log('Doctor Refresh Response:', doctorRefreshData.success ? '✅ Success' : '❌ Failed');
      if (!doctorRefreshData.success) {
        console.log('Doctor Refresh Error:', doctorRefreshData.message);
      }
    }

    console.log('\n🎯 Test Complete!');
    console.log('If you see "✅ Success" for all refresh token tests, the fix is working!');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Run the test
testRefreshToken(); 