import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/doctor-appointment";
    console.log(`Attempting to connect to MongoDB...`);
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`MongoDB Connection Error: ${error.message}`);
      console.log("Please ensure MongoDB is running or set MONGO_URI environment variable");
      console.log("Server will continue without database connection for testing purposes");
    } else {
      console.log("An unknown error occurred while connecting to MongoDB.");
      console.log("Server will continue without database connection for testing purposes");
    }
    // Don't exit the process for testing purposes
    // process.exit(1);
  }
};
