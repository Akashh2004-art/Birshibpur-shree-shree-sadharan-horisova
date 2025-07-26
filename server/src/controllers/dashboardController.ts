import { Request, Response } from 'express';
import User from '../models/userModel';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // ইউজার স্ট্যাটিসটিক্স
    const totalUsers = await User.countDocuments();
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const usersLastMonth = await User.countDocuments({ createdAt: { $lt: lastMonthDate } });
    const userPercentChange = usersLastMonth === 0 ? 0 : ((totalUsers - usersLastMonth) / usersLastMonth) * 100;

    // For now, use placeholder data for other stats
    res.json({
      success: true,
      stats: {
        totalUsers: {
          count: totalUsers,
          percentChange: parseFloat(userPercentChange.toFixed(1))
        },
        activeEvents: {
          count: 0,
          percentChange: 0
        },
        totalBookings: {
          count: 0,
          percentChange: 0
        },
        totalDonations: {
          amount: 0,
          percentChange: 0
        }
      }
    });
  } catch (error) {
    console.error('ড্যাশবোর্ড স্ট্যাট লোড করতে সমস্যা হয়েছে:', error);
    res.status(500).json({
      success: false,
      message: 'ড্যাশবোর্ড স্ট্যাটিসটিক্স লোড করতে সমস্যা হয়েছে'
    });
  }
};