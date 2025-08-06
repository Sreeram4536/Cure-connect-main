# 🔍 Admin Refresh Token Debug Guide

## 🚨 **Issue:**
Admin axios instance is failing at line 40 with refresh token errors.

## 🔧 **Debugging Steps:**

### **Step 1: Check Backend Logs**
Look for these logs in the backend console:
```
🔍 Admin login request received
🔍 Attempting admin login for email: admin@example.com
🔍 Admin login successful, setting cookie
✅ Admin login response sent

🔍 Admin refresh token request received
🔍 Cookies: { refreshToken_admin: '...' }
🔍 Refresh token found, verifying...
🔍 Decoded refresh token: { id: '...', role: 'admin' }
🔍 Looking up admin with ID: ...
🔍 Admin found, generating new tokens
🔍 Setting new refresh token cookie
✅ Admin refresh successful
```

### **Step 2: Check Frontend Console**
Look for these logs in the browser console:
```
Admin axios: 401 error, attempting token refresh...
Admin axios: Making refresh token request...
Admin axios: Refresh response status: 200
Admin axios: Refresh response data: { success: true, token: '...' }
Admin axios: Updating token with new token
```

### **Step 3: Test Admin Login**
```javascript
// In browser console
fetch('http://localhost:4000/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  })
}).then(r => r.json()).then(console.log);
```

### **Step 4: Test Admin Refresh Token**
```javascript
// In browser console
fetch('http://localhost:4000/api/admin/refresh-token', {
  method: 'POST',
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

### **Step 5: Check Cookies**
```javascript
// In browser console
document.cookie
```

## 🔍 **Common Issues:**

### **Issue 1: No Refresh Token in Cookies**
**Symptoms:** `❌ No refresh token found in cookies`
**Solution:** Clear browser data and login again

### **Issue 2: Invalid Refresh Token**
**Symptoms:** `❌ Invalid refresh token structure`
**Solution:** Check if refresh token includes role information

### **Issue 3: Admin Not Found**
**Symptoms:** `❌ Admin not found with ID: ...`
**Solution:** Check if admin exists in database

### **Issue 4: Frontend Refresh Fails**
**Symptoms:** `Admin axios: Refresh error: ...`
**Solution:** Check network tab for 401 errors

## 🎯 **Expected Results:**

### **✅ Working:**
- Backend logs show successful admin login and refresh
- Frontend logs show successful token refresh
- No 401 errors in network tab
- Admin dashboard loads without errors

### **❌ Not Working:**
- Backend logs show errors
- Frontend logs show refresh failures
- 401 errors in network tab
- Admin dashboard fails to load

## 🚨 **If Still Getting Errors:**

### **Check Database:**
```javascript
// In MongoDB shell or Compass
db.admins.find({})
```

### **Check Environment Variables:**
```bash
# In backend directory
echo $JWT_SECRET
echo $JWT_REFRESH_SECRET
```

### **Check Network Tab:**
1. Open browser DevTools
2. Go to Network tab
3. Try to access admin dashboard
4. Look for requests with 401 status
5. Check request/response headers

The debugging logs should help identify exactly where the issue is occurring! 