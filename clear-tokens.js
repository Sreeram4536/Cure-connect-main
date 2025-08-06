// Clear expired tokens from browser storage
console.log('Clearing expired tokens...');

// Clear localStorage
localStorage.removeItem('token');
localStorage.removeItem('refreshToken');
localStorage.removeItem('userToken');
localStorage.removeItem('doctorToken');
localStorage.removeItem('adminToken');

// Clear sessionStorage
sessionStorage.removeItem('token');
sessionStorage.removeItem('refreshToken');
sessionStorage.removeItem('userToken');
sessionStorage.removeItem('doctorToken');
sessionStorage.removeItem('adminToken');

console.log('✅ Tokens cleared! Please login again to get fresh tokens.');

// Optional: Redirect to login page
// window.location.href = '/login'; 