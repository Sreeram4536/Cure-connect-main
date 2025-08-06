const mongoose = require('mongoose');
require('dotenv').config();

// Test MongoDB connection
async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
    
    // Test if ChatMessage model can be created
    const ChatMessage = mongoose.model('ChatMessage', new mongoose.Schema({
      conversationId: String,
      senderId: String,
      senderType: String,
      message: String,
      messageType: String,
      timestamp: Date,
      isRead: Boolean,
      attachments: [String]
    }));
    
    console.log('ChatMessage model created successfully');
    
    // Test if Conversation model can be created
    const Conversation = mongoose.model('Conversation', new mongoose.Schema({
      userId: String,
      doctorId: String,
      lastMessage: String,
      lastMessageTime: Date,
      unreadCount: Number,
      isActive: Boolean
    }));
    
    console.log('Conversation model created successfully');
    
    await mongoose.disconnect();
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testConnection(); 