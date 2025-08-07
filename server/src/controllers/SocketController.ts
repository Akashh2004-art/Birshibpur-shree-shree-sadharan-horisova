import { Server } from 'socket.io';
import Booking from '../models/bookingModel';

export class SocketController {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  // Emit booking status update to specific booking room
  emitBookingStatusUpdate(bookingId: string, statusData: {
    status: 'pending' | 'approved' | 'rejected';
    serviceName: string;
    date: string;
    time: string;
    rejectionReason?: string;
    message?: string;
    userId?: string;
  }) {
    console.log(`📡 Emitting booking status update for booking: ${bookingId}`);
    
    this.io.to(`booking:${bookingId}`).emit('bookingStatusUpdate', {
      bookingId,
      ...statusData,
      timestamp: new Date().toISOString()
    });
  }

  // Notify admins about new booking
  notifyAdminsNewBooking(bookingData: {
    bookingId: string;
    userName: string;
    userEmail: string;
    serviceName: string;
    date: string;
    time: string;
    message?: string;
  }) {
    console.log(`📢 Notifying admins about new booking: ${bookingData.bookingId}`);
    
    this.io.to('admin-room').emit('newBookingReceived', {
      ...bookingData,
      timestamp: new Date().toISOString()
    });
  }

  // Notify user about booking confirmation
  notifyUserBookingConfirmed(userId: string, bookingData: {
    bookingId: string;
    serviceName: string;
    date: string;
    time: string;
    message?: string;
  }) {
    console.log(`✅ Notifying user ${userId} about booking confirmation`);
    
    this.io.to(`user:${userId}`).emit('bookingConfirmed', {
      ...bookingData,
      timestamp: new Date().toISOString()
    });
  }

  // Notify user about booking rejection
  notifyUserBookingRejected(userId: string, bookingData: {
    bookingId: string;
    serviceName: string;
    rejectionReason?: string;
  }) {
    console.log(`❌ Notifying user ${userId} about booking rejection`);
    
    this.io.to(`user:${userId}`).emit('bookingRejected', {
      ...bookingData,
      timestamp: new Date().toISOString()
    });
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.io.sockets.sockets.size;
  }

  // Get connected admins count
  getConnectedAdminsCount(): number {
    const adminRoom = this.io.sockets.adapter.rooms.get('admin-room');
    return adminRoom ? adminRoom.size : 0;
  }

  // Broadcast system notification to all users
  broadcastSystemNotification(notification: {
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
  }) {
    console.log(`📡 Broadcasting system notification: ${notification.title}`);
    
    this.io.emit('systemNotification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // Send booking reminder to user (for scheduled reminders)
  sendBookingReminder(userId: string, bookingData: {
    bookingId: string;
    serviceName: string;
    date: string;
    time: string;
    reminderType: 'day_before' | 'hour_before' | '15_minutes_before';
  }) {
    console.log(`⏰ Sending booking reminder to user ${userId}: ${bookingData.reminderType}`);
    
    this.io.to(`user:${userId}`).emit('bookingReminder', {
      ...bookingData,
      timestamp: new Date().toISOString()
    });
  }

  // Handle booking auto-completion (after service time + 5 minutes)
  handleBookingAutoComplete(bookingId: string) {
    console.log(`✅ Auto-completing booking: ${bookingId}`);
    
    this.io.to(`booking:${bookingId}`).emit('bookingAutoComplete', {
      bookingId,
      message: 'আপনার পূজা সম্পন্ন হয়েছে। ধন্যবাদ!',
      timestamp: new Date().toISOString()
    });
  }

  // Get real-time booking statistics for admin dashboard
  async getRealtimeBookingStats() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      
      const stats = await Promise.all([
        Booking.countDocuments({ status: 'pending' }),
        Booking.countDocuments({ 
          createdAt: { $gte: startOfDay },
          status: 'pending'
        }),
        Booking.countDocuments({ status: 'approved' }),
        Booking.countDocuments({ status: 'rejected' })
      ]);

      return {
        pendingBookings: stats[0],
        todayPending: stats[1],
        totalApproved: stats[2],
        totalRejected: stats[3],
        connectedUsers: this.getConnectedUsersCount(),
        connectedAdmins: this.getConnectedAdminsCount(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting realtime booking stats:', error);
      throw error;
    }
  }

  // Emit realtime stats to admins
  async emitRealtimeStatsToAdmins() {
    try {
      const stats = await this.getRealtimeBookingStats();
      this.io.to('admin-room').emit('realtimeStats', stats);
    } catch (error) {
      console.error('❌ Error emitting realtime stats:', error);
    }
  }

  // Schedule periodic stats updates to admins (call this in app.ts)
  startPeriodicStatsUpdates(intervalMinutes: number = 5) {
    setInterval(() => {
      this.emitRealtimeStatsToAdmins();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`📊 Started periodic stats updates every ${intervalMinutes} minutes`);
  }
}