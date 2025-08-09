import { io, Socket } from 'socket.io-client';

class AdminSocketService {
  private socket: Socket | null = null;
  private isAdminConnected = false;

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token'); // ✅ Get admin auth token
    
    console.log('🔌 Admin connecting to socket server:', serverUrl);
    console.log('🔑 Using admin token:', token ? 'Present' : 'Missing');
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      auth: {
        token: token // ✅ FIXED: Pass token in auth
      }
    });

    this.socket.on('connect', () => {
      console.log('✅ Admin socket connected:', this.socket?.id);
      this.joinAdminRoom();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Admin socket disconnected:', reason);
      this.isAdminConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Admin socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      if (this.isAdminConnected) {
        this.socket.emit('leave-admin-room');
      }
      this.socket.disconnect();
      this.socket = null;
      this.isAdminConnected = false;
    }
  }

  joinAdminRoom() {
    if (this.socket) {
      this.socket.emit('join-admin-room');
      this.isAdminConnected = true;
      console.log('👨‍💼 Joined admin room');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Admin-specific event listeners
  onNewBooking(callback: (data: any) => void) {
    this.socket?.on('newBooking', callback);
  }

  onBookingStatusUpdate(callback: (data: any) => void) {
    this.socket?.on('bookingStatusUpdate', callback);
  }

  onBookingDeleted(callback: (data: any) => void) {
    this.socket?.on('bookingDeleted', callback);
  }

  onConnectionStats(callback: (data: any) => void) {
    this.socket?.on('connectionStats', callback);
  }

  // Remove event listeners
  offNewBooking() {
    this.socket?.off('newBooking');
  }

  offBookingStatusUpdate() {
    this.socket?.off('bookingStatusUpdate');
  }

  offBookingDeleted() {
    this.socket?.off('bookingDeleted');
  }

  offConnectionStats() {
    this.socket?.off('connectionStats');
  }

  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const adminSocketService = new AdminSocketService();

export default adminSocketService;