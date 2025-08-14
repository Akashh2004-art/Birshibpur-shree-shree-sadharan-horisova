import { Request, Response } from "express";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import { createSignupNotification } from "./notificationController";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// 🔥 MAIN Google Authentication Function
export const googleSignUp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get token from request body
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({ success: false, message: "Google token প্রয়োজন" });
      return;
    }

    // Verify Google ID token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { email, name = "", uid, picture } = decodedToken;

    if (!email) {
      res.status(400).json({ success: false, message: "ইমেইল আবশ্যক" });
      return;
    }

    // Check if user already exists (by email or Firebase UID)
    let user = await User.findOne({ 
      $or: [
        { email: email },
        { firebaseUID: uid }
      ]
    });

    if (user) {
      // Existing user - generate JWT and return
      const jwtToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || "akashsaha0751",
        { expiresIn: "365d" } // 1 year for "remember me"
      );

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || null,
          isAdmin: user.isAdmin || false,
          photoURL: user.photoURL || picture
        },
        token: jwtToken,
        message: "সফলভাবে লগইন হয়েছে"
      });
    } else {
      // New user - create automatically without password
      const newUser = await User.create({
        name: name || email.split("@")[0],
        email: email,
        firebaseUID: uid,
        photoURL: picture,
        authProvider: "google",
        isVerified: true,
        isAdmin: false
        // No password field - Google users don't need password
      });

      // Create notification for new signup
      try {
        await createSignupNotification(email);
      } catch (notifError) {
        console.warn("Notification creation failed:", notifError);
        // Don't fail the entire request if notification fails
      }

      // Generate JWT token for new user
      const jwtToken = jwt.sign(
        { id: newUser._id },
        process.env.JWT_SECRET || "akashsaha0751",
        { expiresIn: "365d" }
      );

      res.status(201).json({
        success: true,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: null,
          isAdmin: false,
          photoURL: newUser.photoURL
        },
        token: jwtToken,
        message: "নতুন অ্যাকাউন্ট তৈরি হয়েছে"
      });
    }
  } catch (error: any) {
    console.error("❌ Google authentication error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Google authentication ব্যর্থ" 
    });
  }
};

// ✅ Get User Profile (for /me endpoint)
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // From auth middleware
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        isAdmin: user.isAdmin || false,
        photoURL: user.photoURL
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ✅ Logout Function (Keep as is)
export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'টোকেন প্রয়োজন' });
    }

    // Validate token
    jwt.verify(token, process.env.JWT_SECRET || 'akashsaha0751');
    
    // Token invalidation logic can be added here if needed
    res.json({ success: true, message: 'সফলভাবে লগআউট হয়েছে' });
  } catch (error) {
    console.error('❌ লগআউট এরর:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ success: false, message: 'ভুল টোকেন' });
    }
    res.status(500).json({ success: false, message: 'সার্ভারে সমস্যা' });
  }
};

// ✅ Get All Users (Admin Only - Keep as is)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find()
      .select('name email phone authProvider isAdmin isVerified createdAt photoURL') 
      .sort({ createdAt: -1 }); 
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: 'সার্ভার ত্রুটি', error });
  }
};

// ❌ REMOVED FUNCTIONS (No longer needed for Google-only auth):
// - checkPhoneNumber
// - validatePhoneNumber  
// - completeSignup
// - completeGoogleSignUp
// - setPassword
// - login