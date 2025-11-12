import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { SessionData } from '../types';
import logger from '../utils/logger';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private mockMode: boolean;

  constructor() {
    this.mockMode = config.email.mockMode;

    if (this.mockMode) {
      logger.info('📧 Email service running in MOCK MODE - emails will be logged but not sent');
    } else if (config.email.serviceApiKey) {
      // Configure email transporter
      // For SendGrid, use SMTP
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: config.email.serviceApiKey,
        },
      });
      logger.info('Email service initialized with SendGrid');
    } else {
      logger.warn('Email service not configured - SendGrid API key missing. Using mock mode.');
      this.mockMode = true;
    }
  }

  async sendEmail(data: EmailData): Promise<void> {
    if (this.mockMode || !this.transporter) {
      // Mock mode - log the email that would be sent
      const textContent = data.text || data.html.replace(/<[^>]*>/g, '');
      
      logger.info('📧 [MOCK EMAIL] Email would be sent:', {
        to: data.to,
        from: `${config.email.fromName} <${config.email.from}>`,
        subject: data.subject,
        timestamp: new Date().toISOString(),
      });
      
      // Pretty print for demo visibility
      console.log('\n' + '='.repeat(80));
      console.log('📧 MOCK EMAIL NOTIFICATION');
      console.log('='.repeat(80));
      console.log(`To:      ${data.to}`);
      console.log(`From:    ${config.email.fromName} <${config.email.from}>`);
      console.log(`Subject: ${data.subject}`);
      console.log(`Time:    ${new Date().toLocaleString()}`);
      console.log('-'.repeat(80));
      console.log('Content:');
      console.log(textContent);
      console.log('='.repeat(80) + '\n');
      
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"${config.email.fromName}" <${config.email.from}>`,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text || data.html.replace(/<[^>]*>/g, ''),
      });
      
      logger.info(`Email sent successfully to ${data.to}`, {
        to: data.to,
        subject: data.subject,
      });
    } catch (error) {
      logger.error('Email sending error:', error);
      throw error;
    }
  }

  async sendSessionConfirmation(to: string, sessionData: SessionData): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Session Confirmed - Capital Factory Office Hours',
      html: `
        <h2>Session Confirmed</h2>
        <p>Your session has been confirmed:</p>
        <ul>
          <li><strong>Mentor:</strong> ${sessionData.mentorName}</li>
          <li><strong>Date & Time:</strong> ${new Date(sessionData.scheduledAt).toLocaleString()}</li>
          <li><strong>Duration:</strong> ${sessionData.durationMinutes} minutes</li>
          ${sessionData.topic ? `<li><strong>Topic:</strong> ${sessionData.topic}</li>` : ''}
        </ul>
        <p>We'll send you a reminder 24 hours before your session.</p>
      `,
    });
  }

  async sendSessionReminder(to: string, sessionData: SessionData, hoursUntil: number): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Session Reminder - ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''} until your session`,
      html: `
        <h2>Session Reminder</h2>
        <p>This is a reminder that you have a session in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}:</p>
        <ul>
          <li><strong>Mentor:</strong> ${sessionData.mentorName}</li>
          <li><strong>Date & Time:</strong> ${new Date(sessionData.scheduledAt).toLocaleString()}</li>
          ${sessionData.topic ? `<li><strong>Topic:</strong> ${sessionData.topic}</li>` : ''}
        </ul>
      `,
    });
  }
}

export const emailService = new EmailService();

