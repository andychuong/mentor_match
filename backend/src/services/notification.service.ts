import { prisma } from '../config/database';
import { emailService } from './email.service';
import { smsService } from './sms.service';
import { notificationPreferenceService } from './notificationPreference.service';
import logger from '../utils/logger';

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  async createNotification(data: CreateNotificationData) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    // Send email notification (async) with delivery tracking
    this.sendEmailNotification(notification.id, data).catch((error) => {
      logger.error('Failed to send email notification:', error);
    });

    return notification;
  }

  async createNotificationWithDelivery(
    data: CreateNotificationData,
    channel: 'email' | 'sms' | 'push'
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    // Create delivery record
    const delivery = await prisma.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        channel,
        status: 'pending',
      },
    });

    // Send notification based on channel
    if (channel === 'email') {
      this.sendEmailNotificationWithTracking(notification.id, delivery.id, data).catch(
        (error) => {
          logger.error('Failed to send email notification:', error);
        }
      );
    } else if (channel === 'sms') {
      this.sendSMSNotificationWithTracking(notification.id, delivery.id, data).catch(
        (error) => {
          logger.error('Failed to send SMS notification:', error);
        }
      );
    }

    return { notification, delivery };
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        ...n,
        metadata: n.metadata ? JSON.parse(n.metadata) : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found or access denied');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  private async sendEmailNotification(
    notificationId: string,
    data: CreateNotificationData
  ): Promise<void> {
    // Check if user wants email notifications for this type
    const shouldSend = await notificationPreferenceService.shouldSendEmail(data.userId, data.type);
    if (!shouldSend) {
      logger.info(`Email notification skipped for user ${data.userId} - preferences disabled`);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, name: true },
    });

    if (!user) {
      return;
    }

    // Create delivery record
    const delivery = await prisma.notificationDelivery.create({
      data: {
        notificationId,
        channel: 'email',
        status: 'pending',
      },
    });

    try {
      await emailService.sendEmail({
        to: user.email,
        subject: data.title,
        html: `
          <h2>${data.title}</h2>
          <p>${data.message}</p>
          <p>Best regards,<br>Capital Factory Office Hours</p>
        `,
      });

      // Update delivery status to sent
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // Note: In a production system, you'd track actual delivery via webhooks from email service
      // For now, we mark as delivered after a short delay (simulated)
      setTimeout(async () => {
        await prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'delivered',
            deliveredAt: new Date(),
          },
        });
      }, 1000);
    } catch (error) {
      // Update delivery status to failed
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  private async sendEmailNotificationWithTracking(
    _notificationId: string,
    deliveryId: string,
    data: CreateNotificationData
  ): Promise<void> {
    // Check if user wants email notifications for this type
    const shouldSend = await notificationPreferenceService.shouldSendEmail(data.userId, data.type);
    if (!shouldSend) {
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'failed',
          errorMessage: 'Notification disabled by user preferences',
        },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, name: true },
    });

    if (!user) {
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'failed',
          errorMessage: 'User not found',
        },
      });
      return;
    }

    try {
      await emailService.sendEmail({
        to: user.email,
        subject: data.title,
        html: `
          <h2>${data.title}</h2>
          <p>${data.message}</p>
          <p>Best regards,<br>Capital Factory Office Hours</p>
        `,
      });

      // Update delivery status to sent
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // Note: In a production system, you'd track actual delivery via webhooks from email service
      setTimeout(async () => {
        await prisma.notificationDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'delivered',
            deliveredAt: new Date(),
          },
        });
      }, 1000);
    } catch (error) {
      // Update delivery status to failed
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  async getDeliveryStatus(notificationId: string) {
    return prisma.notificationDelivery.findMany({
      where: { notificationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDeliveryStats(userId: string) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      select: { id: true },
    });

    const notificationIds = notifications.map((n) => n.id);

    const deliveries = await prisma.notificationDelivery.findMany({
      where: { notificationId: { in: notificationIds } },
    });

    const stats = {
      total: deliveries.length,
      sent: deliveries.filter((d) => d.status === 'sent').length,
      delivered: deliveries.filter((d) => d.status === 'delivered').length,
      failed: deliveries.filter((d) => d.status === 'failed').length,
      pending: deliveries.filter((d) => d.status === 'pending').length,
      byChannel: {
        email: deliveries.filter((d) => d.channel === 'email').length,
        sms: deliveries.filter((d) => d.channel === 'sms').length,
        push: deliveries.filter((d) => d.channel === 'push').length,
      },
    };

    return stats;
  }

  private async sendSMSNotificationWithTracking(
    _notificationId: string,
    deliveryId: string,
    data: CreateNotificationData
  ): Promise<void> {
    // Check if user wants SMS notifications for this type
    const shouldSend = await notificationPreferenceService.shouldSendSMS(data.userId, data.type);
    if (!shouldSend) {
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'failed',
          errorMessage: 'SMS notification disabled by user preferences',
        },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, name: true },
    });

    if (!user) {
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'failed',
          errorMessage: 'User not found',
        },
      });
      return;
    }

    // Note: In production, you'd store phone numbers in user profile
    // For now, we'll skip if no phone number is available
    const phoneNumber = (user as any).phoneNumber;
    if (!phoneNumber) {
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'failed',
          errorMessage: 'User phone number not available',
        },
      });
      return;
    }

    try {
      await smsService.sendSMS({
        to: phoneNumber,
        message: `${data.title}: ${data.message}`,
      });

      // Update delivery status to sent
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // Mark as delivered after a short delay
      setTimeout(async () => {
        await prisma.notificationDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'delivered',
            deliveredAt: new Date(),
          },
        });
      }, 1000);
    } catch (error) {
      // Update delivery status to failed
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }
}

export const notificationService = new NotificationService();

