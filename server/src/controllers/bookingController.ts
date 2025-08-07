import { Request, Response } from 'express';
import Booking, { IBooking } from '../models/bookingModel';
import Admin from '../models/adminModel';
import { sendEmail } from '../utils/emailService';
import { io } from '../app'; // Import io instance directly

// Socket controller interface (if you have one)
interface ISocketController {
  notifyAdminsNewBooking: (data: any) => void;
  emitBookingStatusUpdate: (bookingId: string, data: any) => void;
  notifyUserBookingConfirmed: (userId: string, data: any) => void;
  notifyUserBookingRejected: (userId: string, data: any) => void;
  emitRealtimeStatsToAdmins: () => void;
  getConnectedUsersCount: () => number;
  getConnectedAdminsCount: () => number;
  io: any;
}

// Mock socket controller if not available
const getSocketController = (): ISocketController | null => {
  // Return null if no socket controller is available
  // You can implement your actual socket controller logic here
  return null;
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      serviceId,
      date,
      time,
      message
    } = req.body;

    const userId = (req as any).user?.id || (req as any).user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Validate date is not in the past
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate <= today) {
      return res.status(400).json({
        success: false,
        message: 'আজকের তারিখ বা আগের তারিখ নির্বাচন করা যাবে না'
      });
    }

    // Map service names
    const serviceNames: { [key: number]: string } = {
      1: 'নিত্য পূজা',
      2: 'বিশেষ অর্চনা', 
      3: 'সত্যনারায়ণ পূজা'
    };

    const serviceName = serviceNames[serviceId];

    if (!serviceName) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service selected'
      });
    }

    // Check for duplicate bookings (same user, same service, same date and time)
    const existingBooking = await Booking.findOne({
      userId,
      serviceId,
      date: bookingDate,
      time,
      status: { $ne: 'rejected' }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'এই সময়ে আপনার ইতিমধ্যে একটি বুকিং রয়েছে'
      });
    }

    // Create new booking
    const newBooking = new Booking({
      userId,
      userName: name,
      userEmail: email,
      userPhone: phone,
      serviceId,
      serviceName,
      date: bookingDate,
      time,
      message: message || '',
      status: 'pending'
    });

    await newBooking.save();

    // Real-time notification to admins via Socket.io
    const socketController = getSocketController();
    if (socketController) {
      socketController.notifyAdminsNewBooking({
        bookingId: newBooking._id.toString(),
        userName: name,
        userEmail: email,
        serviceName,
        date: bookingDate.toISOString(),
        time,
        message: message || ''
      });
    }

    // Direct socket.io notification if socketController is not available
    if (io) {
      io.to('admin-room').emit('newBooking', {
        bookingId: newBooking._id.toString(),
        userName: name,
        userEmail: email,
        serviceName,
        date: bookingDate.toISOString(),
        time,
        message: message || ''
      });
    }

    // Send email notifications to admins
    try {
      const admins = await Admin.find({}, 'email').lean();
      const adminEmails = admins.map(admin => admin.email).filter(email => email);
      
      if (adminEmails.length === 0) {
        const fallbackEmail = process.env.ADMIN_EMAIL || 'admin@temple.com';
        adminEmails.push(fallbackEmail);
        console.warn('No admin emails found in database, using fallback email:', fallbackEmail);
      }

      const emailSubject = 'নতুন পূজা বুকিং - ' + serviceName;
      const emailBody = `
        নতুন পূজা বুকিং এসেছে:
        
        বুকিং আইডি: ${newBooking._id}
        গ্রাহকের নাম: ${name}
        ইমেইল: ${email}
        ফোন: ${phone}
        পূজার নাম: ${serviceName}
        তারিখ: ${bookingDate.toLocaleDateString('bn-BD')}
        সময়: ${time}
        
        ${message ? `বিশেষ নির্দেশনা: ${message}` : ''}
        
        অনুগ্রহ করে অ্যাডমিন প্যানেল থেকে এই বুকিংটি অনুমোদন বা বাতিল করুন।
      `;

      const emailPromises = adminEmails.map(adminEmail => 
        sendEmail(adminEmail, emailSubject, emailBody)
          .catch(error => {
            console.error(`Failed to send email to ${adminEmail}:`, error);
            return null;
          })
      );

      const emailResults = await Promise.allSettled(emailPromises);
      const successCount = emailResults.filter(result => result.status === 'fulfilled' && result.value !== null).length;
      const failCount = emailResults.length - successCount;
      
      console.log(`Email notification sent to ${successCount}/${emailResults.length} admins`);
      if (failCount > 0) {
        console.warn(`Failed to send ${failCount} admin notification emails`);
      }

    } catch (emailError) {
      console.error('Error fetching admin emails or sending notifications:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'বুকিং সফলভাবে সম্পন্ন হয়েছে',
      data: {
        bookingId: newBooking._id,
        serviceName,
        date: bookingDate,
        time,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'বুকিং করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।'
    });
  }
};

export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    const { page = 1, limit = 10 } = req.query;

    const bookings = await Booking.find({ userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Booking.countDocuments({ userId });

    // Get booking stats for the user
    const stats = await Booking.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: bookings,
      stats,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'বুকিং তথ্য আনতে সমস্যা হয়েছে'
    });
  }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Store previous status for comparison
    const previousStatus = booking.status;

    // Update booking status
    booking.status = status;
    if (status === 'rejected' && rejectionReason) {
      booking.rejectionReason = rejectionReason;
    }

    await booking.save();

    // Real-time status update via Socket.io
    const socketController = getSocketController();
    if (socketController) {
      socketController.emitBookingStatusUpdate(booking._id.toString(), {
        status: booking.status,
        serviceName: booking.serviceName,
        date: booking.date.toISOString(),
        time: booking.time,
        rejectionReason: booking.rejectionReason,
        message: booking.message,
        userId: booking.userId.toString()
      });

      // Send specific notifications to user
      if (status === 'approved') {
        socketController.notifyUserBookingConfirmed(booking.userId.toString(), {
          bookingId: booking._id.toString(),
          serviceName: booking.serviceName,
          date: booking.date.toISOString(),
          time: booking.time,
          message: booking.message
        });
      } else if (status === 'rejected') {
        socketController.notifyUserBookingRejected(booking.userId.toString(), {
          bookingId: booking._id.toString(),
          serviceName: booking.serviceName,
          rejectionReason: booking.rejectionReason
        });
      }

      // Update realtime stats for admins
      socketController.emitRealtimeStatsToAdmins();
    }

    // Direct socket.io emissions if socketController is not available
    if (io) {
      io.to('admin-room').emit('bookingStatusUpdate', {
        bookingId: booking._id.toString(),
        status: booking.status,
        serviceName: booking.serviceName,
        date: booking.date.toISOString(),
        time: booking.time,
        rejectionReason: booking.rejectionReason
      });

      // Emit to specific user
      io.to(`user-${booking.userId}`).emit('bookingStatusUpdate', {
        bookingId: booking._id.toString(),
        status: booking.status,
        serviceName: booking.serviceName,
        date: booking.date.toISOString(),
        time: booking.time,
        rejectionReason: booking.rejectionReason
      });
    }

    // Send email notification to user
    const statusText = status === 'approved' ? 'অনুমোদিত' : 'বাতিল';
    const emailSubject = `পূজা বুকিং ${statusText} - ${booking.serviceName}`;
    
    let emailBody = `
প্রিয় ${booking.userName},

আপনার পূজা বুকিংটি ${statusText} হয়েছে।

বুকিং বিবরণ:
━━━━━━━━━━━━━━━━━━━━━━━━━
বুকিং আইডি: ${booking._id}
পূজার নাম: ${booking.serviceName}
তারিখ: ${booking.date.toLocaleDateString('bn-BD')}
সময়: ${booking.time}
━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    if (status === 'approved') {
      emailBody += `
✅ আপনার বুকিং অনুমোদিত হয়েছে!

অনুগ্রহ করে:
• নির্ধারিত তারিখ ও সময়ে মন্দিরে উপস্থিত হন
• পূজার ১৫ মিনিট আগে এসে যান
• প্রয়োজনীয় উপকরণ সাথে নিয়ে আসুন

যোগাযোগের জন্য: ${process.env.TEMPLE_PHONE || '01XXXXXXXXX'}
মন্দিরের ঠিকানা: ${process.env.TEMPLE_ADDRESS || 'মন্দিরের ঠিকানা'}

ধন্যবাদ,
${process.env.TEMPLE_NAME || 'মন্দির'} কমিটি
      `;
    } else {
      emailBody += `
❌ দুঃখিত, আপনার বুকিংটি বাতিল করা হয়েছে।

${rejectionReason ? `বাতিলের কারণ: ${rejectionReason}` : ''}

• আপনি অন্য তারিখে আবার বুকিং করতে পারেন
• আরও তথ্যের জন্য আমাদের সাথে যোগাযোগ করুন

যোগাযোগের জন্য: ${process.env.TEMPLE_PHONE || '01XXXXXXXXX'}

ধন্যবাদ,
${process.env.TEMPLE_NAME || 'মন্দির'} কমিটি
      `;
    }

    try {
      await sendEmail(booking.userEmail, emailSubject, emailBody);
      console.log(`✅ Status update notification sent to user: ${booking.userEmail}`);
    } catch (emailError) {
      console.error('❌ Failed to send user notification email:', emailError);
    }

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: booking
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status'
    });
  }
};

export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await Booking.findByIdAndDelete(id);

    // Update realtime stats after deletion
    const socketController = getSocketController();
    if (socketController) {
      socketController.emitRealtimeStatsToAdmins();
      
      // Notify admins about booking deletion
      socketController.io.to('admin-room').emit('bookingDeleted', {
        bookingId: id,
        serviceName: booking.serviceName,
        userName: booking.userName,
        timestamp: new Date().toISOString()
      });
    }

    // Direct socket.io emission if socketController is not available
    if (io) {
      io.to('admin-room').emit('bookingDeleted', {
        bookingId: id,
        serviceName: booking.serviceName,
        userName: booking.userName,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting booking'
    });
  }
};

export const getBookingStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const stats = await Promise.all([
      // Total bookings
      Booking.countDocuments(),
      
      // Pending bookings
      Booking.countDocuments({ status: 'pending' }),
      
      // Today's bookings
      Booking.countDocuments({
        createdAt: { $gte: startOfDay }
      }),
      
      // This month's bookings
      Booking.countDocuments({
        createdAt: { $gte: startOfMonth }
      })
    ]);

    // Include realtime connection stats
    const socketController = getSocketController();
    const connectionStats = socketController ? {
      connectedUsers: socketController.getConnectedUsersCount(),
      connectedAdmins: socketController.getConnectedAdminsCount()
    } : {
      connectedUsers: 0,
      connectedAdmins: 0
    };

    res.json({
      success: true,
      data: {
        total: stats[0],
        pending: stats[1],
        today: stats[2],
        thisMonth: stats[3],
        ...connectionStats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
};

// Admin functions
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    let query: any = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { serviceName: { $regex: search, $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Booking.countDocuments(query);
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: bookings,
      stats,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings'
    });
  }
};