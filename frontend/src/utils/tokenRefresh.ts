// Token refresh utility for Socket.IO connections
export const refreshToken = async (): Promise<string | null> => {
  try {
    console.log('Attempting to refresh token...');
    
    // Try user refresh token endpoint first (uses HTTP-only cookies)
    let response = await fetch('http://localhost:4000/api/user/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies
    });

    // If user endpoint fails, try doctor endpoint
    if (!response.ok) {
      console.log('User refresh failed, trying doctor refresh...');
      response = await fetch('http://localhost:4000/api/doctor/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies
      });
    }

    // If doctor endpoint fails, try admin endpoint
    if (!response.ok) {
      console.log('Doctor refresh failed, trying admin refresh...');
      response = await fetch('http://localhost:4000/api/admin/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies
      });
    }

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.token) {
        // Store new access token
        localStorage.setItem('token', data.token);
        console.log('Token refreshed successfully');
        return data.token;
      }
    }
    
    console.log('Token refresh failed:', response.status, response.statusText);
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

export const getValidToken = async (): Promise<string | null> => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    console.log('No token found, attempting refresh');
    return await refreshToken();
  }

  try {
    // Check if token is expired by decoding it (without verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp && payload.exp < currentTime) {
      console.log('Token expired, attempting refresh');
      return await refreshToken();
    }
    
    return token;
  } catch (error) {
    console.error('Error checking token:', error);
    return await refreshToken();
  }
}; 