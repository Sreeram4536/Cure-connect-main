#!/bin/bash

echo "🚀 Setting up Enhanced Chat Features..."

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p backend/uploads/chat
chmod 755 backend/uploads/chat

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install multer uuid @types/multer @types/uuid --save

# Install frontend dependencies (if needed)
echo "📦 Checking frontend dependencies..."
cd ../frontend
# All required dependencies should already be installed

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Test the enhanced chat features!"
echo ""
echo "📖 See ENHANCED_CHAT_FEATURES.md for detailed testing guide"