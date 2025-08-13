# Doctor Appointment System

A comprehensive healthcare management system built with React.js (frontend) and Node.js (backend), featuring real-time chat between doctors and patients.

## New Chat Features

### Message Deletion
- Users and doctors can delete their own messages
- Real-time deletion via Socket.IO
- Delete button appears on hover over own messages
- Fallback to REST API if socket connection is unavailable

### File & Image Sharing
- Upload images and documents in chat
- Supported file types: images (all formats), PDF, DOC, DOCX, TXT, XLS, XLSX
- 10MB file size limit
- Real-time file sharing via Socket.IO
- Files are stored locally and served statically

## Features

- User registration and authentication
- Doctor profile management
- Real-time chat between doctors and patients
- File and image sharing in chat
- Message deletion functionality
- Admin panel for user and doctor management
- Appointment booking system
- Email verification
- OTP-based password reset

## Tech Stack

### Frontend
- React.js with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Socket.IO client (real-time communication)
- Axios (HTTP client)
- React Router (navigation)
- React Toastify (notifications)

### Backend
- Node.js with Express.js
- TypeScript
- MongoDB with Mongoose
- Socket.IO (real-time communication)
- JWT (authentication)
- Multer (file uploads)
- Cloudinary (image storage for profiles)
- Nodemailer (email services)

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Backend Setup
1. Navigate to the backend directory
2. Install dependencies: `npm install`
3. Create a `.env` file with required environment variables
4. Start the server: `npm run dev`

### Frontend Setup
1. Navigate to the frontend directory
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## API Endpoints

### Chat Endpoints
- `POST /api/chat/messages/upload` - Upload file in chat
- `DELETE /api/chat/messages/:messageId` - Delete message
- `POST /api/chat/messages` - Send text message
- `GET /api/chat/messages/:conversationId` - Get messages
- `POST /api/chat/conversations` - Create conversation
- `GET /api/chat/conversations` - Get user conversations

### Socket Events
- `send_message` - Send message via socket
- `delete_message` - Delete message via socket
- `message_deleted` - Message deletion notification
- `new_message` - New message notification
- `typing_start`/`typing_stop` - Typing indicators

## File Upload Configuration
- Upload directory: `backend/uploads/`
- Accepted file types: Images, PDF, DOC, DOCX, TXT, XLS, XLSX
- Maximum file size: 10MB
- Files are served at: `http://localhost:4000/uploads/`

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
This project is licensed under the MIT License.