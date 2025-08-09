import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private serverUrl: string = '';

  connect(userId?: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    // ✅ FIXED: Proper URL handling for socket connection
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                     (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    this.serverUrl = socketUrl;
    const token = localStorage.getItem('token');
    
    console.log('🔌 Connecting to socket server:', this.serverUrl);
    console.log('🔑 Using token:', token ? 'Present' : 'Missing');
    
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      auth: {
        token: token // ✅ Pass token in auth
      }
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      console.log('🌐 Connected to server:', this.serverUrl);
      
      // Join user-specific room if userId is provided
      if (userId) {
        this.userId = userId;
        this.joinUserRoom(userId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      console.error('🔗 Attempted connection to:', this.serverUrl);
    });

    // ✅ NEW: Listen for authentication errors
    this.socket.on('error', (error) => {
      console.error('🚫 Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // User-specific methods
  onBookingStatusUpdate(callback: (data: any) => void) {
    this.socket?.on('bookingStatusUpdate', callback);
  }

  offBookingStatusUpdate() {
    this.socket?.off('bookingStatusUpdate');
  }

  // ✅ FIXED: Match server event names exactly
  joinUserRoom(userId: string) {
    this.userId = userId;
    this.socket?.emit('join-user-room', userId); // Matches server listener
    console.log('👤 Joining user room:', userId);
  }

  // Leave user room
  leaveUserRoom() {
    if (this.userId) {
      this.socket?.emit('leave-user-room', this.userId);
      this.userId = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  // ✅ FIXED: Debug method with proper property access
  getConnectionInfo() {
    return {
      connected: this.isConnected(),
      socketId: this.socket?.id,
      userId: this.userId,
      serverUrl: this.serverUrl // Use stored serverUrl instead of private uri
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;