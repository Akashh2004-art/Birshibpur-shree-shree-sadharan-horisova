import { Request, Response } from 'express';
import User from '../models/userModel';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
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
    res.status(500).json({
      success: false,
      message: 'There was a problem loading dashboard statistics'
    });
  }
};