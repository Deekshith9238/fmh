import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface ProviderApprovalData {
  providerName: string;
  providerEmail: string;
  category: string;
  hourlyRate: number;
  bio: string;
  yearsOfExperience: number;
  availability: string;
  submittedAt: Date;
}

export interface ApprovalResult {
  approved: boolean;
  adminNotes?: string;
  providerName: string;
  providerEmail: string;
}

export class EmailService {
  // Send notification to admin about new provider application
  static async sendProviderApplicationNotification(
    adminEmail: string,
    providerData: ProviderApprovalData
  ) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: "New Service Provider Application - Action Required",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Service Provider Application</h2>
          <p>A new service provider has submitted an application for approval.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Provider Details:</h3>
            <p><strong>Name:</strong> ${providerData.providerName}</p>
            <p><strong>Email:</strong> ${providerData.providerEmail}</p>
            <p><strong>Service Category:</strong> ${providerData.category}</p>
            <p><strong>Hourly Rate:</strong> $${providerData.hourlyRate}/hr</p>
            <p><strong>Years of Experience:</strong> ${providerData.yearsOfExperience}</p>
            <p><strong>Availability:</strong> ${providerData.availability}</p>
            <p><strong>Bio:</strong> ${providerData.bio}</p>
            <p><strong>Submitted:</strong> ${providerData.submittedAt.toLocaleDateString()}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Application
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Please log in to the admin dashboard to approve or reject this application.
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Provider application notification sent to admin: ${adminEmail}`);
    } catch (error) {
      console.error("Failed to send provider application notification:", error);
    }
  }

  // Send approval/rejection notification to provider
  static async sendApprovalNotification(result: ApprovalResult) {
    const subject = result.approved 
      ? "Your Service Provider Application Has Been Approved!" 
      : "Your Service Provider Application Status Update";

    const statusText = result.approved ? "approved" : "rejected";
    const statusColor = result.approved ? "#059669" : "#dc2626";
    const actionText = result.approved 
      ? "You can now start offering your services to clients!" 
      : "Please review the feedback and consider applying again with the requested changes.";

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: result.providerEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${statusColor};">Application ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Dear ${result.providerName},</strong></p>
            <p>Your service provider application has been <strong style="color: ${statusColor};">${statusText}</strong>.</p>
            
            ${result.adminNotes ? `
              <div style="margin: 20px 0; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <h4 style="margin-top: 0;">Admin Notes:</h4>
                <p style="margin-bottom: 0;">${result.adminNotes}</p>
              </div>
            ` : ''}
            
            <p>${actionText}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Your Profile
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for choosing FindMyHelper!
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Approval notification sent to provider: ${result.providerEmail}`);
    } catch (error) {
      console.error("Failed to send approval notification:", error);
    }
  }

  // Send email verification
  static async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Verify your email address - FindMyHelper",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to FindMyHelper!</h2>
          <p>Please verify your email address to complete your registration.</p>
          
          <div style="margin: 20px 0;">
            <a href="${verifyUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verifyUrl}">${verifyUrl}</a>
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Verification email sent to: ${email}`);
    } catch (error) {
      console.error("Failed to send verification email:", error);
    }
  }
} 