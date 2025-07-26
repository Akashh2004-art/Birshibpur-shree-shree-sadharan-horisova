import { Request, Response } from "express";
import Admin, { IAdmin } from "../models/adminModel";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';

interface CustomRequest extends Request {
  user?: {
    email: string;
    name: string;
    uid: string;
  };
}

// Helper function to generate token
const generateToken = (admin: IAdmin) => {
  return jwt.sign(
    { 
      id: admin._id, 
      email: admin.email,
      role: admin.role 
    },
    process.env.JWT_SECRET!,
    { expiresIn: "10h" }
  );
};

// Helper function to format admin response
const formatAdminResponse = (admin: IAdmin) => {
  return {
    id: admin._id,
    email: admin.email,
    name: admin.displayName,
    role: admin.role,
    hasPassword: !!admin.password
  };
};

// Google Sign-In with enhanced error handling
const googleSignIn = async (req: CustomRequest, res: Response) => {
  try {
    const { email, name, uid } = req.user || {};
    
    if (!email || !uid) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and UID are required" 
      });
    }

    // Check if admin exists
    let admin = await Admin.findOne({ email });

    if (!admin) {
      // Check total number of admins before creating new one
      const adminCount = await Admin.countDocuments();
      
      if (adminCount >= 3) {
        // Get existing admins for the error message
        const existingAdmins = await Admin.find({}, 'email displayName')
          .sort({ createdAt: 1 });

        return res.status(403).json({ 
          success: false, 
          message: "Maximum admin limit reached (3 admins)!", 
          details: {
            currentAdmins: existingAdmins.map(admin => ({
              name: admin.displayName,
              email: admin.email
            })),
            message: "Please contact one of the existing admins for access."
          }
        });
      }

      // Create new admin if limit not reached
      admin = new Admin({
        firebaseUID: uid,
        displayName: name,
        email,
        role: "admin",
        password: null
      });
      
      await admin.save();
      console.log('📢 New admin created:', {
        id: admin._id,
        email: admin.email,
        hasPassword: !!admin.password,
        adminNumber: adminCount + 1,
        totalAdmins: adminCount + 1
      });
    }

    const token = generateToken(admin);
    const hasPassword = !!admin.password;

    res.json({ 
      success: true, 
      user: formatAdminResponse(admin),
      token,
      needsPassword: !hasPassword,
      redirectTo: hasPassword ? '/dashboard' : '/set-password'
    });

  } catch (error) {
    console.error("❌ Google SignIn Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Authentication failed" 
    });
  }
};

// Set Password - Updated with detailed logging
const setPassword = async (req: CustomRequest, res: Response) => {
  try {
    const { password } = req.body;
    const userEmail = req.user?.email;

    console.log('📢 Step 1 - Password Set Request:', {
      email: userEmail,
      hasPassword: !!password
    });

    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: "Password is required" 
      });
    }

    if (!userEmail) {
      return res.status(401).json({ 
        success: false, 
        message: "User not authenticated" 
      });
    }

    // Find admin first
    const admin = await Admin.findOne({ email: userEmail });
    
    if (!admin) {
      console.log('❌ Admin not found for email:', userEmail);
      return res.status(404).json({ 
        success: false, 
        message: "Admin not found" 
      });
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('📢 Step 2 - Password Hashed:', {
      hashedPassword: hashedPassword.substring(0, 10) + '...'
    });

    // Update admin using findOneAndUpdate
    const updatedAdmin = await Admin.findOneAndUpdate(
      { email: userEmail },
      { 
        $set: { 
          password: hashedPassword
        }
      },
      { new: true }
    );

    console.log('📢 Step 3 - Admin Updated:', {
      email: updatedAdmin?.email,
      hasPassword: !!updatedAdmin?.password,
      passwordHash: updatedAdmin?.password?.substring(0, 10) + '...'
    });

    if (!updatedAdmin) {
      return res.status(404).json({ 
        success: false, 
        message: "Admin not found" 
      });
    }

    // Generate new token
    const token = generateToken(updatedAdmin);

    res.json({
      success: true,
      message: 'Password set successfully',
      token,
      user: formatAdminResponse(updatedAdmin)
    });

  } catch (error: any) {
    console.error('❌ Error setting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login - Updated with detailed logging
const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    console.log('📢 Step 1 - Login Request:', {
      email,
      hasPassword: !!password
    });

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    const admin = await Admin.findOne({ email });
    
    console.log('📢 Step 2 - Admin Found:', {
      found: !!admin,
      hasPassword: !!admin?.password,
      passwordHash: admin?.password?.substring(0, 10) + '...'
    });
    
    if (!admin || !admin.password) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials or password not set" 
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    
    console.log('📢 Step 3 - Password Match:', {
      isMatch,
      inputPasswordLength: password.length,
      storedPasswordLength: admin.password.length
    });
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    const token = generateToken(admin);

    res.json({ 
      success: true, 
      token,
      user: formatAdminResponse(admin)
    });

  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

// Get Admin Profile
const getAdminProfile = async (req: CustomRequest, res: Response) => {
  try {
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ 
        success: false, 
        message: "User not authenticated" 
      });
    }

    const admin = await Admin.findOne({ email: userEmail })
      .select('-password');

    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: "Admin not found" 
      });
    }

    res.json({ 
      success: true, 
      admin: formatAdminResponse(admin)
    });

  } catch (error) {
    console.error("❌ Error fetching admin profile:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch profile" 
    });
  }
};

// Export all controllers together
export {
  googleSignIn,
  setPassword,
  login,
  getAdminProfile
};