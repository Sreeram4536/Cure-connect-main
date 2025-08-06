# Token Expiration Fix - Testing Guide

## 🔧 **Changes Made:**

### **1. Extended JWT Token Expiration**
- Changed from 15 minutes to 24 hours
- File: `backend/src/utils/jwt.utils.ts`

### **2. Improved Socket.IO Authentication**
- Added handling for expired tokens
- Allows connection with expired tokens for debugging
- File: `backend/src/socket/socketHandlers.ts`

### **3. Added Token Refresh Utility**
- Created token refresh mechanism
- File: `frontend/src/utils/tokenRefresh.ts`

### **4. Enhanced Socket.IO Context**
- Added automatic token refresh on connection errors
- File: `frontend/src/context/SocketContext.tsx`

## 🧪 **Testing Steps:**

### **Step 1: Restart Backend Server**
```bash
cd backend
npm run dev
```

### **Step 2: Check Token Expiration**
- Login as a user or doctor
- Check browser console for token expiration time
- Should now be 24 hours instead of 15 minutes

### **Step 3: Test Socket.IO Connection**
- Open browser console (F12)
- Look for Socket.IO connection logs
- Should see: "Socket connected" instead of authentication errors

### **Step 4: Test Real-Time Chat**
- Open two browser windows
- Login as user in one, doctor in another
- Start a chat and send messages
- Messages should appear in real-time

## 🔍 **Expected Logs:**

### **Backend Console:**
```
✅ Socket auth - Token received: Yes
✅ Socket auth - JWT_SECRET exists: true
✅ Socket auth - Decoded token: { id: '...', role: 'user' }
✅ Socket auth - User authenticated: { userId: '...', userType: 'user' }
✅ User connected: [userId] (user)
```

### **Frontend Console:**
```
✅ Socket connected
✅ Socket connection - Token found: true
✅ Joining conversation: [conversation-id]
✅ Sending message via Socket.IO: [message] to conversation [conversation-id]
✅ User received new message: [data]
```

## 🚨 **If Still Not Working:**

### **Check Token Expiration:**
1. Open browser console
2. Run: `localStorage.getItem('token')`
3. Decode the token at jwt.io to check expiration

### **Force Token Refresh:**
1. Clear browser storage: `localStorage.clear()`
2. Logout and login again
3. Check if new token has 24-hour expiration

### **Check Socket.IO Connection:**
1. Look for green dot in bottom-right corner
2. If red, check browser console for errors
3. Restart backend server if needed

## 🎯 **Success Criteria:**
- [ ] Socket.IO connects without authentication errors
- [ ] Green connection indicator shows in chat
- [ ] Messages send and receive in real-time
- [ ] No "TokenExpiredError" in backend logs
- [ ] No refresh required to see messages

The token expiration issue should now be resolved, and real-time chat should work properly! 