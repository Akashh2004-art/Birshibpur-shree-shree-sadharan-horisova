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