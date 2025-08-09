import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import path from 'path';
import fs from 'fs';

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

// Socket.io setup with security options
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      process.env.ADMIN_URL || "http://localhost:5100"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6, // 1 MB
  transports: ['websocket', 'polling']
});

export { io };

// ✅ SOCKET CONFIGURATION WITH ROOM MANAGEMENT
interface ConnectedUser {
  socketId: string;
  userId?: string;
  role: 'user' | 'admin';
  connectedAt: Date;
}

const connectedUsers = new Map<string, ConnectedUser>();
let adminConnections = 0;
let userConnections = 0;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'অনেক বেশি রিকোয়েস্ট করা হয়েছে, কিছুক্ষণ পর চেষ্টা করুন।',
    retryAfter: 15
  }
});

app.use('/api', limiter);

// MongoDB Connection with retry logic
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

    // Body parsing with limits
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Serve static files
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // ✅ ENHANCED SOCKET.IO CONNECTION HANDLING
    io.on("connection", (socket) => {
      console.log(`🔌 New socket connection: ${socket.id}`);

      // Default user connection
      connectedUsers.set(socket.id, {
        socketId: socket.id,
        role: 'user',
        connectedAt: new Date()
      });
      userConnections++;

      // ✅ JOIN USER ROOM - For receiving booking status updates
      socket.on('join-user-room', (userId: string) => {
        if (userId) {
          console.log(`👤 User ${userId} joining room: user-${userId}`);
          socket.join(`user-${userId}`);
          
          // Update user info
          const userInfo = connectedUsers.get(socket.id);
          if (userInfo) {
            userInfo.userId = userId;
            connectedUsers.set(socket.id, userInfo);
          }

          // Acknowledge successful join
          socket.emit('user-room-joined', { 
            userId, 
            room: `user-${userId}`,
            message: 'Successfully joined user room'
          });
        }
      });

      // ✅ LEAVE USER ROOM
      socket.on('leave-user-room', (userId: string) => {
        if (userId) {
          console.log(`👤 User ${userId} leaving room: user-${userId}`);
          socket.leave(`user-${userId}`);
          socket.emit('user-room-left', { 
            userId, 
            room: `user-${userId}`,
            message: 'Left user room'
          });
        }
      });

      // ✅ JOIN ADMIN ROOM - For receiving new bookings and updates
      socket.on('join-admin-room', () => {
        console.log(`👨‍💼 Admin joining admin room: ${socket.id}`);
        socket.join('admin-room');
        
        // Update connection type
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          userInfo.role = 'admin';
          connectedUsers.set(socket.id, userInfo);
          
          // Update counters
          userConnections--;
          adminConnections++;
        }

        // Send current connection stats to admin
        socket.emit('admin-room-joined', {
          message: 'Successfully joined admin room',
          connectionStats: {
            totalConnections: connectedUsers.size,
            adminConnections,
            userConnections
          }
        });

        // Broadcast updated stats to all admins
        io.to('admin-room').emit('connectionStats', {
          totalConnections: connectedUsers.size,
          adminConnections,
          userConnections,
          timestamp: new Date().toISOString()
        });
      });

      // ✅ LEAVE ADMIN ROOM
      socket.on('leave-admin-room', () => {
        console.log(`👨‍💼 Admin leaving admin room: ${socket.id}`);
        socket.leave('admin-room');
        
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo && userInfo.role === 'admin') {
          userInfo.role = 'user';
          connectedUsers.set(socket.id, userInfo);
          
          // Update counters
          adminConnections--;
          userConnections++;
        }

        socket.emit('admin-room-left', {
          message: 'Left admin room'
        });
      });

      // ✅ HANDLE PING FOR CONNECTION HEALTH
      socket.on('ping', (callback) => {
        if (typeof callback === 'function') {
          callback('pong');
        }
      });

      // ✅ HANDLE CLIENT HEARTBEAT
      socket.on('heartbeat', () => {
        socket.emit('heartbeat-ack', { timestamp: new Date().toISOString() });
      });

      // ✅ DISCONNECT HANDLING
      socket.on("disconnect", (reason) => {
        console.log(`🔌 Socket disconnected: ${socket.id}, Reason: ${reason}`);
        
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          if (userInfo.role === 'admin') {
            adminConnections--;
          } else {
            userConnections--;
          }
          
          // Remove from connected users
          connectedUsers.delete(socket.id);
          
          // Broadcast updated connection stats to admins
          io.to('admin-room').emit('connectionStats', {
            totalConnections: connectedUsers.size,
            adminConnections,
            userConnections,
            timestamp: new Date().toISOString()
          });
        }
      });

      // ✅ ERROR HANDLING
      socket.on('error', (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
      });
    });

    // ✅ PERIODIC CONNECTION STATS BROADCAST (every 30 seconds)
    setInterval(() => {
      const stats = {
        totalConnections: connectedUsers.size,
        adminConnections,
        userConnections,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };
      
      io.to('admin-room').emit('connectionStats', stats);
    }, 30000);

    // Health check endpoint
    app.get("/health", (req: Request, res: Response) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        socketConnections: {
          total: connectedUsers.size,
          admin: adminConnections,
          user: userConnections
        },
        uptime: process.uptime()
      });
    });

    // Socket health endpoint
    app.get("/health/socket", (req: Request, res: Response) => {
      const connections = Array.from(connectedUsers.values()).map(user => ({
        socketId: user.socketId,
        role: user.role,
        userId: user.userId || null,
        connectedAt: user.connectedAt,
        connectedFor: Date.now() - user.connectedAt.getTime()
      }));

      res.json({
        success: true,
        stats: {
          totalConnections: connectedUsers.size,
          adminConnections,
          userConnections,
          serverUptime: process.uptime()
        },
        connections
      });
    });

    // API Routes
    app.use("/api/user", userAuthRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/password", passwordRoutes);
    app.use("/api/user", userPasswordRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/events", eventRoutes);
    app.use("/api/gallery", galleryRoutes);
    app.use('/api/bookings', bookingRoutes);

    // Log routes in development
    if (process.env.NODE_ENV === "development") {
      app._router.stack.forEach((r: any) => {
        if (r.route && r.route.path) {
          console.log(`📍 Route: ${Object.keys(r.route.methods)} ${r.route.path}`);
        }
      });
    }

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
🌐 Socket.io: Enabled with rooms support
⏰ Started at: ${new Date().toLocaleString()}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
      `);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
};

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, shutting down gracefully');
  server.close(async () => {
    try {
      // Close socket connections
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

startServer();
export default app;