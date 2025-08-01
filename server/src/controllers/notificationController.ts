import { Request, Response } from 'express';
import Notification from '../models/notificationModel';
import User from '../models/userModel';
import { io } from '../app'; // পাথ সংশোধন করা হয়েছে

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(10);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read', error });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const result = await Notification.updateMany({ read: false }, { read: true });
    
    console.log('Marked all notifications as read:', result);
    
    // সকেট ইভেন্ট এমিট করুন যাতে সব ক্লায়েন্ট আপডেট পায়
    io.emit('notificationsUpdated');
    
    res.status(200).json({ 
      success: true,
      message: 'All notifications marked as read',
      count: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error marking all notifications as read', 
      error 
    });
  }
};

// ✅ NEW: Create event notification with email count tracking
export const createEventNotification = async (
  eventTitle: string, 
  action: 'created' | 'updated' | 'deleted',
  emailCount: number = 0
) => {
  try {
    let message = '';
    
    switch (action) {
      case 'created':
        message = `নতুন ইভেন্ট তৈরি হয়েছে: "${eventTitle}" | ${emailCount} জন ব্যবহারকারীকে ইমেইল পাঠানো হয়েছে`;
        break;
      case 'updated':
        message = `ইভেন্ট আপডেট হয়েছে: "${eventTitle}" | ${emailCount} জন ব্যবহারকারীকে ইমেইল পাঠানো হয়েছে`;
        break;
      case 'deleted':
        message = `ইভেন্ট মুছে ফেলা হয়েছে: "${eventTitle}"`;
        break;
      default:
        message = `ইভেন্ট "${eventTitle}" এ পরিবর্তন হয়েছে`;
    }

    const notification = new Notification({
      type: 'event',
      message: message,
      read: false,
      emailCount: emailCount, // Track how many emails were sent
      eventTitle: eventTitle,
      action: action
    });
    
    await notification.save();
    
    // Socket.IO দিয়ে রিয়েল-টাইম নোটিফিকেশন পাঠান
    io.emit('newNotification', notification);
    
    console.log(`Event notification created: ${message}`);
    return notification;
  } catch (error) {
    console.error('Error creating event notification:', error);
    throw error;
  }
};

// createSignupNotification ফাংশন যদি না থাকে বা সঠিকভাবে কাজ না করে
// createSignupNotification ফাংশন আপডেট করুন
export const createSignupNotification = async (identifier: string) => {
  try {
    // ইউজার খুঁজুন (ইমেইল বা ফোন নম্বর দিয়ে)
    let user;
    if (identifier.includes('@')) {
      // ইমেইল দিয়ে খুঁজুন
      user = await User.findOne({ email: identifier });
    } else {
      // ফোন নম্বর দিয়ে খুঁজুন
      user = await User.findOne({ phone: identifier });
    }

    // নোটিফিকেশন মেসেজ তৈরি করুন
    let message = `নতুন ব্যবহারকারী নিবন্ধিত হয়েছে: ${identifier}`;
    
    // যদি ইউজার পাওয়া যায়, তাহলে অতিরিক্ত তথ্য যোগ করুন
    if (user) {
      message = `নতুন ব্যবহারকারী নিবন্ধিত হয়েছে: ${user.name || 'অজানা'}, ${user.phone || ''}, ${user.email || ''}`;
    }

    const notification = new Notification({
      type: 'signup',
      message: message,
      read: false
    });
    
    await notification.save();
    
    // Socket.IO দিয়ে রিয়েল-টাইম নোটিফিকেশন পাঠান
    io.emit('newNotification', notification);
    
    return notification;
  } catch (error) {
    console.error('Error creating signup notification:', error);
    throw error;
  }
};

// ✅ NEW: Get email statistics
export const getEmailStats = async (req: Request, res: Response) => {
  try {
    // Total users with email - FIXED: Using $and operator to combine conditions
    const totalUsersWithEmail = await User.countDocuments({ 
      $and: [
        { email: { $exists: true } },
        { email: { $ne: null } },
        { email: { $ne: '' } }
      ]
    });
    
    // Total users without email
    const totalUsersWithoutEmail = await User.countDocuments({ 
      $or: [
        { email: { $exists: false } },
        { email: null },
        { email: '' }
      ]
    });
    
    // Recent email notifications
    const recentEmailNotifications = await Notification.find({ 
      type: 'event',
      message: { $regex: 'ইমেইল পাঠানো হয়েছে' }
    }).sort({ createdAt: -1 }).limit(5);
    
    const stats = {
      totalUsersWithEmail,
      totalUsersWithoutEmail,
      totalUsers: totalUsersWithEmail + totalUsersWithoutEmail,
      recentEmailNotifications: recentEmailNotifications.map(notif => ({
        id: notif._id,
        message: notif.message,
        createdAt: notif.createdAt,
        emailCount: notif.emailCount || 0
      }))
    };
    
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ success: false, error: 'ইমেইল পরিসংখ্যান লোড করতে সমস্যা হয়েছে' });
  }
};