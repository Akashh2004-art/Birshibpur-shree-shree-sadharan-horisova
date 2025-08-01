import nodemailer from 'nodemailer';
import { IUser } from '../models/userModel';

// ✅ FIXED: Method name corrected to createTransport
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Alternative: Custom SMTP settings
const createCustomTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export const sendEmailNotification = async (
  users: IUser[],
  subject: string,
  title: string,
  message: string
): Promise<number> => {
  try {
    const transporter = createTransporter();
    
    // Filter users who have valid email addresses
    const usersWithEmail = users.filter(user => 
      user.email && 
      user.email.trim() !== '' && 
      user.email.includes('@')
    );
    
    if (usersWithEmail.length === 0) {
      console.log('No users with valid email addresses found');
      return 0;
    }

    console.log(`📧 Sending email to ${usersWithEmail.length} users...`);

    // Create HTML email template
    const htmlTemplate = createEmailTemplate(title, message);

    // ✅ IMPROVED: Better batch processing for large user base (1000+ users)
    const batchSize = 25; // Reduced batch size for better reliability
    const batches = [];
    
    for (let i = 0; i < usersWithEmail.length; i += batchSize) {
      batches.push(usersWithEmail.slice(i, i + batchSize));
    }

    let totalSent = 0;
    let totalFailed = 0;

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);

      const emailPromises = batch.map(async (user) => {
        try {
          const mailOptions = {
            from: {
              name: process.env.TEMPLE_NAME || 'মন্দির কমিটি',
              address: process.env.EMAIL_USER!
            },
            to: user.email!,
            subject: subject,
            html: htmlTemplate,
            text: message.replace(/<[^>]*>/g, ''), // Remove HTML tags for text version
          };

          await transporter.sendMail(mailOptions);
          console.log(`✅ Email sent to: ${user.email}`);
          return { success: true, email: user.email };
        } catch (error) {
          console.error(`❌ Failed to send email to ${user.email}:`, error);
          return { success: false, email: user.email, error };
        }
      });

      // Wait for all emails in this batch
      const results = await Promise.allSettled(emailPromises);
      
      // Count results
      const batchSuccess = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;
      
      const batchFailed = results.filter(result => 
        result.status === 'rejected' || !result.value.success
      ).length;
      
      totalSent += batchSuccess;
      totalFailed += batchFailed;

      console.log(`📊 Batch ${batchIndex + 1} completed: ${batchSuccess} sent, ${batchFailed} failed`);

      // ✅ IMPORTANT: Add delay between batches to avoid rate limiting
      if (batchIndex < batches.length - 1) {
        console.log('⏳ Waiting 3 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log(`🎉 Email notification completed!`);
    console.log(`📈 Final Stats: ${totalSent} sent, ${totalFailed} failed out of ${usersWithEmail.length} total`);
    
    return totalSent;

  } catch (error) {
    console.error('💥 Critical error in sendEmailNotification:', error);
    throw error;
  }
};

// ✅ IMPROVED: Better HTML template
const createEmailTemplate = (title: string, message: string): string => {
  return `
  <!DOCTYPE html>
  <html lang="bn">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
          body {
              font-family: 'Kalpurush', 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 20px;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 15px;
              box-shadow: 0 4px 25px rgba(0,0,0,0.1);
              border-top: 5px solid #ff6b35;
          }
          .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #ff6b35;
          }
          .header h1 {
              color: #ff6b35;
              margin: 0;
              font-size: 28px;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          }
          .content {
              white-space: pre-line;
              font-size: 16px;
              line-height: 1.8;
              background: #fefefe;
              padding: 20px;
              border-radius: 10px;
              border-left: 4px solid #ff6b35;
          }
          .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              color: #666;
              font-size: 14px;
          }
          .temple-name {
              color: #ff6b35;
              font-weight: bold;
              font-size: 16px;
          }
          .om-symbol {
              font-size: 30px;
              color: #ff6b35;
              margin-bottom: 10px;
          }
          @media only screen and (max-width: 600px) {
              .container {
                  padding: 20px;
                  margin: 10px;
              }
              .header h1 {
                  font-size: 24px;
              }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <div class="om-symbol">🕉️</div>
              <h1>${process.env.TEMPLE_NAME || 'মন্দির'}</h1>
          </div>
          <div class="content">
              ${message}
          </div>
          <div class="footer">
              <p>এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে।</p>
              <p class="temple-name">${process.env.TEMPLE_NAME || 'মন্দির কমিটি'}</p>
              <p>📧 ${process.env.EMAIL_USER || ''} | 🌐 ${process.env.WEBSITE_URL || 'আমাদের ওয়েবসাইট'}</p>
              <p style="font-size: 12px; color: #999; margin-top: 15px;">
                  © ${new Date().getFullYear()} ${process.env.TEMPLE_NAME || 'মন্দির'}. সকল অধিকার সংরক্ষিত।
              </p>
          </div>
      </div>
  </body>
  </html>
  `;
};

// Send individual email
export const sendSingleEmail = async (
  email: string,
  subject: string,
  message: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: process.env.TEMPLE_NAME || 'মন্দির কমিটি',
        address: process.env.EMAIL_USER!
      },
      to: email,
      subject: subject,
      html: createEmailTemplate(subject, message),
      text: message.replace(/<[^>]*>/g, '')
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Single email sent successfully to: ${email}`);
    return true;

  } catch (error) {
    console.error(`❌ Failed to send single email to ${email}:`, error);
    return false;
  }
};

// Test email connection
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return false;
  }
};