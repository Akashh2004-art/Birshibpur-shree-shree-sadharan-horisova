import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import path from 'path';
import fs from 'fs';

// Import socket configuration
import { initializeSocket } from "./config/socket.config";

// Import routes
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import passwordRoutes from "./routes/passwordRoutes";
import userAuthRoutes from "./routes/userAuthRoutes";
import userPasswordRoutes from "./routes/userPasswordRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import eventRoutes from "./routes/eventRoutes";
import galleryRoutes from "./routes/galleryRoutes"; 
import bookingRoutes from './routes/bookingRoutes';

dotenv.config();

// Create required directories
const createRequiredDirs = () => {
  const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/gallery'),
    path.join(__dirname, 'uploads/events')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createRequiredDirs();

const app: Application = express();
const server = createServer(app);

// ✅ SINGLE SOCKET INITIALIZATION
const io = initializeSocket(server);
export { io };

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'অনেক বেশি রিকোয়েস্ট করা হয়েছে, কিছুক্ষণ পর চেষ্টা করুন।',
    retryAfter: 15
  }
});

app.use('/api', limiter);

// MongoDB Connection
const connectDB = async (retries = 5) => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      process.exit(1);
    }
  }
};

// Start server function
const startServer = async () => {
  try {
    await connectDB();

    // CORS configuration
    app.use(cors({
      origin: [
        process.env.CLIENT_URL || "http://localhost:5173",
        process.env.ADMIN_URL || "http://localhost:5100"
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    }));

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Serve static files
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // Health check endpoint
    app.get("/health", (req: Request, res: Response) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime()
      });
    });

    // API Routes
    app.use("/api/user-auth", userAuthRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/password", passwordRoutes);
    app.use("/api/user", userPasswordRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/events", eventRoutes);
    app.use("/api/gallery", galleryRoutes);
    app.use('/api/bookings', bookingRoutes);

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: "রিকোয়েস্টকৃত পাথটি খুঁজে পাওয়া যায়নি"
      });
    });

    // Global error handler
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error("❌ Error:", {
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        message: "অভ্যন্তরীণ সার্ভার ত্রুটি",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
      });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`
🚀 Server is running!
📱 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}
👑 Admin URL: ${process.env.ADMIN_URL || 'http://localhost:5100'}
🔌 API Server: http://localhost:${PORT}
🌐 Socket.io: Enabled
⏰ Started at: ${new Date().toLocaleString()}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
      `);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, shutting down gracefully');
  server.close(async () => {
    try {
      io.close();
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error closing connections:', err);
      process.exit(1);
    }
  });
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT received, shutting down gracefully');
  server.close(async () => {
    try {
      io.close();
      await mongoose.connection.close();
      console.log('✅ Server closed gracefully');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error closing connections:', err);
      process.exit(1);
    }
  });
});

startServer();
export default app;