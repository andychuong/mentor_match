import logger from '../utils/logger';
import { config } from '../config/env';

// Twilio will be optional - only load if credentials are provided
let twilio: any = null;
try {
  twilio = require('twilio');
} catch (e) {
  // Twilio not installed, will use mock
}

export interface SMSData {
  to: string;
  message: string;
}

export class SMSService {
  private client: any = null;
  private fromNumber: string;
  private mockMode: boolean;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.mockMode = config.sms.mockMode;

    if (this.mockMode) {
      logger.info('📱 SMS service running in MOCK MODE - messages will be logged but not sent');
    } else if (twilio && accountSid && authToken && this.fromNumber) {
      this.client = twilio(accountSid, authToken);
      logger.info('SMS service initialized with Twilio');
    } else {
      logger.warn('SMS service not configured - Twilio credentials missing or package not installed. Using mock mode.');
      this.mockMode = true;
    }
  }

  async sendSMS(data: SMSData): Promise<void> {
    if (this.mockMode || !this.client) {
      // Mock mode - log the SMS that would be sent
      logger.info('📱 [MOCK SMS] SMS would be sent:', {
        to: data.to,
        from: this.fromNumber || 'MOCK_NUMBER',
        message: data.message,
        timestamp: new Date().toISOString(),
      });
      
      // Pretty print for demo visibility
      console.log('\n' + '='.repeat(80));
      console.log('📱 MOCK SMS NOTIFICATION');
      console.log('='.repeat(80));
      console.log(`To:      ${data.to}`);
      console.log(`From:    ${this.fromNumber || 'MOCK_NUMBER'}`);
      console.log(`Time:    ${new Date().toLocaleString()}`);
      console.log(`Message: ${data.message}`);
      console.log('='.repeat(80) + '\n');
      
      return;
    }

    try {
      const message = await this.client.messages.create({
        body: data.message,
        from: this.fromNumber,
        to: data.to,
      });

      logger.info(`SMS sent successfully: ${message.sid}`, {
        to: data.to,
        messageSid: message.sid,
      });
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      throw error;
    }
  }

  async sendSessionReminder(to: string, sessionData: {
    mentorName: string;
    menteeName: string;
    scheduledAt: string;
    topic?: string;
  }, hoursUntil: number): Promise<void> {
    const dateTime = new Date(sessionData.scheduledAt).toLocaleString();
    const message = `Reminder: You have a session with ${sessionData.mentorName} in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''} (${dateTime}). ${sessionData.topic ? `Topic: ${sessionData.topic}` : ''}`;

    await this.sendSMS({
      to,
      message,
    });
  }

  isConfigured(): boolean {
    return this.client !== null;
  }
}

export const smsService = new SMSService();

