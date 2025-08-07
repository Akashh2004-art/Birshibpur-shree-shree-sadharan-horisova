import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

export interface SocketUser {
  id: string;
  email: string;
  role: string;
}

export const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware for socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      
      // Attach user info to socket
      socket.data.user = {
        id: decoded.id || decoded._id,
        email: decoded.email,
        role: decoded.role || 'user'
      };

      console.log(`✅ Socket authenticated: ${decoded.email} (${socket.id})`);
      next();
    } catch (error) {
      console.error('❌ Socket authentication failed:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    const user = socket.data.user as SocketUser;
    console.log(`🔌 User connected: ${user.email} (${socket.id})`);

    // Join user to their personal room for user-specific updates
    socket.join(`user:${user.id}`);
    
    // Join admins to admin room for admin-specific updates
    if (user.role === 'admin') {
      socket.join('admin-room');
      console.log(`👑 Admin joined admin-room: ${user.email}`);
    }

    // Handle joining specific booking room for real-time status updates
    socket.on('joinBookingRoom', (bookingId: string) => {
      socket.join(`booking:${bookingId}`);
      console.log(`📋 User joined booking room: booking:${bookingId} (${user.email})`);
    });

    // Handle leaving booking room
    socket.on('leaveBookingRoom', (bookingId: string) => {
      socket.leave(`booking:${bookingId}`);
      console.log(`📋 User left booking room: booking:${bookingId} (${user.email})`);
    });

    // Handle admin actions (approve/reject bookings)
    socket.on('updateBookingStatus', (data: {
      bookingId: string;
      status: 'approved' | 'rejected';
      rejectionReason?: string;
    }) => {
      // Only allow admins to update booking status
      if (user.role !== 'admin') {
        socket.emit('error', { message: 'Unauthorized action' });
        return;
      }

      console.log(`📝 Admin ${user.email} updating booking ${data.bookingId} to ${data.status}`);
      
      // Broadcast status update to the specific booking room
      io.to(`booking:${data.bookingId}`).emit('bookingStatusUpdate', {
        bookingId: data.bookingId,
        status: data.status,
        rejectionReason: data.rejectionReason,
        updatedBy: user.email,
        timestamp: new Date().toISOString()
      });
    });

    // Handle new booking notifications to admins
    socket.on('newBookingNotification', (bookingData: any) => {
      console.log(`📢 New booking notification: ${bookingData.bookingId}`);
      
      // Notify all connected admins
      io.to('admin-room').emit('newBookingReceived', {
        ...bookingData,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${user.email} (${socket.id}) - ${reason}`);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`🚫 Socket error for ${user.email}:`, error);
    });
  });

  // Global error handler
  io.engine.on("connection_error", (err) => {
    console.error('🚫 Socket.io connection error:', err.req);
    console.error('🚫 Error code:', err.code);
    console.error('🚫 Error message:', err.message);
    console.error('🚫 Error context:', err.context);
  });

  console.log('🚀 Socket.io server initialized');
  return io;
};