// Test refresh token functionality
async function testRefreshToken() {
  console.log('Testing refresh token functionality...');
  
  try {
    // Test user refresh token
    console.log('\n1. Testing user refresh token...');
    const userResponse = await fetch('http://localhost:4000/api/user/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    console.log('User refresh response status:', userResponse.status);
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('User refresh success:', userData.success);
    } else {
      const userError = await userResponse.text();
      console.log('User refresh error:', userError);
    }
    
    // Test doctor refresh token
    console.log('\n2. Testing doctor refresh token...');
    const doctorResponse = await fetch('http://localhost:4000/api/doctor/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    console.log('Doctor refresh response status:', doctorResponse.status);
    if (doctorResponse.ok) {
      const doctorData = await doctorResponse.json();
      console.log('Doctor refresh success:', doctorData.success);
    } else {
      const doctorError = await doctorResponse.text();
      console.log('Doctor refresh error:', doctorError);
    }
    
    // Test admin refresh token
    console.log('\n3. Testing admin refresh token...');
    const adminResponse = await fetch('http://localhost:4000/api/admin/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    console.log('Admin refresh response status:', adminResponse.status);
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log('Admin refresh success:', adminData.success);
    } else {
      const adminError = await adminResponse.text();
      console.log('Admin refresh error:', adminError);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testRefreshToken(); 