const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:4000';

// Test credentials (you'll need to replace these with actual test accounts)
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'password123'
};

const TEST_DOCTOR = {
  email: 'testdoctor@example.com', 
  password: 'password123'
};

let userToken = '';
let doctorToken = '';
let conversationId = '';

async function loginUser() {
  try {
    console.log('🔐 Logging in user...');
    const response = await axios.post(`${BASE_URL}/api/user/login`, TEST_USER);
    if (response.data.success) {
      userToken = response.data.token;
      console.log('✅ User logged in successfully');
      return true;
    }
  } catch (error) {
    console.log('❌ User login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function loginDoctor() {
  try {
    console.log('🔐 Logging in doctor...');
    const response = await axios.post(`${BASE_URL}/api/doctor/login`, TEST_DOCTOR);
    if (response.data.success) {
      doctorToken = response.data.token;
      console.log('✅ Doctor logged in successfully');
      return true;
    }
  } catch (error) {
    console.log('❌ Doctor login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function createConversation() {
  try {
    console.log('💬 Creating conversation...');
    // Get doctor ID first (you'll need to replace with actual doctor ID)
    const doctorId = 'REPLACE_WITH_ACTUAL_DOCTOR_ID';
    
    const response = await axios.post(
      `${BASE_URL}/api/chat/conversations`,
      { doctorId },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    
    if (response.data.success) {
      conversationId = response.data.conversation.id;
      console.log('✅ Conversation created:', conversationId);
      return true;
    }
  } catch (error) {
    console.log('❌ Conversation creation failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testUserMessage() {
  try {
    console.log('📤 Testing user message via REST API...');
    const response = await axios.post(
      `${BASE_URL}/api/chat/messages`,
      {
        conversationId,
        message: 'Test message from user via REST API',
        messageType: 'text'
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    
    if (response.data.success) {
      const message = response.data.message;
      console.log('✅ User message sent via REST API');
      console.log(`   Sender Type: ${message.senderType} (should be "user")`);
      console.log(`   Sender ID: ${message.senderId}`);
      return message.senderType === 'user';
    }
  } catch (error) {
    console.log('❌ User message failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDoctorMessage() {
  try {
    console.log('📤 Testing doctor message via REST API...');
    const response = await axios.post(
      `${BASE_URL}/api/chat/messages/doctor`,
      {
        conversationId,
        message: 'Test message from doctor via REST API',
        messageType: 'text'
      },
      { headers: { Authorization: `Bearer ${doctorToken}` } }
    );
    
    if (response.data.success) {
      const message = response.data.message;
      console.log('✅ Doctor message sent via REST API');
      console.log(`   Sender Type: ${message.senderType} (should be "doctor")`);
      console.log(`   Sender ID: ${message.senderId}`);
      return message.senderType === 'doctor';
    }
  } catch (error) {
    console.log('❌ Doctor message failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testSocketMessages() {
  return new Promise((resolve) => {
    console.log('🔌 Testing Socket.IO messages...');
    
    let userSocket, doctorSocket;
    let userMessageCorrect = false;
    let doctorMessageCorrect = false;
    let messagesReceived = 0;
    
    // Connect user socket
    userSocket = io(BASE_URL, {
      auth: { token: userToken },
      transports: ['polling', 'websocket']
    });
    
    // Connect doctor socket  
    doctorSocket = io(BASE_URL, {
      auth: { token: doctorToken },
      transports: ['polling', 'websocket']
    });
    
    userSocket.on('connect', () => {
      console.log('✅ User socket connected');
      userSocket.emit('join_conversation', { conversationId });
    });
    
    doctorSocket.on('connect', () => {
      console.log('✅ Doctor socket connected');
      doctorSocket.emit('join_conversation', { conversationId });
      
      // Send test messages after both are connected
      setTimeout(() => {
        console.log('📤 Sending user message via socket...');
        userSocket.emit('send_message', {
          conversationId,
          message: 'Test user message via socket',
          messageType: 'text'
        });
        
        setTimeout(() => {
          console.log('📤 Sending doctor message via socket...');
          doctorSocket.emit('send_message', {
            conversationId,
            message: 'Test doctor message via socket', 
            messageType: 'text'
          });
        }, 1000);
      }, 1000);
    });
    
    // Listen for new messages
    const handleNewMessage = (data) => {
      messagesReceived++;
      const message = data.message;
      console.log(`📨 Received message #${messagesReceived}:`);
      console.log(`   Sender Type: ${message.senderType}`);
      console.log(`   Message: ${message.message}`);
      
      if (message.message.includes('user message')) {
        userMessageCorrect = message.senderType === 'user';
        console.log(`   User message sender type: ${userMessageCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
      }
      
      if (message.message.includes('doctor message')) {
        doctorMessageCorrect = message.senderType === 'doctor';
        console.log(`   Doctor message sender type: ${doctorMessageCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
      }
      
      // Close sockets after receiving both messages
      if (messagesReceived >= 2) {
        setTimeout(() => {
          userSocket.disconnect();
          doctorSocket.disconnect();
          resolve(userMessageCorrect && doctorMessageCorrect);
        }, 1000);
      }
    };
    
    userSocket.on('new_message', handleNewMessage);
    doctorSocket.on('new_message', handleNewMessage);
    
    userSocket.on('connect_error', (error) => {
      console.log('❌ User socket connection error:', error.message);
    });
    
    doctorSocket.on('connect_error', (error) => {
      console.log('❌ Doctor socket connection error:', error.message);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      userSocket?.disconnect();
      doctorSocket?.disconnect();
      resolve(false);
    }, 10000);
  });
}

async function runTests() {
  console.log('🧪 Testing Message Sender Type Fix\n');
  
  // Step 1: Login
  const userLoggedIn = await loginUser();
  const doctorLoggedIn = await loginDoctor();
  
  if (!userLoggedIn || !doctorLoggedIn) {
    console.log('❌ Cannot proceed - login failed');
    return;
  }
  
  // Step 2: Create conversation
  const conversationCreated = await createConversation();
  if (!conversationCreated) {
    console.log('❌ Cannot proceed - conversation creation failed');
    return;
  }
  
  // Step 3: Test REST API messages
  console.log('\n📡 Testing REST API Messages:');
  const userRestCorrect = await testUserMessage();
  const doctorRestCorrect = await testDoctorMessage();
  
  // Step 4: Test Socket.IO messages
  console.log('\n🔌 Testing Socket.IO Messages:');
  const socketCorrect = await testSocketMessages();
  
  // Results
  console.log('\n📊 Test Results:');
  console.log(`REST API - User messages: ${userRestCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
  console.log(`REST API - Doctor messages: ${doctorRestCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
  console.log(`Socket.IO - Messages: ${socketCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
  
  const allPassed = userRestCorrect && doctorRestCorrect && socketCorrect;
  console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('🎉 The message sender type issue has been fixed!');
  } else {
    console.log('🔧 Further investigation needed.');
  }
}

// Run the tests
runTests().catch(console.error);