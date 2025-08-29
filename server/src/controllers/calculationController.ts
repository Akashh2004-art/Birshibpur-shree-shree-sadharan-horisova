import { Request, Response } from 'express';
import { Calculation, ICalculation } from '../models/calculationModel';
import { validationResult } from 'express-validator';

// Create a new calculation
export const createCalculation = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { date, title, items } = req.body;

    // Calculate total
    const total = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

    // Create new calculation
    const newCalculation = new Calculation({
      date,
      title,
      items,
      total
    });

    const savedCalculation = await newCalculation.save();

    res.status(201).json({
      success: true,
      message: 'Calculation created successfully! ✅',
      data: savedCalculation
    });

  } catch (error: any) {
    console.error('Error creating calculation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create calculation ❌',
      error: error.message
    });
  }
};

// Get all calculations with pagination and sorting
export const getCalculations = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';
    const search = req.query.search as string || '';

    const skip = (page - 1) * limit;

    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { date: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Build sort object
    const sortObject: any = {};
    sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get calculations with pagination
    const calculations = await Calculation.find(searchQuery)
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCalculations = await Calculation.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalCalculations / limit);

    res.status(200).json({
      success: true,
      message: 'Calculations retrieved successfully! 📊',
      data: calculations,
      pagination: {
        currentPage: page,
        totalPages,
        totalCalculations,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error: any) {
    console.error('Error getting calculations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get calculations ❌',
      error: error.message
    });
  }
};

// Get recent calculations for dashboard
export const getRecentCalculations = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 8;

    const recentCalculations = await Calculation.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('date title total createdAt')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Recent calculations retrieved successfully! 🕒',
      data: recentCalculations
    });

  } catch (error: any) {
    console.error('Error getting recent calculations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent calculations ❌',
      error: error.message
    });
  }
};

// Get a single calculation by ID
export const getCalculationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const calculation = await Calculation.findById(id).lean();

    if (!calculation) {
      res.status(404).json({
        success: false,
        message: 'Calculation not found ❌'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Calculation retrieved successfully! ✅',
      data: calculation
    });

  } catch (error: any) {
    console.error('Error getting calculation by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get calculation ❌',
      error: error.message
    });
  }
};

// Update a calculation
export const updateCalculation = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { id } = req.params;
    const { date, title, items } = req.body;

    // Calculate total
    const total = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

    const updatedCalculation = await Calculation.findByIdAndUpdate(
      id,
      { date, title, items, total },
      { new: true, runValidators: true }
    );

    if (!updatedCalculation) {
      res.status(404).json({
        success: false,
        message: 'Calculation not found ❌'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Calculation updated successfully! ✅',
      data: updatedCalculation
    });

  } catch (error: any) {
    console.error('Error updating calculation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update calculation ❌',
      error: error.message
    });
  }
};

// Delete a calculation
export const deleteCalculation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedCalculation = await Calculation.findByIdAndDelete(id);

    if (!deletedCalculation) {
      res.status(404).json({
        success: false,
        message: 'Calculation not found ❌'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Calculation deleted successfully! 🗑️',
      data: deletedCalculation
    });

  } catch (error: any) {
    console.error('Error deleting calculation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete calculation ❌',
      error: error.message
    });
  }
};

// Get calculation statistics
export const getCalculationStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalCalculations = await Calculation.countDocuments();
    
    // Get total amount across all calculations
    const totalAmountResult = await Calculation.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total' }
        }
      }
    ]);

    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;

    // Get today's calculations count
    const today = new Date().toISOString().split('T')[0];
    const todayCalculations = await Calculation.countDocuments({
      date: today
    });

    // Get this month's calculations
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthStart = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    
    const monthlyCalculations = await Calculation.countDocuments({
      date: { $gte: monthStart }
    });

    res.status(200).json({
      success: true,
      message: 'Calculation statistics retrieved successfully! 📈',
      data: {
        totalCalculations,
        totalAmount,
        todayCalculations,
        monthlyCalculations
      }
    });

  } catch (error: any) {
    console.error('Error getting calculation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get calculation statistics ❌',
      error: error.message
    });
  }
};