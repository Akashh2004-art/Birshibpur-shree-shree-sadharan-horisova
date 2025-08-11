// socket.config.ts
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

const userConnections = new Map<string, string>(); // userId -> socketId
const socketUsers = new Map<string, string>(); // socketId -> userId

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
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    allowEIO3: true
  });

// ✅ ENHANCED DEBUG AUTHENTICATION MIDDLEWARE
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      console.error('❌ No token provided in socket handshake');
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'akashsaha0751') as any;
    
    // ✅ FLEXIBLE USER ID & EMAIL DETECTION
    const userId = decoded.userId || decoded.id || decoded._id || decoded.user_id || decoded.sub;
    const email = decoded.email || decoded.identifier || decoded.userEmail || decoded.emailAddress;
    
    if (!userId || !email) {
      console.error('❌ Invalid token payload - missing userId or email');
      return next(new Error('Invalid token payload'));
    }
    
    socket.data.user = {
      id: userId,
      email: email,
      role: decoded.role || 'user'
    };

    console.log(`✅ Socket authenticated: ${email} (${socket.id})`);
    next();
    
  } catch (error: any) {
    console.error('❌ Socket authentication failed:', error?.message || error);
    next(new Error('Invalid authentication token'));
  }
});

  // ✅ CONNECTION HANDLER
  io.on('connection', (socket) => {
    const user = socket.data?.user;
    if (!user) {
      console.error('❌ No user data found in socket');
      socket.disconnect();
      return;
    }

    console.log(`🔌 New socket connection: ${socket.id} (${user.email})`);

    // ✅ JOIN USER ROOM
    socket.on('join-user-room', (userId: string) => {
      if (!userId) return;
      const existingSocketId = userConnections.get(userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        const existingSocket = io.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          console.log(`🔄 Disconnecting previous connection for user ${userId}`);
          existingSocket.emit('duplicate-connection', 'New connection established');
          existingSocket.disconnect(true);
        }
      }
      const roomName = `user-${userId}`;
      socket.join(roomName);
      userConnections.set(userId, socket.id);
      socketUsers.set(socket.id, userId);
      console.log(`👤 User ${userId} joining room: ${roomName}`);
      socket.emit('user-room-joined', { userId, room: roomName, message: 'Successfully joined user room' });
    });

    // ✅ LEAVE USER ROOM
    socket.on('leave-user-room', (userId: string) => {
      if (!userId) return;
      const roomName = `user-${userId}`;
      socket.leave(roomName);
      userConnections.delete(userId);
      socketUsers.delete(socket.id);
      console.log(`👤 User ${userId} left room: ${roomName}`);
      socket.emit('user-room-left', { userId, room: roomName, message: 'Left user room' });
    });

    // ✅ ADMIN ROOM
    socket.on('join-admin-room', () => {
      if (user.role !== 'admin') {
        socket.emit('error', 'Unauthorized: Admin access required');
        return;
      }
      socket.join('admin-room');
      console.log(`👨‍💼 Admin ${user.email} joined admin room`);
      socket.emit('admin-room-joined', {
        message: 'Successfully joined admin room',
        connectionStats: {
          totalConnections: io.sockets.sockets.size,
          adminConnections: io.sockets.adapter.rooms.get('admin-room')?.size || 0,
          userConnections: userConnections.size,
          timestamp: new Date().toISOString()
        }
      });
    });

    socket.on('leave-admin-room', () => {
      socket.leave('admin-room');
      console.log(`👨‍💼 Admin ${user.email} left admin room`);
      socket.emit('admin-room-left', { message: 'Left admin room' });
    });

    // ✅ BOOKING ROOMS
    socket.on('joinBookingRoom', (bookingId: string) => {
      if (!bookingId) return;
      const roomName = `booking-${bookingId}`;
      socket.join(roomName);
      console.log(`📋 User joined booking room: ${roomName}`);
      socket.emit('booking-room-joined', { bookingId, room: roomName, message: 'Successfully joined booking room' });
    });

    socket.on('leaveBookingRoom', (bookingId: string) => {
      if (!bookingId) return;
      socket.leave(`booking-${bookingId}`);
      console.log(`📋 User left booking room: booking-${bookingId}`);
    });

    // ✅ BOOKING STATUS UPDATES
    socket.on('updateBookingStatus', (data: { bookingId: string; status: 'approved' | 'rejected'; rejectionReason?: string; }) => {
      if (user.role !== 'admin') {
        socket.emit('error', { message: 'Unauthorized action' });
        return;
      }
      if (!data.bookingId || !data.status) {
        socket.emit('error', { message: 'Invalid booking update data' });
        return;
      }
      console.log(`📝 Admin ${user.email} updating booking ${data.bookingId} to ${data.status}`);
      const updateData = { ...data, timestamp: new Date().toISOString() };
      io.to(`booking-${data.bookingId}`).emit('bookingStatusUpdate', updateData);
    });

    // ✅ NEW BOOKING NOTIFICATIONS
    socket.on('newBookingNotification', (bookingData: any) => {
      if (!bookingData.bookingId) {
        socket.emit('error', { message: 'Invalid booking notification data' });
        return;
      }
      console.log(`📢 New booking notification: ${bookingData.bookingId}`);
      io.to('admin-room').emit('newBooking', { ...bookingData, timestamp: new Date().toISOString() });
    });

    // ✅ HEARTBEAT
    socket.on('ping', (callback) => {
      if (typeof callback === 'function') callback('pong');
    });

    // ✅ DISCONNECT
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${user.email}) - ${reason}`);
      const userId = socketUsers.get(socket.id);
      if (userId) {
        userConnections.delete(userId);
        socketUsers.delete(socket.id);
      }
      setTimeout(() => {
        io.to('admin-room').emit('connectionStats', {
          totalConnections: io.sockets.sockets.size,
          adminConnections: io.sockets.adapter.rooms.get('admin-room')?.size || 0,
          userConnections: userConnections.size,
          timestamp: new Date().toISOString()
        });
      }, 100);
    });

    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${user.email}:`, error);
    });
  });

  // ✅ GLOBAL ERROR HANDLER
  io.engine.on("connection_error", (err: any) => {
    console.error('🚫 Socket.io connection error:', { code: err.code, message: err.message, context: err.context });
  });

  // ✅ PERIODIC CLEANUP
  setInterval(() => {
    const currentConnections = io.sockets.sockets.size;
    const trackedConnections = userConnections.size;
    if (trackedConnections > currentConnections) {
      console.log('🧹 Cleaning up stale connection tracking...');
      for (const [userId, socketId] of userConnections.entries()) {
        if (!io.sockets.sockets.has(socketId)) {
          userConnections.delete(userId);
          socketUsers.delete(socketId);
        }
      }
    }
    console.log(`📊 Connection stats: Total: ${currentConnections}, Tracked: ${userConnections.size}`);
  }, 5 * 60 * 1000);

  console.log('🚀 Socket.io server initialized with enhanced room management');
  setIO(io);
  return io;
};
