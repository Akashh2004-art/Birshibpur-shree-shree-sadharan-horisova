import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createCalculation,
  getCalculations,
  getRecentCalculations,
  getCalculationById,
  updateCalculation,
  deleteCalculation,
  getCalculationStats
} from '../controllers/calculationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Validation rules for calculation items
const calculationItemValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one calculation item is required'),
  body('items.*.id').notEmpty().withMessage('Item ID is required'),
  body('items.*.name').trim().isLength({ min: 1, max: 100 }).withMessage('Item name must be between 1-100 characters'),
  body('items.*.amount').isNumeric().withMessage('Item amount must be a valid number')
];

// Validation rules for calculation
const calculationValidation = [
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1-200 characters'),
  ...calculationItemValidation
];

// Validation for ID parameter
const idValidation = [
  param('id').isMongoId().withMessage('Invalid calculation ID')
];

// Validation for pagination queries
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  query('sortBy').optional().isIn(['createdAt', 'date', 'title', 'total']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
];

// Routes

// POST /api/calculations - Create a new calculation
router.post(
  '/',
  authenticateToken,
  calculationValidation,
  createCalculation
);

// GET /api/calculations - Get all calculations with pagination
router.get(
  '/',
  authenticateToken,
  paginationValidation,
  getCalculations
);

// GET /api/calculations/recent - Get recent calculations for dashboard
router.get(
  '/recent',
  authenticateToken,
  [query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1-50')],
  getRecentCalculations
);

// GET /api/calculations/stats - Get calculation statistics
router.get(
  '/stats',
  authenticateToken,
  getCalculationStats
);

// GET /api/calculations/:id - Get a specific calculation by ID
router.get(
  '/:id',
  authenticateToken,
  idValidation,
  getCalculationById
);

// PUT /api/calculations/:id - Update a calculation
router.put(
  '/:id',
  authenticateToken,
  [...idValidation, ...calculationValidation],
  updateCalculation
);

// DELETE /api/calculations/:id - Delete a calculation
router.delete(
  '/:id',
  authenticateToken,
  idValidation,
  deleteCalculation
);

export default router;