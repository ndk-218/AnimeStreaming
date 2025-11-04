// @ts-nocheck
const nodemailer = require('nodemailer');

/**
 * ===== EMAIL SERVICE (NODEMAILER) =====
 * Gửi email verification và password reset cho user authentication
 */

/**
 * Create Nodemailer transporter
 */
const createTransporter = () => {
  try {
    // Validate email config
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email credentials not configured. Please check EMAIL_USER and EMAIL_PASSWORD in .env file');
    }

    const config = {
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    };

    console.log('📧 Creating email transporter for:', config.auth.user);

    const transporter = nodemailer.createTransport(config);
    
    return transporter;
  } catch (error) {
    console.error('❌ Error creating email transporter:', error.message);
    throw error;
  }
};

/**
 * Send email verification
 * 
 * @param {String} email - User email address
 * @param {String} displayName - User display name
 * @param {String} verificationToken - Verification token
 */
const sendVerificationEmail = async (email, displayName, verificationToken) => {
  try {
    console.log('📧 Sending verification email to:', email);
    
    const transporter = createTransporter();
    
    // Build verification link
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - Anime Streaming',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              border: 1px solid #ddd;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #2563eb;
              margin: 0;
            }
            .content {
              background-color: white;
              padding: 20px;
              border-radius: 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #2563eb;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 10px;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 Anime Streaming</h1>
            </div>
            
            <div class="content">
              <h2>Hi ${displayName}!</h2>
              
              <p>Thank you for registering with Anime Streaming! 🎉</p>
              
              <p>Please verify your email address by clicking the button below:</p>
              
              <center>
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </center>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb;">${verificationLink}</p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 24 hours.
              </div>
              
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Anime Streaming. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to: ${email}`, info.messageId);
    
    return { success: true };

  } catch (error) {
    console.error('❌ Send verification email error:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

/**
 * Send password reset email
 * 
 * @param {String} email - User email address
 * @param {String} displayName - User display name
 * @param {String} resetToken - Password reset token
 */
const sendPasswordResetEmail = async (email, displayName, resetToken) => {
  try {
    const transporter = createTransporter();
    
    // Build reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your Password - Anime Streaming',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              border: 1px solid #ddd;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #dc2626;
              margin: 0;
            }
            .content {
              background-color: white;
              padding: 20px;
              border-radius: 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #dc2626;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background-color: #fee2e2;
              border-left: 4px solid #dc2626;
              padding: 10px;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
            </div>
            
            <div class="content">
              <h2>Hi ${displayName}!</h2>
              
              <p>We received a request to reset your password for your Anime Streaming account.</p>
              
              <p>Click the button below to reset your password:</p>
              
              <center>
                <a href="${resetLink}" class="button">Reset Password</a>
              </center>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #dc2626;">${resetLink}</p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 1 hour.
              </div>
              
              <p><strong>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</strong></p>
            </div>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Anime Streaming. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to: ${email}`);
    
    return { success: true };

  } catch (error) {
    console.error('❌ Send password reset email error:', error.message);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send welcome email (optional - sau khi verify email)
 * 
 * @param {String} email - User email address
 * @param {String} displayName - User display name
 */
const sendWelcomeEmail = async (email, displayName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Anime Streaming! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              border: 1px solid #ddd;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #10b981;
              margin: 0;
            }
            .content {
              background-color: white;
              padding: 20px;
              border-radius: 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #10b981;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .features {
              background-color: #f0fdf4;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
            }
            .features ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Anime Streaming!</h1>
            </div>
            
            <div class="content">
              <h2>Hi ${displayName}!</h2>
              
              <p>Your email has been verified successfully! 🎊</p>
              
              <p>Welcome to the ultimate anime streaming platform. Here's what you can do now:</p>
              
              <div class="features">
                <ul>
                  <li>🎬 Watch thousands of anime episodes</li>
                  <li>⭐ Add your favorite series to watchlist</li>
                  <li>📺 Stream in HD quality (720p)</li>
                  <li>🌏 Multiple subtitle languages</li>
                  <li>📱 Watch on any device</li>
                </ul>
              </div>
              
              <center>
                <a href="${process.env.FRONTEND_URL}" class="button">Start Watching Now</a>
              </center>
              
              <p>Want even more? Upgrade to Premium and enjoy:</p>
              <ul>
                <li>🎥 Full HD 1080p streaming</li>
                <li>🚀 Early access to new episodes</li>
                <li>📥 Download for offline viewing</li>
                <li>🎯 Ad-free experience</li>
              </ul>
              
              <p>Happy watching! 🍿</p>
            </div>
            
            <div class="footer">
              <p>Need help? Contact us at support@animestreaming.com</p>
              <p>&copy; ${new Date().getFullYear()} Anime Streaming. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to: ${email}`);
    
    return { success: true };

  } catch (error) {
    console.error('❌ Send welcome email error:', error.message);
    // Don't throw error for welcome email - not critical
    return { success: false };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};
