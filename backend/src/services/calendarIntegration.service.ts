import { prisma } from '../config/database';
import { googleCalendarService } from './googleCalendar.service';
import { outlookCalendarService } from './outlookCalendar.service';
import { AppError, errorCodes } from '../utils/errors';
import logger from '../utils/logger';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class CalendarIntegrationService {
  async getIntegration(userId: string, provider: 'google' | 'outlook') {
    return prisma.calendarIntegration.findUnique({
      where: { userId_provider: { userId, provider } },
    });
  }

  async createOrUpdateIntegration(
    userId: string,
    provider: 'google' | 'outlook',
    accessToken: string,
    refreshToken: string | undefined,
    expiresAt: Date | undefined,
    calendarId?: string
  ) {
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

    return prisma.calendarIntegration.upsert({
      where: { userId_provider: { userId, provider } },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        calendarId: calendarId || undefined,
        isEnabled: true,
        syncEnabled: true,
        lastSyncAt: new Date(),
      },
      create: {
        userId,
        provider,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        calendarId: calendarId || undefined,
        isEnabled: true,
        syncEnabled: true,
      },
    });
  }

  async refreshTokenIfNeeded(integration: any): Promise<{ accessToken: string; expiresAt?: Date } | null> {
    if (!integration.tokenExpiresAt || new Date() < integration.tokenExpiresAt) {
      return null; // Token still valid
    }

    if (!integration.refreshToken) {
      throw new AppError(400, errorCodes.AUTH_INVALID, 'Refresh token not available');
    }

    const decryptedRefreshToken = decrypt(integration.refreshToken);

    if (integration.provider === 'google') {
      const tokens = await googleCalendarService.refreshAccessToken(decryptedRefreshToken);
      const encryptedAccessToken = encrypt(tokens.accessToken);

      await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken: encryptedAccessToken,
          tokenExpiresAt: tokens.expiresAt,
        },
      });

      return tokens;
    } else if (integration.provider === 'outlook') {
      const tokens = await outlookCalendarService.refreshAccessToken(decryptedRefreshToken);
      const encryptedAccessToken = encrypt(tokens.accessToken);

      await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken: encryptedAccessToken,
          tokenExpiresAt: tokens.expiresAt,
        },
      });

      return tokens;
    }

    return null;
  }

  async syncSessionToCalendar(sessionId: string): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        mentor: { select: { id: true, email: true, name: true } },
        mentee: { select: { id: true, email: true, name: true } },
        calendarEvents: {
          include: {
            calendarIntegration: true,
          },
        },
      },
    }) as any; // Type assertion needed until Prisma client regenerates

    if (!session) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Session not found');
    }

    // Get calendar integrations for both mentor and mentee
    const mentorIntegrations = await prisma.calendarIntegration.findMany({
      where: {
        userId: session.mentorId,
        isEnabled: true,
        syncEnabled: true,
      },
    });

    const menteeIntegrations = await prisma.calendarIntegration.findMany({
      where: {
        userId: session.menteeId,
        isEnabled: true,
        syncEnabled: true,
      },
    });

    const allIntegrations = [...mentorIntegrations, ...menteeIntegrations];

    for (const integration of allIntegrations) {
      try {
        // Refresh token if needed
        await this.refreshTokenIfNeeded(integration);

        // Get updated integration after potential token refresh
        const updatedIntegration = await prisma.calendarIntegration.findUnique({
          where: { id: integration.id },
        });

        if (!updatedIntegration) continue;

        const decryptedAccessToken = decrypt(updatedIntegration.accessToken);
        const decryptedRefreshToken = updatedIntegration.refreshToken ? decrypt(updatedIntegration.refreshToken) : undefined;

        const startTime = new Date(session.scheduledAt);
        const endTime = new Date(startTime.getTime() + session.durationMinutes * 60 * 1000);

        const eventData = {
          summary: `Mentorship Session: ${session.topic || 'Office Hours'}`,
          description: `Mentorship session between ${session.mentor.name || session.mentor.email} and ${session.mentee.name || session.mentee.email}.\n\nTopic: ${session.topic || 'N/A'}\nNotes: ${session.notes || 'N/A'}`,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          attendees: [
            { email: session.mentor.email, displayName: session.mentor.name || undefined },
            { email: session.mentee.email, displayName: session.mentee.name || undefined },
          ],
        };

        let eventResponse: any;
        let meetingLink: string | undefined;

        if (updatedIntegration.provider === 'google') {
          // Add Google Meet conference
          const googleEventData = {
            ...eventData,
            conferenceData: {
              createRequest: {
                requestId: session.id,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 24 * 60 }, // 24 hours
                { method: 'popup', minutes: 60 }, // 1 hour
              ],
            },
          };

          const existingEvent = session.calendarEvents.find(
            (e: any) => e.calendarIntegrationId === updatedIntegration.id
          );

          if (existingEvent) {
            eventResponse = await googleCalendarService.updateEvent(
              decryptedAccessToken,
              decryptedRefreshToken,
              updatedIntegration.calendarId || 'primary',
              existingEvent.eventId,
              googleEventData as any
            );
          } else {
            eventResponse = await googleCalendarService.createEvent(
              decryptedAccessToken,
              decryptedRefreshToken,
              updatedIntegration.calendarId || 'primary',
              googleEventData as any
            );
          }

          meetingLink = eventResponse.hangoutLink;
        } else if (updatedIntegration.provider === 'outlook') {
          const outlookEventData = {
            subject: eventData.summary,
            body: {
              contentType: 'HTML',
              content: eventData.description.replace(/\n/g, '<br>'),
            },
            start: eventData.start,
            end: eventData.end,
            attendees: eventData.attendees.map((a) => ({
              emailAddress: { address: a.email, name: a.displayName },
              type: 'required',
            })),
            isOnlineMeeting: true,
            onlineMeetingProvider: 'teamsForBusiness' as const,
            reminderMinutesBeforeStart: 60,
          };

          const existingEvent = session.calendarEvents.find(
            (e: any) => e.calendarIntegrationId === updatedIntegration.id
          );

          if (existingEvent) {
            eventResponse = await outlookCalendarService.updateEvent(
              decryptedAccessToken,
              updatedIntegration.calendarId || 'primary',
              existingEvent.eventId,
              outlookEventData
            );
          } else {
            eventResponse = await outlookCalendarService.createEvent(
              decryptedAccessToken,
              updatedIntegration.calendarId || 'primary',
              outlookEventData
            );
          }

          meetingLink = eventResponse.onlineMeetingUrl;
        }

        // Find existing event for this integration
        const existingEvent = session.calendarEvents.find(
          (e: any) => e.calendarIntegrationId === updatedIntegration.id
        );

        // Store or update calendar event
        if (existingEvent) {
          await prisma.calendarEvent.update({
            where: { id: existingEvent.id },
            data: {
              htmlLink: eventResponse.htmlLink || eventResponse.webLink,
              iCalUID: eventResponse.iCalUID || eventResponse.iCalUId,
            },
          });
        } else {
          await prisma.calendarEvent.create({
            data: {
              sessionId: session.id,
              calendarIntegrationId: updatedIntegration.id,
              eventId: eventResponse.id,
              provider: updatedIntegration.provider,
              calendarId: updatedIntegration.calendarId || 'primary',
              htmlLink: eventResponse.htmlLink || eventResponse.webLink,
              iCalUID: eventResponse.iCalUID || eventResponse.iCalUId,
            },
          });
        }

        // Update session with Google Meet link if it's a Google calendar
        if (updatedIntegration.provider === 'google' && meetingLink && !session.googleMeetLink) {
          await prisma.session.update({
            where: { id: session.id },
            data: { googleMeetLink: meetingLink },
          });
        }
      } catch (error: any) {
        logger.error(`Failed to sync session ${sessionId} to calendar:`, error);
        // Continue with other integrations even if one fails
      }
    }
  }

  async deleteSessionFromCalendar(sessionId: string): Promise<void> {
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: { sessionId },
      include: { calendarIntegration: true },
    });

    for (const calendarEvent of calendarEvents) {
      try {
        const integration = calendarEvent.calendarIntegration;
        await this.refreshTokenIfNeeded(integration);

        // Get updated integration after potential token refresh
        const updatedIntegration = await prisma.calendarIntegration.findUnique({
          where: { id: integration.id },
        });

        if (!updatedIntegration) continue;

        const decryptedAccessToken = decrypt(updatedIntegration.accessToken);
        const decryptedRefreshToken = updatedIntegration.refreshToken ? decrypt(updatedIntegration.refreshToken) : undefined;

        if (updatedIntegration.provider === 'google') {
          await googleCalendarService.deleteEvent(
            decryptedAccessToken,
            decryptedRefreshToken,
            updatedIntegration.calendarId || 'primary',
            calendarEvent.eventId
          );
        } else if (updatedIntegration.provider === 'outlook') {
          await outlookCalendarService.deleteEvent(
            decryptedAccessToken,
            updatedIntegration.calendarId || 'primary',
            calendarEvent.eventId
          );
        }

        await prisma.calendarEvent.delete({
          where: { id: calendarEvent.id },
        });
      } catch (error: any) {
        logger.error(`Failed to delete calendar event ${calendarEvent.id}:`, error);
        // Continue with other events even if one fails
      }
    }
  }

  async disableIntegration(userId: string, provider: 'google' | 'outlook'): Promise<void> {
    await prisma.calendarIntegration.updateMany({
      where: { userId, provider },
      data: { isEnabled: false },
    });
  }

  async enableIntegration(userId: string, provider: 'google' | 'outlook'): Promise<void> {
    await prisma.calendarIntegration.updateMany({
      where: { userId, provider },
      data: { isEnabled: true },
    });
  }

  async toggleSync(userId: string, provider: 'google' | 'outlook', enabled: boolean): Promise<void> {
    await prisma.calendarIntegration.updateMany({
      where: { userId, provider },
      data: { syncEnabled: enabled },
    });
  }
}

export const calendarIntegrationService = new CalendarIntegrationService();

