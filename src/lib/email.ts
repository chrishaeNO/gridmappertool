import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // For development, you can use Gmail SMTP or a service like Mailtrap
  // For production, use a proper email service like SendGrid, AWS SES, etc.
  
  if (process.env.NODE_ENV === 'development') {
    // For development - log to console instead of sending real emails
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  // Production email configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback to Gmail (requires app password)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  throw new Error('No email configuration found. Please set up SMTP or Gmail credentials.');
};

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@gridmapper.com',
      to: email,
      subject: 'Reset Your GridMapper Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .button:hover { background: #0056b3; }
            .logo { font-size: 24px; font-weight: bold; color: #007bff; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🗺️ GridMapper</div>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>Hello,</p>
              <p>We received a request to reset your password for your GridMapper account. If you didn't make this request, you can safely ignore this email.</p>
              <p>To reset your password, click the button below:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
                ${resetUrl}
              </p>
              <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
              <p>If you're having trouble with the button above, copy and paste the URL into your web browser.</p>
              <p>Best regards,<br>The GridMapper Team</p>
            </div>
            <div class="footer">
              <p>This email was sent to ${email}. If you didn't request a password reset, please ignore this email.</p>
              <p>© ${new Date().getFullYear()} GridMapper. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Reset Your GridMapper Password

Hello,

We received a request to reset your password for your GridMapper account. If you didn't make this request, you can safely ignore this email.

To reset your password, visit this link:
${resetUrl}

This link will expire in 1 hour for security reasons.

Best regards,
The GridMapper Team

This email was sent to ${email}. If you didn't request a password reset, please ignore this email.
      `.trim()
    };

    if (process.env.NODE_ENV === 'development') {
      // In development, just log the email content
      console.log('=== PASSWORD RESET EMAIL ===');
      console.log('To:', email);
      console.log('Subject:', mailOptions.subject);
      console.log('Reset URL:', resetUrl);
      console.log('=== END EMAIL ===');
      return { success: true, messageId: 'dev-mode' };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@gridmapper.com',
      to: email,
      subject: 'Welcome to GridMapper!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to GridMapper</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .logo { font-size: 24px; font-weight: bold; color: #007bff; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🗺️ GridMapper</div>
            </div>
            <div class="content">
              <h2>Welcome to GridMapper, ${name}!</h2>
              <p>Thank you for creating your GridMapper account. You're now ready to create professional grid maps for your projects.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" class="button">Get Started</a>
              </p>
              <p>With GridMapper, you can:</p>
              <ul>
                <li>Upload images and create precise grid overlays</li>
                <li>Customize grid sizes, colors, and labels</li>
                <li>Split maps into multiple sections</li>
                <li>Share your maps with others</li>
                <li>Export high-quality images</li>
              </ul>
              <p>If you have any questions or need help getting started, don't hesitate to reach out.</p>
              <p>Happy mapping!<br>The GridMapper Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} GridMapper. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('=== WELCOME EMAIL ===');
      console.log('To:', email);
      console.log('Subject:', mailOptions.subject);
      console.log('=== END EMAIL ===');
      return { success: true, messageId: 'dev-mode' };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
}
