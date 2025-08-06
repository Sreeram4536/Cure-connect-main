const io = require('socket.io-client');

// Test Socket.IO connection
async function testSocketConnection() {
  console.log('Testing Socket.IO connection...');
  
  // Create a test token (you'll need to replace this with a real token)
  const testToken = 'your-test-token-here';
  
  const socket = io('http://localhost:4000', {
    auth: {
      token: testToken,
    },
    transports: ['polling', 'websocket'],
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected successfully');
    
    // Test joining a conversation
    socket.emit('join_conversation', { conversationId: 'test-conversation-id' });
    console.log('📤 Sent join_conversation event');
    
    // Test sending a message
    setTimeout(() => {
      socket.emit('send_message', {
        conversationId: 'test-conversation-id',
        message: 'Test message from script',
        messageType: 'text',
      });
      console.log('📤 Sent send_message event');
    }, 1000);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  socket.on('new_message', (data) => {
    console.log('📨 Received new_message event:', data);
  });

  socket.on('message_error', (data) => {
    console.error('❌ Message error:', data);
  });

  // Cleanup after 5 seconds
  setTimeout(() => {
    socket.disconnect();
    console.log('🧹 Test completed');
  }, 5000);
}

// Run the test
testSocketConnection().catch(console.error); 