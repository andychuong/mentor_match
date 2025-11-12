import { prisma } from '../config/database';

export interface UpdateNotificationPreferenceData {
  emailEnabled?: boolean;
  emailSessionConfirmation?: boolean;
  emailSessionReminder?: boolean;
  emailSessionCancellation?: boolean;
  emailSessionRequest?: boolean;
  emailFeedbackConfirmation?: boolean;
  smsEnabled?: boolean;
  smsSessionReminder?: boolean;
}

export class NotificationPreferenceService {
  async getPreferences(userId: string) {
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId,
        },
      });
    }

    return preferences;
  }

  async updatePreferences(userId: string, data: UpdateNotificationPreferenceData) {
    const existing = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (existing) {
      return prisma.notificationPreference.update({
        where: { userId },
        data,
      });
    }

    return prisma.notificationPreference.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  async shouldSendEmail(userId: string, notificationType: string): Promise<boolean> {
    const preferences = await this.getPreferences(userId);

    if (!preferences.emailEnabled) {
      return false;
    }

    switch (notificationType) {
      case 'session_confirmation':
        return preferences.emailSessionConfirmation;
      case 'session_reminder':
        return preferences.emailSessionReminder;
      case 'session_cancellation':
        return preferences.emailSessionCancellation;
      case 'session_request':
        return preferences.emailSessionRequest;
      case 'feedback_confirmation':
        return preferences.emailFeedbackConfirmation;
      default:
        return true; // Default to sending if type not specified
    }
  }

  async shouldSendSMS(userId: string, notificationType: string): Promise<boolean> {
    const preferences = await this.getPreferences(userId);

    if (!preferences.smsEnabled) {
      return false;
    }

    switch (notificationType) {
      case 'session_reminder':
        return preferences.smsSessionReminder;
      default:
        return false;
    }
  }
}

export const notificationPreferenceService = new NotificationPreferenceService();

