import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private serverUrl: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId?: string): Socket {
    // ✅ PREVENT MULTIPLE CONNECTIONS
    if (this.socket?.connected && this.userId === userId) {
      console.log('✅ Using existing socket connection for user:', userId);
      return this.socket;
    }

    // ✅ DISCONNECT PREVIOUS CONNECTION
    if (this.socket) {
      console.log('🔄 Disconnecting previous socket connection');
      this.disconnect();
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ No token found, cannot connect socket');
      throw new Error('Authentication token required');
    }

    this.serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    console.log('🔌 Connecting to socket server:', this.serverUrl);
    
    // ✅ CREATE NEW CONNECTION WITH PROPER CONFIG
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      forceNew: true, // Force new connection
      auth: {
        token: token
      }
    });

    // ✅ CONNECTION EVENT HANDLERS
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      
      if (userId) {
        this.userId = userId;
        this.joinUserRoom(userId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      
      // Don't auto-reconnect on manual disconnect
      if (reason === 'io client disconnect') {
        console.log('🚫 Manual disconnect, not reconnecting');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('🚫 Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('🚫 Socket error:', error);
    });

    // ✅ ROOM JOIN CONFIRMATIONS
    this.socket.on('user-room-joined', (data) => {
      console.log('✅ Successfully joined user room:', data);
    });

    this.socket.on('user-room-left', (data) => {
      console.log('✅ Successfully left user room:', data);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      
      // ✅ CLEAN DISCONNECT
      if (this.userId) {
        this.leaveUserRoom();
      }
      
      // Remove all listeners to prevent memory leaks
      this.socket.removeAllListeners();
      
      // Disconnect
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.reconnectAttempts = 0;
      
      console.log('✅ Socket disconnected and cleaned up');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // ✅ USER ROOM MANAGEMENT
  joinUserRoom(userId: string): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected, cannot join user room');
      return;
    }

    this.userId = userId;
    console.log('👤 Joining user room for:', userId);
    this.socket.emit('join-user-room', userId);
  }

  leaveUserRoom(): void {
    if (!this.socket?.connected || !this.userId) {
      return;
    }

    console.log('👤 Leaving user room for:', this.userId);
    this.socket.emit('leave-user-room', this.userId);
  }

  // ✅ BOOKING STATUS UPDATES
  onBookingStatusUpdate(callback: (data: any) => void): void {
    if (!this.socket) {
      console.warn('⚠️ Socket not connected, cannot listen for booking updates');
      return;
    }

    this.socket.on('bookingStatusUpdate', callback);
    console.log('📋 Listening for booking status updates');
  }

  offBookingStatusUpdate(): void {
    if (this.socket) {
      this.socket.off('bookingStatusUpdate');
      console.log('📋 Stopped listening for booking status updates');
    }
  }

  // ✅ CONNECTION INFO
  getConnectionInfo() {
    return {
      connected: this.isConnected(),
      socketId: this.socket?.id || null,
      userId: this.userId,
      serverUrl: this.serverUrl,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // ✅ HEARTBEAT FOR CONNECTION HEALTH
  ping(callback?: () => void): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected, cannot ping');
      return;
    }

    this.socket.emit('ping', (response: string) => {
      console.log('🏓 Socket ping response:', response);
      if (callback) callback();
    });
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// ✅ SINGLETON INSTANCE
const socketService = new SocketService();

// ✅ CLEANUP ON PAGE UNLOAD
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    socketService.disconnect();
  });
}

export default socketService;