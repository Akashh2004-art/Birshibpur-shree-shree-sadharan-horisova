import { Request, Response } from 'express';
import Booking, { IBooking } from '../models/bookingModel';
import Admin from '../models/adminModel';
import { sendEmail } from '../utils/emailService';
import { io } from '../app';

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

    // Check for duplicate bookings
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

    // Real-time notification to admins
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

    // Send email to admins
    try {
      const admins = await Admin.find({}, 'email').lean();
      const adminEmails = admins.map(admin => admin.email).filter(email => email);
      
      if (adminEmails.length > 0) {
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

        await Promise.all(
          adminEmails.map(adminEmail => 
            sendEmail(adminEmail, emailSubject, emailBody).catch(console.error)
          )
        );
      }
    } catch (emailError) {
      console.error('Error sending admin notifications:', emailError);
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

    res.json({
      success: true,
      data: bookings,
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

    // Update booking status
    booking.status = status;
    if (status === 'rejected' && rejectionReason) {
      booking.rejectionReason = rejectionReason;
    }

    await booking.save();

    // Real-time notification to user
    if (io) {
      io.to(`user-${booking.userId}`).emit('bookingStatusUpdate', {
        bookingId: booking._id.toString(),
        status: booking.status,
        serviceName: booking.serviceName,
        date: booking.date.toISOString(),
        time: booking.time,
        rejectionReason: booking.rejectionReason
      });

      // Notify admins about the update
      io.to('admin-room').emit('bookingStatusUpdate', {
        bookingId: booking._id.toString(),
        status: booking.status,
        serviceName: booking.serviceName,
        userName: booking.userName
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

ধন্যবাদ,
মন্দির কমিটি
      `;
    } else {
      emailBody += `
❌ দুঃখিত, আপনার বুকিংটি বাতিল করা হয়েছে।

${rejectionReason ? `বাতিলের কারণ: ${rejectionReason}` : ''}

• আপনি অন্য তারিখে আবার বুকিং করতে পারেন

ধন্যবাদ,
মন্দির কমিটি
      `;
    }

    try {
      await sendEmail(booking.userEmail, emailSubject, emailBody);
    } catch (emailError) {
      console.error('Failed to send user notification email:', emailError);
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

    // Notify admins about deletion
    if (io) {
      io.to('admin-room').emit('bookingDeleted', {
        bookingId: id,
        serviceName: booking.serviceName,
        userName: booking.userName
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

// ✅ ADDED: Missing getBookingStats function
export const getBookingStats = async (req: Request, res: Response) => {
  try {
    // Basic stats aggregation
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$amount', 0] } }
        }
      }
    ]);

    // Daily booking stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Service-wise booking stats
    const serviceStats = await Booking.aggregate([
      {
        $group: {
          _id: '$serviceName',
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Monthly revenue (current month)
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          status: 'approved',
          createdAt: { $gte: currentMonthStart }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$amount', 0] } },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overallStats: stats,
        dailyStats,
        serviceStats,
        monthlyRevenue: monthlyRevenue[0] || { totalRevenue: 0, totalBookings: 0 }
      }
    });

  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking statistics'
    });
  }
};


export const getCurrentBookingStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Find user's active booking (pending or approved)
    const activeBooking = await Booking.findOne({
      userId,
      status: { $in: ['pending', 'approved'] }
    }).sort({ createdAt: -1 });

    if (!activeBooking) {
      return res.json({
        success: true,
        data: null,
        message: 'No active booking found'
      });
    }

    // Check if approved booking has expired
    if (activeBooking.status === 'approved') {
      const bookingDateTime = new Date(activeBooking.date);
      const [timeStr] = activeBooking.time.split(' ');
      const [hour, minute] = timeStr.split(':').map(Number);

      bookingDateTime.setHours(hour, minute + 5, 0, 0); // Add 5 min grace period

      const now = new Date();

      if (now > bookingDateTime) {
        return res.json({
          success: true,
          data: {
            expired: true,
            bookingId: activeBooking._id.toString(),
            serviceName: activeBooking.serviceName,
            date: activeBooking.date.toISOString(),
            time: activeBooking.time,
            status: activeBooking.status, // still shows approved
            rejectionReason: activeBooking.rejectionReason,
            message: activeBooking.message
          },
          message: 'Booking is expired'
        });
      }
    }

    // Return active booking (not expired)
    res.json({
      success: true,
      data: {
        expired: false,
        bookingId: activeBooking._id.toString(),
        serviceName: activeBooking.serviceName,
        date: activeBooking.date.toISOString(),
        time: activeBooking.time,
        status: activeBooking.status,
        rejectionReason: activeBooking.rejectionReason,
        message: activeBooking.message
      }
    });

  } catch (error) {
    console.error('Error fetching current booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking status'
    });
  }
};
