// socket.config.ts - Minimal Version for Notifications Only
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

let ioInstance: Server | undefined;

export const setIO = (io: Server): void => {
  ioInstance = io;
};

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return ioInstance;
};

// Track authenticated admin sockets
const authenticatedSockets = new Map<string, any>(); // socketId -> user data

export const initializeSocket = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || "http://localhost:5100",
        process.env.ADMIN_URL || "http://localhost:5173"
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New socket connection: ${socket.id}`);

    // Admin room management with token verification
    socket.on('join-admin-room', async (data?: { token?: string }) => {
      try {
        const token = data?.token;
        
        if (!token) {
          socket.emit('auth-error', { message: 'Token required for admin access' });
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'akashsaha0751') as any;
        
        const userId = decoded.userId || decoded.id || decoded._id;
        const email = decoded.email || decoded.identifier;
        
        if (!userId || !email) {
          socket.emit('auth-error', { message: 'Invalid token payload' });
          return;
        }

        const userData = {
          id: userId,
          email: email,
          role: 'admin'
        };

        authenticatedSockets.set(socket.id, userData);
        socket.join('admin-room');
        
        console.log(`👨‍💼 Admin ${email} joined admin room`);
        socket.emit('admin-room-joined', { message: 'Successfully joined admin room' });

      } catch (error: any) {
        console.error('❌ Admin room join failed:', error?.message);
        socket.emit('auth-error', { message: 'Authentication failed' });
      }
    });

    socket.on('leave-admin-room', () => {
      socket.leave('admin-room');
      const userData = authenticatedSockets.get(socket.id);
      console.log(`👨‍💼 Admin ${userData?.email || 'unknown'} left admin room`);
    });

    socket.on('disconnect', (reason) => {
      const userData = authenticatedSockets.get(socket.id);
      console.log(`🔌 Socket disconnected: ${socket.id} (${userData?.email || 'guest'}) - ${reason}`);
      authenticatedSockets.delete(socket.id);
    });
  });

  console.log('🚀 Socket.io server initialized for notifications');
  setIO(io);
  return io;
};

// Utility function for sending notifications to admins
export const emitToAdminRoom = (event: string, data: any): void => {
  const io = getIO();
  console.log(`📤 Emitting ${event} to admin room`, data);
  io.to('admin-room').emit(event, data);
};