import express from "express";
import cors from "cors";
import { connectDB } from "./config/mongodb";
import connectCloudinary from "./config/cloudinary";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import adminRouter from "./routes/adminRoute";
import doctorRouter from "./routes/doctorRoute";
import userRouter from "./routes/userRoute";
import authRouter from "./routes/authRoute";
import chatRouter from "./routes/chatRoute";
import walletRouter from "./routes/walletRoute";
import "./utils/passport";
import passport from "passport";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupSocketHandlers } from "./socket/socketHandlers";
import path from "path";
import fs from "fs";
dotenv.config();

// app config
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

const PORT = process.env.PORT || 4000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

connectDB();
connectCloudinary();

// Setup Socket.IO handlers
setupSocketHandlers(io);

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// initialize passport
app.use(passport.initialize());

// api endpoints
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/wallet", walletRouter);

app.get("/", (req, res) => {
  res.send("API WORKING");
});

server.listen(PORT, () => {
  console.log("Server Started", PORT);
});
