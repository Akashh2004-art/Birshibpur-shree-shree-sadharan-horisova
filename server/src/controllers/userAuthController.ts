import { Request, Response } from "express";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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

// ✅ Check if phone number exists in the database
export const checkPhoneNumber = async (req: Request, res: Response) => {
  const { phone } = req.body;

  // ফোন নম্বর ভ্যালিডেশন
  if (!phone) {
    return res.status(400).json({ success: false, message: "ফোন নম্বর দরকার" });
  }

  try {
    // ফোন নম্বর নরমালাইজ করুন (libphonenumber-js ব্যবহার করে)
    const parsedPhone = parsePhoneNumberFromString(phone, 'IN');
    if (!parsedPhone || !parsedPhone.isValid()) {
      return res.status(400).json({ success: false, message: "অবৈধ ফোন নম্বর। দয়া করে ভারতের 10 ডিজিট ফোন নম্বর (+91 সহ) প্রবেশ করুন।" });
    }

    const normalizedPhone = parsedPhone.number;

    // ডাটাবেসে ফোন নম্বর চেক করুন
    const user = await User.findOne({ phone: normalizedPhone });
    res.json({ success: true, exists: !!user });
  } catch (error) {
    res.status(500).json({ success: false, message: "সার্ভার ত্রুটি" });
  }
};

// ✅ Validate Phone Number (same as checkPhoneNumber for consistency)
export const validatePhoneNumber = checkPhoneNumber;

// ✅ Complete Signup with Phone Number
export const completeSignup = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res
        .status(400)
        .json({ success: false, message: "ফোন এবং পাসওয়ার্ড আবশ্যক" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      phone: `+91${phone}`,
      password: hashedPassword,
      role: 'user', // ডিফল্ট ভূমিকা ইউজার
      status: 'active', // ডিফল্ট স্ট্যাটাস অ্যাকটিভ
    });

    await newUser.save();
    
    // নোটিফিকেশন তৈরি করুন
    await createSignupNotification(`+91${phone}`);
    
    res.json({
      success: true,
      message: "ব্যবহারকারী সফলভাবে নিবন্ধিত হয়েছে!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "সার্ভার ত্রুটি" });
  }
};

// ✅ Google Sign Up / Sign In
export const googleSignUp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const idToken = req.headers.authorization?.split("Bearer ")[1];

    if (!idToken) {
      res.status(400).json({ success: false, message: "ID টোকেন প্রয়োজন" });
      return;
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name = "", uid, picture } = decodedToken;

    if (!email) {
      res.status(400).json({ success: false, message: "ইমেইল আবশ্যক" });
      return;
    }

    let user = await User.findOne({ email });

    if (user) {
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || "akashsaha0751",
        { expiresIn: "365d" } // 1 বছরের জন্য টোকেন বৈধ থাকবে
      );

      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          status: user.status,
        },
        token,
        needsPassword: !user.password,
      });
    } else {
      res.status(200).json({
        success: true,
        tempUser: {
          name: name || email.split("@")[0],
          email,
          firebaseUID: uid,
          photoURL: picture,
        },
        needsPassword: true,
      });
    }
  } catch (error: any) {
    console.error("❌ Google সাইন আপ সমস্যা:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "সার্ভার সমস্যা" });
  }
};

// ✅ Complete Google Sign Up
export const completeGoogleSignUp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, firebaseUID, photoURL, password, phone } = req.body;

    if (!email || !password) {
      res
        .status(400)
        .json({ success: false, message: "ইমেইল ও পাসওয়ার্ড আবশ্যক" });
      return;
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res
        .status(400)
        .json({ success: false, message: "এই ইমেইল আগে থেকেই নিবন্ধিত" });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      name: name || email.split("@")[0],
      email,
      firebaseUID,
      photoURL,
      phone,
      password: hashedPassword,
      authProvider: "google",
      role: 'user', // ডিফল্ট ভূমিকা ইউজার
      status: 'active', // ডিফল্ট স্ট্যাটাস অ্যাকটিভ
    });
    
    // নোটিফিকেশন তৈরি করুন
    await createSignupNotification(email);
    
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET || "akashsaha0751",
      { expiresIn: "365d" } // 1 বছরের জন্য টোকেন বৈধ থাকবে
    );
    
    res.status(201).json({
      success: true,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
      },
      token,
      message: "ব্যবহারকারী সফলভাবে তৈরি হয়েছে",
    });
  } catch (error: any) {
    console.error("❌ Google সাইন আপ সম্পূর্ণ করতে সমস্যা:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "সার্ভার সমস্যা" });
  }
};

// ✅ Set Password
export const setPassword = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "ইমেইল ও পাসওয়ার্ড আবশ্যক" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "ব্যবহারকারী খুঁজে পাওয়া যায়নি" });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "পাসওয়ার্ড সফলভাবে সেট হয়েছে" });
  } catch (error) {
    console.error("❌ পাসওয়ার্ড সেট করতে সমস্যা:", error);
    return res.status(500).json({ success: false, message: "সার্ভার ত্রুটি" });
  }
};

// ✅ User Login
export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    console.log("📢 ইযার লগইন রিকোয়েস্ট (RAW):", {
      identifier,
      hasPassword: !!password,
    });

    if (!identifier || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "আইডেন্টিফায়ার (ইমেইল/ফোন) এবং পাসওয়ার্ড দরকার",
        });
    }

    const trimmedIdentifier = identifier.trim();
    console.log("📢 ইযার লগইন রিকোয়েস্ট (TRIMMED):", {
      identifier: trimmedIdentifier,
      hasPassword: !!password,
    });

    let user;
    if (trimmedIdentifier.includes("@")) {
      user = await User.findOne({ email: trimmedIdentifier }).select("+password");
    } else {
      let normalizedPhone = trimmedIdentifier;
      normalizedPhone = normalizedPhone
        .replace(/^\+91/, "")
        .replace(/^\+/, "")
        .replace(/^\s+/, "");
      if (!normalizedPhone.startsWith("+91")) {
        normalizedPhone = `+91${normalizedPhone}`;
      }
      console.log("📢 নরমালাইজড ফোন নম্বর:", normalizedPhone);
      user = await User.findOne({ phone: normalizedPhone }).select("+password");
    }

    if (!user) {
      console.log("❌ ইযার পাওয়া যায়নি:", trimmedIdentifier);
      return res
        .status(401)
        .json({ success: false, message: "ইযার খুঁজে পাওয়া যায়নি" });
    }

    console.log(
      "📢 ইযার পাওয়া গেছে, পাসওয়ার্ড:",
      user.password ? "Set" : "Not Set"
    );

    if (!user.password || user.password === "") {
      console.log("❌ পাসওয়ার্ড সেট করা নেই:", trimmedIdentifier);
      return res
        .status(401)
        .json({ success: false, message: "পাসওয়ার্ড সেট করা নেই" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ পাসওয়ার্ড মিলছে না:", trimmedIdentifier);
      return res
        .status(401)
        .json({ success: false, message: "পাসওয়ার্ড মিলছে না" });
    }

    const token = jwt.sign(
      { id: user._id, identifier: user.email || user.phone, role: user.role },
      process.env.JWT_SECRET || "akashsaha0751",
      { expiresIn: "365d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ ইযার লগইন এরর:", error);
    res.status(500).json({ success: false, message: "সার্ভারে সমস্যা" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'টোকেন প্রয়োজন' });
    }

    // টোকেন ভ্যালিডেট করুন
    jwt.verify(token, process.env.JWT_SECRET || 'akashsaha0751');
    
    // টোকেন রিমুভ বা ইনভ্যালিড করুন (ঐচ্ছিক)
    res.json({ success: true, message: 'সফলভাবে লগআউট হয়েছে' });
  } catch (error) {
    console.error('❌ লগআউট এরর:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ success: false, message: 'ভুল টোকেন' });
    }
    res.status(500).json({ success: false, message: 'সার্ভারে সমস্যা' });
  };
};

// ✅ Get All Users (নতুন কন্ট্রোলার)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find()
      .select('name email phone role status createdAt') // শুধু প্রয়োজনীয় ফিল্ড সিলেক্ট
      .sort({ createdAt: -1 }); // সাম্প্রতিক ইউজার প্রথমে দেখানো হবে
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: 'সার্�ভার ত্রুটি', error });
  }
};