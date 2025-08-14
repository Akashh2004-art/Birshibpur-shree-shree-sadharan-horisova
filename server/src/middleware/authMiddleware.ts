import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase.config';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
    name: string;
    uid: string;
    id?: string;
    _id?: string;
    isAdmin?: boolean;
  };
}

// Firebase Token Verification Middleware
export const verifyFirebaseToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check authorization header first
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : req.body.token; // Fallback to body if not in header

    // console.log('📢 Firebase Token Received:', token); // Debugging

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    // console.log('✅ Firebase Token Decoded:', decodedToken); // Debugging

    req.user = {
      email: decodedToken.email || '',
      name: decodedToken.name || '',
      uid: decodedToken.uid,
    };

    next();
  } catch (error) {
    console.error('❌ Firebase Token verification failed:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// JWT Authentication Middleware
export const authenticateJWT = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  // console.log('📢 Received JWT:', token); // Debugging

  if (!token) {
    console.log('❌ No JWT found in request headers!');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string };
    // console.log('✅ JWT Verified:', decoded); // Debugging
    req.user = {
      email: decoded.email,
      uid: decoded.id,
      id: decoded.id,
      name: '' // You might want to fetch this from your database
    };
    next();
  } catch (err) {
    console.log('❌ JWT Verification Failed:', err);
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// ✅ FIXED: Export authenticateToken function (this was missing!)
export const authenticateToken = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token is required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      id: string; 
      email: string; 
      role?: string;
    };
    
    req.user = {
      email: decoded.email,
      uid: decoded.id,
      id: decoded.id,
      _id: decoded.id, // For MongoDB compatibility
      name: '',
      isAdmin: decoded.role === 'admin'
    };
    
    next();
  } catch (err) {
    console.log('❌ Token Verification Failed:', err);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// Admin Authentication Middleware
export const authenticateAdmin = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'akashsaha0751');

    // console.log('✅ Decoded Token:', decoded); // Debugging

    // Check if user is admin (Fix: Checking role instead of isAdmin)
    if (decoded.role !== 'admin') {
      console.log('🚫 Access denied, user is not an admin');
      return res.status(403).json({ message: 'Access denied, admin privileges required' });
    }

    // Add user from payload to request
    req.user = {
      ...decoded,
      id: decoded.id,
      _id: decoded.id,
      uid: decoded.id
    };
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// ✅ FIXED: Alias for backward compatibility (if you used authenticateWT somewhere)
export const authMiddleware = authenticateToken;