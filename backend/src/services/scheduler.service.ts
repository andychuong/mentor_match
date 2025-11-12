import { prisma } from '../config/database';
import { emailService } from './email.service';
import { smsService } from './sms.service';
import { notificationService } from './notification.service';
import { notificationPreferenceService } from './notificationPreference.service';
import logger from '../utils/logger';

export class SchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

  start() {
    logger.info('Starting scheduler service for session reminders');
    
    // Run immediately on start
    this.checkAndSendReminders();

    // Then run every 5 minutes
    this.intervalId = setInterval(() => {
      this.checkAndSendReminders();
    }, this.CHECK_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Scheduler service stopped');
    }
  }

  private async checkAndSendReminders() {
    try {
      const now = new Date();
      
      // Check for 24-hour reminders (23.5 to 24.5 hours before)
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const twentyFourHoursStart = new Date(twentyFourHoursFromNow.getTime() - 30 * 60 * 1000);
      const twentyFourHoursEnd = new Date(twentyFourHoursFromNow.getTime() + 30 * 60 * 1000);

      // Check for 1-hour reminders (0.5 to 1.5 hours before)
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const oneHourStart = new Date(oneHourFromNow.getTime() - 30 * 60 * 1000);
      const oneHourEnd = new Date(oneHourFromNow.getTime() + 30 * 60 * 1000);

      // Find sessions that need 24-hour reminders
      const sessions24h = await prisma.session.findMany({
        where: {
          status: { in: ['pending', 'confirmed'] },
          scheduledAt: {
            gte: twentyFourHoursStart,
            lte: twentyFourHoursEnd,
          },
        },
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          mentee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Find sessions that need 1-hour reminders
      const sessions1h = await prisma.session.findMany({
        where: {
          status: { in: ['pending', 'confirmed'] },
          scheduledAt: {
            gte: oneHourStart,
            lte: oneHourEnd,
          },
        },
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          mentee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Send 24-hour reminders
      for (const session of sessions24h) {
        await this.sendReminder(session, 24);
      }

      // Send 1-hour reminders
      for (const session of sessions1h) {
        await this.sendReminder(session, 1);
      }

      if (sessions24h.length > 0 || sessions1h.length > 0) {
        logger.info(`Sent ${sessions24h.length} 24h reminders and ${sessions1h.length} 1h reminders`);
      }
    } catch (error) {
      logger.error('Error in scheduler service:', error);
    }
  }

  private async sendReminder(
    session: {
      id: string;
      scheduledAt: Date;
      durationMinutes: number;
      topic: string | null;
      mentor: { id: string; name: string | null; email: string };
      mentee: { id: string; name: string | null; email: string };
    },
    hoursUntil: number
  ) {
    try {
      // Check if reminder was already sent (by checking notifications)
      const existingReminder = await prisma.notification.findFirst({
        where: {
          userId: { in: [session.mentor.id, session.mentee.id] },
          type: 'session_reminder',
          metadata: {
            contains: session.id,
          },
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Within last hour
          },
        },
      });

      if (existingReminder) {
        return; // Already sent
      }

      const sessionData = {
        mentorName: session.mentor.name || session.mentor.email,
        menteeName: session.mentee.name || session.mentee.email,
        scheduledAt: session.scheduledAt.toISOString(),
        durationMinutes: session.durationMinutes,
        topic: session.topic || undefined,
      };

      // Send email reminders to both mentor and mentee
      const emailPromises = [
        emailService.sendSessionReminder(session.mentor.email, sessionData, hoursUntil).catch(
          (err) => {
            logger.error(`Failed to send email to mentor: ${err}`);
            return Promise.resolve();
          }
        ),
        emailService.sendSessionReminder(session.mentee.email, sessionData, hoursUntil).catch(
          (err) => {
            logger.error(`Failed to send email to mentee: ${err}`);
            return Promise.resolve();
          }
        ),
      ];

      // Send SMS reminders if enabled
      const smsPromises: Promise<void>[] = [];
      
      // Check mentor SMS preferences
      const mentorWantsSMS = await notificationPreferenceService.shouldSendSMS(
        session.mentor.id,
        'session_reminder'
      );
      if (mentorWantsSMS && (session.mentor as any).phoneNumber) {
        smsPromises.push(
          smsService
            .sendSessionReminder(
              (session.mentor as any).phoneNumber,
              sessionData,
              hoursUntil
            )
            .catch((err) => {
              logger.error(`Failed to send SMS to mentor: ${err}`);
              return Promise.resolve();
            })
        );
      }

      // Check mentee SMS preferences
      const menteeWantsSMS = await notificationPreferenceService.shouldSendSMS(
        session.mentee.id,
        'session_reminder'
      );
      if (menteeWantsSMS && (session.mentee as any).phoneNumber) {
        smsPromises.push(
          smsService
            .sendSessionReminder(
              (session.mentee as any).phoneNumber,
              sessionData,
              hoursUntil
            )
            .catch((err) => {
              logger.error(`Failed to send SMS to mentee: ${err}`);
              return Promise.resolve();
            })
        );
      }

      await Promise.all([...emailPromises, ...smsPromises]);

      // Create notifications for both users
      await Promise.all([
        notificationService.createNotification({
          userId: session.mentor.id,
          type: 'session_reminder',
          title: `Session Reminder - ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''} until session`,
          message: `You have a session with ${sessionData.menteeName} in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}.`,
          metadata: { sessionId: session.id, hoursUntil },
        }),
        notificationService.createNotification({
          userId: session.mentee.id,
          type: 'session_reminder',
          title: `Session Reminder - ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''} until session`,
          message: `You have a session with ${sessionData.mentorName} in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}.`,
          metadata: { sessionId: session.id, hoursUntil },
        }),
      ]);
    } catch (error) {
      logger.error(`Error sending reminder for session ${session.id}:`, error);
    }
  }
}

export const schedulerService = new SchedulerService();

