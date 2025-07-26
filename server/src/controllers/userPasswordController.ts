import { Request, Response } from 'express';
import User from '../models/userModel';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { validateEmail } from '../utils/validate';

// Gmail SMTP সেটআপ
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'akashsaha0751@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'gsah ldpi hfor ncqh', // App Password
  },
});

export const forgotPassword = async (req: Request, res: Response) => {
  const { emailOrPhone } = req.body;

  try {
    // শুধু ইমেইল চেক করা
    if (!validateEmail(emailOrPhone)) {
      return res.status(400).json({ success: false, message: 'সঠিক ইমেইল দিন' });
    }

    const user = await User.findOne({ email: emailOrPhone });
    if (!user) {
      return res.status(400).json({ success: false, message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // ১০ মিনিট
    await user.save();

    // ইমেইল পাঠানো
    await transporter.sendMail({
      from: `"Temple Admin" <${process.env.EMAIL}>`,
      to: user.email,
      subject: 'পাসওয়ার্ড রিসেট OTP',
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background-color: #FF4B2B;
            padding: 20px;
            text-align: center;
            color: white;
          }
          .header img {
            max-width: 200px;
            height: auto;
            margin-bottom: 10px;
          }
          .header h2 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .content h3 {
            color: #333;
            font-size: 22px;
            margin-bottom: 20px;
          }
          .otp-box {
            background-color: #f8f8f8;
            padding: 30px;
            border-radius: 10px;
            margin: 20px auto;
            width: 80%;
            max-width: 300px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          .otp-code {
            color: #FF4B2B;
            font-size: 40px;
            font-weight: bold;
            letter-spacing: 6px;
            margin: 0;
            text-align: center;
          }
          .content p {
            color: #666;
            font-size: 16px;
            margin-top: 20px;
          }
          .footer {
            background-color: #f8f8f8;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #e7e7e7;
          }
          .footer a {
            color: #FF4B2B;
            text-decoration: none;
            font-weight: bold;
          }
          @media (max-width: 480px) {
            .container {
              margin: 10px;
              border-radius: 0;
            }
            .header img {
              max-width: 150px;
            }
            .header h2 {
              font-size: 20px;
            }
            .content {
              padding: 20px 15px;
            }
            .content h3 {
              font-size: 18px;
            }
            .otp-code {
              font-size: 32px;
              letter-spacing: 4px;
            }
            .otp-box {
              width: 90%;
              padding: 20px;
            }
            .content p {
              font-size: 14px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            
            <h2>Radhe Radhe</h2>
          </div>
          <div class="content">
            <h3>Your OTP Code</h3>
            <div class="otp-box">
              <h1 class="otp-code">${otp}</h1>
            </div>
            <p>This OTP will be valid for up to 5 minutes. Please do not share it with anyone.</p>
          </div>
          <div class="footer">
            <p>© 2025 Radhe Radhe. All rights reserved.</p>
            <p>Need help? Contact us at <a href="mailto:support@radharadha.com" style="color: #FF4B2B; text-decoration: none;">support@radharadha.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  });

    res.json({ success: true, message: 'OTP সফলভাবে ইমেইলে পাঠানো হয়েছে' });
  } catch (error) {
    console.error('OTP পাঠানোর সময় ত্রুটি:', error);
    res.status(500).json({ success: false, message: 'OTP পাঠাতে সমস্যা হয়েছে' });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { emailOrPhone, otp } = req.body;

  try {
    // শুধু ইমেইল চেক করা
    if (!validateEmail(emailOrPhone)) {
      return res.status(400).json({ success: false, message: 'সঠিক ইমেইল দিন' });
    }

    const user = await User.findOne({ email: emailOrPhone });
    if (!user || user.otp !== otp || user.otpExpires! < new Date()) {
      return res.status(400).json({ success: false, message: 'ভুল বা মেয়াদ উত্তীর্ণ OTP' });
    }

    res.json({ success: true, message: 'OTP সফলভাবে যাচাই হয়েছে' });
  } catch (error) {
    console.error('OTP যাচাইয়ের সময় ত্রুটি:', error);
    res.status(500).json({ success: false, message: 'OTP যাচাই করতে সমস্যা হয়েছে' });
  }
};

export const setNewPassword = async (req: Request, res: Response) => {
  const { emailOrPhone, otp, password } = req.body;

  try {
    if (!emailOrPhone || !otp || !password) {
      return res.status(400).json({ success: false, message: 'ইমেইল, OTP, এবং পাসওয়ার্ড আবশ্যক' });
    }

    // শুধু ইমেইল চেক করা
    if (!validateEmail(emailOrPhone)) {
      return res.status(400).json({ success: false, message: 'সঠিক ইমেইল দিন' });
    }

    const user = await User.findOne({ email: emailOrPhone });
    if (!user || user.otp !== otp || user.otpExpires! < new Date()) {
      return res.status(400).json({ success: false, message: 'ভুল বা মেয়াদ উত্তীর্ণ OTP' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'পাসওয়ার্ড সফলভাবে সেট হয়েছে' });
  } catch (error) {
    console.error('পাসওয়ার্ড সেট করার সময় ত্রুটি:', error);
    res.status(500).json({ success: false, message: 'পাসওয়ার্ড সেট করতে সমস্যা হয়েছে' });
  }
};