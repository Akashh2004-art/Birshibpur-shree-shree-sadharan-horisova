import { io, Socket } from 'socket.io-client';

interface BookingSocketConnection {
  socket: Socket;
  bookingId: string;
  userId: string;
  endTime: Date;
  cleanup: () => void;
}

class BookingSocketService {
  private activeConnections: Map<string, BookingSocketConnection> = new Map();
  private serverUrl: string = '';
  private maxConcurrentConnections = 1000; // Support for large scale

  constructor() {
    this.serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.disconnectAll();
      });
    }
  }

  /**
   * 🔥 START BOOKING SOCKET CONNECTION
   * Only called when user submits a booking
   */
  async connectForBooking(bookingId: string, userId: string, bookingEndTime: Date): Promise<Socket> {
    // Check if already connected for this booking
    if (this.activeConnections.has(bookingId)) {
      console.log(`✅ Using existing connection for booking: ${bookingId}`);
      return this.activeConnections.get(bookingId)!.socket;
    }

    // Check max connections limit
    if (this.activeConnections.size >= this.maxConcurrentConnections) {
      throw new Error('🚫 Maximum concurrent connections reached. Please try again later.');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('❌ Authentication token required for booking connection');
    }

    console.log(`🔌 Creating booking socket connection for: ${bookingId}`);

    // Create new socket for this specific booking
    const socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      forceNew: true,
      auth: {
        token: token,
        bookingId: bookingId,
        userId: userId,
        connectionType: 'booking'
      }
    });

    // Setup connection handlers
    const connectionPromise = new Promise<Socket>((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('🚫 Booking socket connection timeout'));
      }, 15000);

      socket.on('connect', () => {
        clearTimeout(connectionTimeout);
        console.log(`✅ Booking socket connected: ${socket.id} for booking: ${bookingId}`);
        
        // Join booking-specific room
        socket.emit('join-booking-room', { bookingId, userId });
        resolve(socket);
      });

      socket.on('connect_error', (error) => {
        clearTimeout(connectionTimeout);
        console.error(`❌ Booking socket connection error for ${bookingId}:`, error);
        reject(error);
      });
    });

    try {
      const connectedSocket = await connectionPromise;
      
      // Setup booking-specific event handlers
      this.setupBookingEventHandlers(connectedSocket, bookingId, userId);
      
      // Create cleanup function
      const cleanup = () => this.disconnectBooking(bookingId);
      
      // Store connection info
      const connectionInfo: BookingSocketConnection = {
        socket: connectedSocket,
        bookingId,
        userId,
        endTime: bookingEndTime,
        cleanup
      };
      
      this.activeConnections.set(bookingId, connectionInfo);
      
      // Auto disconnect when booking ends
      this.scheduleAutoDisconnect(bookingId, bookingEndTime);
      
      console.log(`📊 Active booking connections: ${this.activeConnections.size}`);
      
      return connectedSocket;

    } catch (error) {
      console.error(`🚫 Failed to connect booking socket for ${bookingId}:`, error);
      socket.disconnect();
      throw error;
    }
  }

  /**
   * 🎯 SETUP BOOKING-SPECIFIC EVENT HANDLERS
   */
  private setupBookingEventHandlers(socket: Socket, bookingId: string, _userId: string): void {
    // Handle booking status updates
    socket.on('booking_status_update', (data) => {
      console.log(`📋 Booking status update for ${bookingId}:`, data);
      
      // If booking is rejected, disconnect immediately
      if (data.status === 'rejected') {
        console.log(`❌ Booking ${bookingId} rejected, disconnecting...`);
        this.disconnectBooking(bookingId);
      }
    });

    // Handle admin acceptance
    socket.on('booking_accepted', (data) => {
      console.log(`✅ Booking ${bookingId} accepted:`, data);
      // Keep connection alive for real-time updates
    });

    // Handle booking completion
    socket.on('booking_completed', (data) => {
      console.log(`🎉 Booking ${bookingId} completed:`, data);
      this.disconnectBooking(bookingId);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`❌ Booking socket disconnected for ${bookingId}:`, reason);
      this.activeConnections.delete(bookingId);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`🚫 Booking socket error for ${bookingId}:`, error);
    });

    // Room join confirmation
    socket.on('booking_room_joined', (data) => {
      console.log(`✅ Joined booking room for ${bookingId}:`, data);
    });
  }

  /**
   * ⏰ SCHEDULE AUTO DISCONNECT
   */
  private scheduleAutoDisconnect(bookingId: string, endTime: Date): void {
    const now = new Date();
    const timeUntilEnd = endTime.getTime() - now.getTime();
    
    if (timeUntilEnd > 0) {
      setTimeout(() => {
        console.log(`⏰ Auto-disconnecting booking ${bookingId} - time ended`);
        this.disconnectBooking(bookingId);
      }, timeUntilEnd);
    }
  }

  /**
   * 🔌 DISCONNECT SPECIFIC BOOKING
   */
  disconnectBooking(bookingId: string): void {
    const connection = this.activeConnections.get(bookingId);
    
    if (connection) {
      console.log(`🔌 Disconnecting booking socket: ${bookingId}`);
      
      // Leave booking room
      connection.socket.emit('leave-booking-room', { 
        bookingId: connection.bookingId, 
        userId: connection.userId 
      });
      
      // Remove all listeners
      connection.socket.removeAllListeners();
      
      // Disconnect socket
      connection.socket.disconnect();
      
      // Remove from active connections
      this.activeConnections.delete(bookingId);
      
      console.log(`✅ Booking ${bookingId} disconnected. Active connections: ${this.activeConnections.size}`);
    }
  }

  /**
   * 🧹 DISCONNECT ALL CONNECTIONS
   */
  disconnectAll(): void {
    console.log(`🧹 Disconnecting all booking sockets (${this.activeConnections.size})`);
    
    for (const [, connection] of this.activeConnections) {
      connection.cleanup();
    }
    
    this.activeConnections.clear();
    console.log('✅ All booking sockets disconnected');
  }

  /**
   * 📊 GET CONNECTION STATUS
   */
  getBookingConnection(bookingId: string): BookingSocketConnection | null {
    return this.activeConnections.get(bookingId) || null;
  }

  /**
   * 🔍 CHECK IF BOOKING IS CONNECTED
   */
  isBookingConnected(bookingId: string): boolean {
    const connection = this.activeConnections.get(bookingId);
    return connection?.socket.connected || false;
  }

  /**
   * 📈 GET ACTIVE CONNECTIONS INFO
   */
  getActiveConnectionsInfo() {
    const connections = Array.from(this.activeConnections.entries()).map(([bookingId, conn]) => ({
      bookingId,
      userId: conn.userId,
      connected: conn.socket.connected,
      socketId: conn.socket.id,
      endTime: conn.endTime
    }));

    return {
      totalActive: this.activeConnections.size,
      maxAllowed: this.maxConcurrentConnections,
      connections
    };
  }

  /**
   * 🎯 EMIT TO SPECIFIC BOOKING
   */
  emitToBooking(bookingId: string, event: string, data: any): boolean {
    const connection = this.activeConnections.get(bookingId);
    
    if (connection?.socket.connected) {
      connection.socket.emit(event, data);
      return true;
    }
    
    console.warn(`⚠️ Cannot emit to booking ${bookingId} - not connected`);
    return false;
  }

  /**
   * 👂 LISTEN TO BOOKING EVENTS
   */
  onBookingEvent(bookingId: string, event: string, callback: (data: any) => void): boolean {
    const connection = this.activeConnections.get(bookingId);
    
    if (connection?.socket) {
      connection.socket.on(event, callback);
      return true;
    }
    
    console.warn(`⚠️ Cannot listen to booking ${bookingId} events - not connected`);
    return false;
  }

  /**
   * 🚫 STOP LISTENING TO BOOKING EVENTS
   */
  offBookingEvent(bookingId: string, event: string): boolean {
    const connection = this.activeConnections.get(bookingId);
    
    if (connection?.socket) {
      connection.socket.off(event);
      return true;
    }
    
    return false;
  }
}

// 🎯 SINGLETON INSTANCE
const bookingSocketService = new BookingSocketService();

export default bookingSocketService;