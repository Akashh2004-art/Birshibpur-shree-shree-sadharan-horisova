import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import Admin from '../models/adminModel';
import bcrypt from 'bcrypt';

// OTP স্টোরেজ
const otpStore = new Map<string, { otp: string; timestamp: number }>();

// নোডমেইলার সেটাপ
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// Generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'There is no admin account with this email'
      });
    }

    const otp = generateOTP();
    otpStore.set(email, { otp, timestamp: Date.now() });

    const mailOptions = {
      from: `"Temple Admin" <${process.env.EMAIL}>`,
      to: email,
      subject: 'Your Password Reset OTP',
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
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'OTP has been sent to your email'
    });

  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({
      success: false,
      message: 'There was a problem sending OTP'
    });
  }
};

// Verify OTP
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    console.log('Received OTP:', otp); // Debugging
    console.log('Stored Data:', otpStore.get(email)); // Debugging

    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Make sure both are strings when comparing
    if (String(storedData.otp) !== String(otp)) {
      console.log('Stored OTP:', storedData.otp); // Debugging
      console.log('Received OTP:', otp); // Debugging
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP'
      });
    }

    // OTP matches
    otpStore.delete(email);
    res.json({
      success: true,
      message: 'OTP verify is successful'
    });

  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await Admin.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'There was a problem updating the password'
    });
  }
};