import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import type { SocketUser, ConnectionStats, BookingStatusUpdate, NewBookingData } from '../types/socket';

// ✅ Export IO instance for use in controllers
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

export const initializeSocket = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || "http://localhost:5173",
        process.env.ADMIN_URL || "http://localhost:5100"
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // ✅ FIXED: Authentication middleware for socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      
      if (!token) {
        console.error('❌ No token provided in socket handshake');
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      
      // Validate decoded token
      if (!decoded || (!decoded.id && !decoded._id) || !decoded.email) {
        return next(new Error('Invalid token payload'));
      }
      
      // Attach user info to socket
      socket.data.user = {
        id: decoded.id || decoded._id,
        email: decoded.email,
        role: decoded.role || 'user'
      };

      console.log(`✅ Socket authenticated: ${decoded.email} (Role: ${decoded.role}) (Socket: ${socket.id})`);
      next();
    } catch (error) {
      console.error('❌ Socket authentication failed:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  // ✅ Connection stats tracking
  const connectionStats: ConnectionStats = {
    totalConnections: 0,
    adminConnections: 0,
    userConnections: 0,
    timestamp: new Date().toISOString()
  };

  const updateConnectionStats = (): void => {
    const adminSockets = io.sockets.adapter.rooms.get('admin-room');
    connectionStats.totalConnections = io.sockets.sockets.size;
    connectionStats.adminConnections = adminSockets?.size || 0;
    connectionStats.userConnections = connectionStats.totalConnections - connectionStats.adminConnections;
    connectionStats.timestamp = new Date().toISOString();
    
    // Broadcast stats to all admins
    io.to('admin-room').emit('connectionStats', connectionStats);
  };

  // Handle socket connections
  io.on('connection', (socket) => {
    const user = socket.data?.user as SocketUser;
    
    if (!user) {
      console.error('❌ No user data found in socket');
      socket.disconnect();
      return;
    }

    console.log(`🔌 User connected: ${user.email} (Role: ${user.role}) (Socket: ${socket.id})`);

    // Join user to their personal room for user-specific updates
    socket.join(`user:${user.id}`);
    console.log(`👤 User joined room: user:${user.id}`);
    
    // Join admins to admin room for admin-specific updates
    if (user.role === 'admin') {
      socket.join('admin-room');
      console.log(`👑 Admin joined admin-room: ${user.email}`);
      
      // Send connection stats to newly connected admin
      socket.emit('admin-room-joined', {
        message: 'Successfully joined admin room',
        connectionStats: {
          ...connectionStats,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Update connection stats
    updateConnectionStats();

    // ✅ FIXED: Handle user room joining
    socket.on('join-user-room', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`👤 User manually joined room: user:${userId}`);
        socket.emit('user-room-joined', { 
          userId, 
          message: 'Successfully joined user room' 
        });
      }
    });

    // ✅ FIXED: Handle admin room joining
    socket.on('join-admin-room', () => {
      if (user.role === 'admin') {
        socket.join('admin-room');
        console.log(`👑 Admin manually joined admin-room: ${user.email}`);
        socket.emit('admin-room-joined', {
          message: 'Successfully joined admin room',
          connectionStats: {
            ...connectionStats,
            timestamp: new Date().toISOString()
          }
        });
        updateConnectionStats();
      }
    });

    // Handle leaving user room
    socket.on('leave-user-room', (userId: string) => {
      if (userId) {
        socket.leave(`user:${userId}`);
        console.log(`👤 User left room: user:${userId}`);
      }
    });

    // Handle leaving admin room
    socket.on('leave-admin-room', () => {
      socket.leave('admin-room');
      console.log(`👑 Admin left admin-room: ${user.email}`);
      updateConnectionStats();
    });

    // Handle joining specific booking room for real-time status updates
    socket.on('joinBookingRoom', (bookingId: string) => {
      if (bookingId) {
        socket.join(`booking:${bookingId}`);
        console.log(`📋 User joined booking room: booking:${bookingId} (${user.email})`);
      }
    });

    // Handle leaving booking room
    socket.on('leaveBookingRoom', (bookingId: string) => {
      if (bookingId) {
        socket.leave(`booking:${bookingId}`);
        console.log(`📋 User left booking room: booking:${bookingId} (${user.email})`);
      }
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

      if (!data.bookingId || !data.status) {
        socket.emit('error', { message: 'Invalid booking update data' });
        return;
      }

      console.log(`📝 Admin ${user.email} updating booking ${data.bookingId} to ${data.status}`);
      
      // Broadcast status update to the specific booking room AND user room
      const updateData: BookingStatusUpdate = {
        bookingId: data.bookingId,
        status: data.status,
        rejectionReason: data.rejectionReason,
        serviceName: '', // Will be filled by controller
        date: '', // Will be filled by controller
        time: '', // Will be filled by controller
        userId: '', // Will be filled by controller
        timestamp: new Date().toISOString()
      };

      // Emit to booking room
      io.to(`booking:${data.bookingId}`).emit('bookingStatusUpdate', updateData);
      
      // ✅ NEW: Also emit to all connected users for this booking
      io.emit('bookingStatusUpdate', updateData);
      
      console.log(`📤 Status update broadcasted for booking: ${data.bookingId}`);
    });

    // Handle new booking notifications to admins
    socket.on('newBookingNotification', (bookingData: Partial<NewBookingData>) => {
      if (!bookingData.bookingId) {
        socket.emit('error', { message: 'Invalid booking notification data' });
        return;
      }

      console.log(`📢 New booking notification: ${bookingData.bookingId}`);
      
      // Notify all connected admins
      io.to('admin-room').emit('newBooking', {
        ...bookingData,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${user.email} (${socket.id}) - ${reason}`);
      // Update connection stats with delay to ensure cleanup
      setTimeout(updateConnectionStats, 100);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`🚫 Socket error for ${user.email}:`, error);
    });
  });

  // Global error handler
  io.engine.on("connection_error", (err: any) => {
    console.error('🚫 Socket.io connection error:', err.req || err);
    console.error('🚫 Error code:', err.code);
    console.error('🚫 Error message:', err.message);
    console.error('🚫 Error context:', err.context);
  });

  console.log('🚀 Socket.io server initialized');
  
  // ✅ Set the IO instance for use in controllers
  setIO(io);
  
  return io;
};