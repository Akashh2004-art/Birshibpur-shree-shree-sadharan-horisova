// socket.config.ts - Clean & Booking-Focused Version
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

// Track booking connections (bookingId -> Set of socketIds)
const bookingConnections = new Map<string, Set<string>>();
const socketBookings = new Map<string, string>(); // socketId -> bookingId

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

  // ✅ AUTHENTICATION MIDDLEWARE
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      
      if (!token) {
        console.error('❌ No token provided in socket handshake');
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'akashsaha0751') as any;
      
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

    // ✅ JOIN BOOKING ROOM (Updated event name to match client)
    socket.on('join-booking-room', (data: { bookingId: string; userId: string }) => {
      if (!data.bookingId || !data.userId) {
        socket.emit('error', { message: 'Invalid booking room data' });
        return;
      }

      const roomName = `booking-${data.bookingId}`;
      socket.join(roomName);

      // Track booking connections
      if (!bookingConnections.has(data.bookingId)) {
        bookingConnections.set(data.bookingId, new Set());
      }
      bookingConnections.get(data.bookingId)!.add(socket.id);
      socketBookings.set(socket.id, data.bookingId);

      console.log(`📋 User ${data.userId} joined booking room: ${roomName}`);
      socket.emit('booking_room_joined', { 
        bookingId: data.bookingId, 
        room: roomName, 
        message: 'Successfully joined booking room' 
      });
    });

    // ✅ LEAVE BOOKING ROOM (Updated event name to match client)
    socket.on('leave-booking-room', (data: { bookingId: string; userId: string }) => {
      if (!data.bookingId) return;
      
      const roomName = `booking-${data.bookingId}`;
      socket.leave(roomName);

      // Update tracking
      const connections = bookingConnections.get(data.bookingId);
      if (connections) {
        connections.delete(socket.id);
        if (connections.size === 0) {
          bookingConnections.delete(data.bookingId);
        }
      }
      socketBookings.delete(socket.id);

      console.log(`📋 User ${data.userId} left booking room: ${roomName}`);
    });

    // ✅ ADMIN ROOM MANAGEMENT
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
          activeBookings: bookingConnections.size,
          timestamp: new Date().toISOString()
        }
      });
    });

    socket.on('leave-admin-room', () => {
      socket.leave('admin-room');
      console.log(`👨‍💼 Admin ${user.email} left admin room`);
      socket.emit('admin-room-left', { message: 'Left admin room' });
    });

    // ✅ HEARTBEAT
    socket.on('ping', (callback) => {
      if (typeof callback === 'function') callback('pong');
    });

    // ✅ DISCONNECT HANDLER
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${user.email}) - ${reason}`);
      
      // Clean up booking tracking
      const bookingId = socketBookings.get(socket.id);
      if (bookingId) {
        const connections = bookingConnections.get(bookingId);
        if (connections) {
          connections.delete(socket.id);
          if (connections.size === 0) {
            bookingConnections.delete(bookingId);
            console.log(`📋 Booking room ${bookingId} is now empty`);
          }
        }
        socketBookings.delete(socket.id);
      }

      // Update admin stats
      setTimeout(() => {
        io.to('admin-room').emit('connectionStats', {
          totalConnections: io.sockets.sockets.size,
          adminConnections: io.sockets.adapter.rooms.get('admin-room')?.size || 0,
          activeBookings: bookingConnections.size,
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
    console.error('🚫 Socket.io connection error:', { 
      code: err.code, 
      message: err.message, 
      context: err.context 
    });
  });

  // ✅ PERIODIC CLEANUP
  setInterval(() => {
    const currentConnections = io.sockets.sockets.size;
    const trackedBookings = bookingConnections.size;
    
    // Clean up stale booking connections
    for (const [bookingId, socketIds] of bookingConnections.entries()) {
      const validSocketIds = new Set<string>();
      for (const socketId of socketIds) {
        if (io.sockets.sockets.has(socketId)) {
          validSocketIds.add(socketId);
        }
      }
      
      if (validSocketIds.size === 0) {
        bookingConnections.delete(bookingId);
        console.log(`🧹 Cleaned up empty booking room: ${bookingId}`);
      } else if (validSocketIds.size !== socketIds.size) {
        bookingConnections.set(bookingId, validSocketIds);
      }
    }

    console.log(`📊 Connection stats: Total: ${currentConnections}, Active Bookings: ${bookingConnections.size}`);
  }, 5 * 60 * 1000); // Every 5 minutes

  console.log('🚀 Socket.io server initialized with booking-focused architecture');
  setIO(io);
  return io;
};

// ✅ UTILITY FUNCTIONS FOR BOOKING CONTROLLER
export const emitToBookingRoom = (bookingId: string, event: string, data: any): void => {
  const io = getIO();
  const roomName = `booking-${bookingId}`;
  
  console.log(`📤 Emitting ${event} to booking room: ${roomName}`, data);
  io.to(roomName).emit(event, data);
};

export const emitToAdminRoom = (event: string, data: any): void => {
  const io = getIO();
  
  console.log(`📤 Emitting ${event} to admin room`, data);
  io.to('admin-room').emit(event, data);
};

export const getBookingRoomStats = (bookingId: string) => {
  const io = getIO();
  const roomName = `booking-${bookingId}`;
  const room = io.sockets.adapter.rooms.get(roomName);
  
  return {
    bookingId,
    roomName,
    connectedSockets: room?.size || 0,
    socketIds: room ? Array.from(room) : []
  };
};