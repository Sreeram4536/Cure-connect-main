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
import adminWalletRouter from "./routes/adminWalletRoute";
import doctorWalletRouter from "./routes/doctorWalletRoute";
import { initializePatientHistoryRoutes } from "./routes/patientHistoryRoute";
import { patientHistoryService } from "./dependencyhandler/doctor.dependency";
import { AppointmentRepository } from "./repositories/implementation/AppointmentRepository";
import { PrescriptionRepository } from "./repositories/implementation/PrescriptionRepository";
import { DoctorRepository } from "./repositories/implementation/DoctorRepository";
import { UserRepository } from "./repositories/implementation/UserRepository";
import "./utils/passport";
import passport from "passport";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupSocketHandlers } from "./socket/socketHandlers";
import { setIO } from "./utils/socketManager";
import morgan from "morgan"
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
setIO(io);

const PORT = process.env.PORT || 4000;

connectDB();
connectCloudinary();


setupSocketHandlers(io);

// middlewares
app.use(express.json());
app.use(morgan("dev"))
app.use(cookieParser());
app.use(
  cors({
    origin:"http://localhost:5173",
    credentials: true,
  })
);

// initialize passport
app.use(passport.initialize());

// api endpoints
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/admin-wallet", adminWalletRouter);
app.use("/api/doctor-wallet", doctorWalletRouter);
app.use("/api/doctor/patient-history", initializePatientHistoryRoutes(
  patientHistoryService,
  new AppointmentRepository(),
  new PrescriptionRepository(),
  new DoctorRepository(),
  new UserRepository()
));

app.get("/", (req, res) => {
  res.send("API WORKING");
});

server.listen(PORT, () => {
  console.log("Server Started", PORT);
});
