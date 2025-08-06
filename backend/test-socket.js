const io = require('socket.io-client');

// Test Socket.IO connection
const socket = io('http://localhost:4000', {
  auth: {
    token: 'test-token' // This will fail authentication, but we can test connection
  }
});

socket.on('connect', () => {
  console.log('✅ Socket connected successfully');
});

socket.on('connect_error', (error) => {
  console.log('❌ Socket connection error:', error.message);
});

socket.on('disconnect', () => {
  console.log('🔌 Socket disconnected');
});

// Test message sending
setTimeout(() => {
  if (socket.connected) {
    console.log('📤 Testing message sending...');
    socket.emit('send_message', {
      conversationId: 'test-conversation',
      message: 'Hello from test client!',
      messageType: 'text'
    });
  }
}, 2000);

// Cleanup after 5 seconds
setTimeout(() => {
  socket.disconnect();
  process.exit(0);
}, 5000); 