// ✅ Socket.io TypeScript declarations

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string;
      CLIENT_URL: string;
      ADMIN_URL: string;
    }
  }
}

export interface SocketUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface BookingStatusUpdate {
  bookingId: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  serviceName: string;
  date: string;
  time: string;
  userId: string;
  timestamp: string;
}

export interface NewBookingData {
  bookingId: string;
  userName: string;
  userEmail: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'pending';
  timestamp: string;
}

export interface ConnectionStats {
  totalConnections: number;
  adminConnections: number;
  userConnections: number;
  timestamp: string;
}

// Extend Socket.io types
declare module 'socket.io' {
  interface Socket {
    data: {
      user: SocketUser;
    };
  }
}