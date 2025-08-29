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
    role?: string;
  };
}

// 🛡️ Rate limiting tracking
const requestTracker = new Map<string, { count: number; resetTime: number }>();

// 🧹 Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestTracker) {
    if (now > value.resetTime) {
      requestTracker.delete(key);
    }
  }
}, 5 * 60 * 1000);

// 🛡️ Rate limiting helper
const checkRateLimit = (identifier: string, maxRequests = 30, windowMs = 60000): boolean => {
  const now = Date.now();
  const userTrack = requestTracker.get(identifier);
  
  if (!userTrack || now > userTrack.resetTime) {
    // Reset or create new tracking
    requestTracker.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (userTrack.count >= maxRequests) {
    console.log(`🛑 Rate limit exceeded for ${identifier}: ${userTrack.count}/${maxRequests}`);
    return false;
  }
  
  userTrack.count++;
  return true;
};

// Firebase Token Verification Middleware
export const verifyFirebaseToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 🛡️ Rate limiting by IP
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(`firebase_${clientIP}`, 20, 60000)) {
      return res.status(429).json({ 
        success: false, 
        message: '⚠️ অনেক রিকোয়েস্ট হয়েছে। ১ মিনিট অপেক্ষা করুন।' 
      });
    }

    // Check authorization header first
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : req.body.token; // Fallback to body if not in header

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '🔐 কোন টোকেন প্রদান করা হয়নি' 
      });
    }

    // Add timeout for Firebase verification
    const decodedToken = await Promise.race([
      admin.auth().verifyIdToken(token),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase verification timeout')), 5000)
      )
    ]) as admin.auth.DecodedIdToken;

    req.user = {
      email: decodedToken.email || '',
      name: decodedToken.name || '',
      uid: decodedToken.uid,
    };

    next();
  } catch (error: any) {
    console.error('❌ Firebase Token verification failed:', error);
    
    if (error.message.includes('timeout')) {
      return res.status(408).json({ 
        success: false, 
        message: '⏱️ Firebase verification timeout। আবার চেষ্টা করুন।' 
      });
    }
    
    res.status(401).json({ 
      success: false, 
      message: '🔐 অবৈধ টোকেন' 
    });
  }
};

// JWT Authentication Middleware with Rate Limiting
export const authenticateJWT = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // 🛡️ Rate limiting by IP
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(`jwt_${clientIP}`, 25, 60000)) {
      return res.status(429).json({ 
        success: false, 
        message: '⚠️ অনেক রিকোয়েস্ট হয়েছে। ১ মিনিট অপেক্ষা করুন।' 
      });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      console.log('❌ No JWT found in request headers!');
      return res.status(401).json({ 
        success: false, 
        message: '🔐 কোন টোকেন প্রদান করা হয়নি' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      id: string; 
      email: string;
      role?: string;
    };
    
    req.user = {
      email: decoded.email,
      uid: decoded.id,
      id: decoded.id,
      name: '', // You might want to fetch this from your database
      role: decoded.role
    };
    next();
  } catch (err: any) {
    console.log('❌ JWT Verification Failed:', err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: '⏱️ টোকেনের মেয়াদ শেষ। আবার লগইন করুন।' 
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: '🔐 অবৈধ টোকেন ফরম্যাট' 
      });
    }
    
    return res.status(403).json({ 
      success: false, 
      message: '🔐 অবৈধ টোকেন' 
    });
  }
};

// Main Token Authentication - SINGLE DECLARATION
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    // Security check
    if (suspiciousIPs.has(clientIP)) {
      return res.status(403).json({ 
        success: false, 
        message: '🚫 আপনার IP ব্লক করা হয়েছে' 
      });
    }

    // Rate limiting
    if (!checkRateLimit(`user_${clientIP}`, 50, 60000)) {
      return res.status(429).json({ 
        success: false, 
        message: '⚠️ অনেক রিকোয়েস্ট। ১ মিনিট অপেক্ষা করুন।' 
      });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      trackAuthFailure(clientIP);
      return res.status(401).json({ 
        success: false, 
        message: '🔐 এক্সেস টোকেন প্রয়োজন' 
      });
    }

    // Verify with timeout
    const decoded = await Promise.race([
      new Promise((resolve, reject) => {
        try {
          const result = jwt.verify(token, process.env.JWT_SECRET!) as { 
            id: string; 
            email: string; 
            role?: string;
            name?: string;
            iat?: number;
            exp?: number;
          };
          resolve(result);
        } catch (err) {
          reject(err);
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Token verification timeout')), 3000)
      )
    ]) as any;

    req.user = {
      email: decoded.email,
      uid: decoded.id,
      id: decoded.id,
      _id: decoded.id,
      name: decoded.name || '',
      isAdmin: decoded.role === 'admin',
      role: decoded.role
    };

    next();
  } catch (err: any) {
    trackAuthFailure(clientIP);
    console.error('❌ User authentication failed:', err);
    
    if (err.message.includes('timeout')) {
      return res.status(408).json({ 
        success: false, 
        message: '⏱️ Authentication timeout। আবার চেষ্টা করুন।' 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: '⏱️ টোকেনের মেয়াদ শেষ। আবার লগইন করুন।' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: '🔐 অবৈধ বা মেয়াদোত্তীর্ণ টোকেন' 
    });
  }
};

// Admin Authentication Middleware (Enhanced with Rate Limiting)
export const authenticateAdmin = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // 🛡️ Stricter rate limiting for admin routes
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const identifier = `admin_${clientIP}_${userAgent.substring(0, 20)}`;
    
    if (!checkRateLimit(identifier, 20, 60000)) { // Lower limit for admin
      console.log(`🛑 Admin rate limit exceeded for ${identifier}`);
      return res.status(429).json({ 
        success: false, 
        message: '⚠️ Admin এক্সেসে অনেক রিকোয়েস্ট। ১ মিনিট অপেক্ষা করুন।' 
      });
    }

    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '🔐 Admin টোকেন প্রয়োজন' 
      });
    }

    // Verify token with timeout
    const decoded: any = await Promise.race([
      new Promise((resolve, reject) => {
        try {
          const result = jwt.verify(token, process.env.JWT_SECRET || 'akashsaha0751');
          resolve(result);
        } catch (err) {
          reject(err);
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Token verification timeout')), 3000)
      )
    ]);

    // Check if user is admin
    if (decoded.role !== 'admin') {
      console.log('🚫 Access denied, user is not an admin');
      return res.status(403).json({ 
        success: false, 
        message: '🚫 Admin অধিকার প্রয়োজন' 
      });
    }

    // Add user from payload to request
    req.user = {
      email: decoded.email,
      uid: decoded.id,
      id: decoded.id,
      _id: decoded.id,
      name: decoded.name || '',
      isAdmin: true,
      role: decoded.role
    };
    
    next();
  } catch (error: any) {
    console.error('❌ Admin token verification failed:', error);
    
    if (error.message.includes('timeout')) {
      return res.status(408).json({ 
        success: false, 
        message: '⏱️ টোকেন verification timeout। আবার চেষ্টা করুন।' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: '⏱️ Admin টোকেনের মেয়াদ শেষ। আবার লগইন করুন।' 
      });
    }
    
    res.status(401).json({ 
      success: false, 
      message: '🔐 অবৈধ Admin টোকেন' 
    });
  }
};

// 🛡️ IP-based blocking for suspicious activity
const suspiciousIPs = new Set<string>();
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const securityMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Block suspicious IPs
  if (suspiciousIPs.has(clientIP)) {
    console.log(`🚫 Blocked suspicious IP: ${clientIP}`);
    return res.status(403).json({ 
      success: false, 
      message: '🚫 আপনার IP ব্লক করা হয়েছে' 
    });
  }
  
  // Track failed attempts
  const now = Date.now();
  const attempts = failedAttempts.get(clientIP);
  
  if (attempts && attempts.count > 10 && (now - attempts.lastAttempt) < 300000) { // 5 minutes
    suspiciousIPs.add(clientIP);
    console.log(`🚫 IP ${clientIP} added to suspicious list after ${attempts.count} failed attempts`);
    return res.status(403).json({ 
      success: false, 
      message: '🚫 অনেক ভুল চেষ্টা। ৫ মিনিট ব্যান।' 
    });
  }
  
  next();
};

// 🔧 Enhanced error tracking
export const trackAuthFailure = (identifier: string) => {
  const now = Date.now();
  const current = failedAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
  
  failedAttempts.set(identifier, {
    count: current.count + 1,
    lastAttempt: now
  });
};

// ✅ BACKWARD COMPATIBILITY - Alternative names for the same function
export const authenticateUser = authenticateToken;
export const authMiddleware = authenticateToken;

// 🧹 Cleanup function for graceful shutdown
export const cleanupAuth = () => {
  requestTracker.clear();
  suspiciousIPs.clear();
  failedAttempts.clear();
  console.log('🧹 Auth middleware cleanup completed');
};

// Export type for other files
export type { AuthenticatedRequest };