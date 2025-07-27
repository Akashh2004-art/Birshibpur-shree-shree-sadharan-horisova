import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import path from 'path';
import fs from 'fs';
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import passwordRoutes from "./routes/passwordRoutes";
import userAuthRoutes from "./routes/userAuthRoutes";
import userPasswordRoutes from "./routes/userPasswordRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import dashboardRoutes from "./routes/dashboardRoutes"; // ড্যাশবোর্ড রাউট ইম্পোর্ট করা হয়েছে
import eventRoutes from "./routes/eventRoutes"; // Add this import

dotenv.config();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const app: Application = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5100"], // Admin and User frontends
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// Export io to be used in other files
export { io };

// Add this to serve uploaded files
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb+srv://akashsaha0751:US1VPMcJTKy3FSYS@cluster0.iz9uj.mongodb.net/temple_management"
    );
    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Start the server
const startServer = async () => {
  try {
    await connectDB();

    // Middlewares
    app.use(
      cors({
        origin: [
          "http://localhost:5173", // Admin frontend
          "http://localhost:5100", // User frontend
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    app.use(express.json()); // JSON ডাটা পার্স করা
    app.use(express.urlencoded({ extended: true }));

    // Socket.io setup
    io.on("connection", (socket) => {

      socket.on("disconnect", () => {
      });
    });

    // Health check endpoint
    app.get("/health", (req: Request, res: Response) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    });

    // Routes
    app.use("/api/user", userAuthRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/password", passwordRoutes);
    app.use("/api/user", userPasswordRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/dashboard", dashboardRoutes); 
    app.use("/api/user", userAuthRoutes);
    app.use("/api/events", eventRoutes); 

    if (process.env.NODE_ENV === "development") {
      app._router.stack.forEach((r: any) => {
        if (r.route && r.route.path) {
        }
      });
    }

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: "রিকোয়েস্টকৃত পাথটি খুঁজে পাওয়া যায়নি",
      });
    });

    // Global error handler
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error("❌ Error:", {
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      res.status(500).json({
        success: false,
        message: "অভ্যন্তরীণ সার্ভার ত্রুটি",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    });

    // Start server with http server instead of express app
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`
🚀 Server is running!
📱 Admin Frontend: http://localhost:5173
👥 User Frontend: http://localhost:5100
🔌 API Server: http://localhost:${PORT}
⏰ Started at: ${new Date().toLocaleString()}
      `);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
};

startServer();
export default app;
