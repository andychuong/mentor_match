import { google } from 'googleapis';
import { config } from '../config/env';
import logger from '../utils/logger';

export interface CalendarEventData {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: Array<{ email: string; displayName?: string }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: { type: 'hangoutsMeet' };
    };
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  };
}

export interface CalendarEventResponse {
  id: string;
  htmlLink?: string;
  hangoutLink?: string;
  iCalUID?: string;
  start?: { dateTime: string; timeZone: string };
  end?: { dateTime: string; timeZone: string };
}

export class GoogleCalendarService {
  private oauth2Client: any;

  constructor() {
    if (!config.google.clientId || !config.google.clientSecret) {
      logger.warn('Google Calendar service not configured - credentials missing');
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
  }

  getAuthUrl(state?: string): string {
    if (!this.oauth2Client) {
      throw new Error('Google Calendar service not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state || '',
    });
  }

  async getTokens(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    if (!this.oauth2Client) {
      throw new Error('Google Calendar service not configured');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    };
  }

  private getAuthenticatedClient(accessToken: string, refreshToken?: string) {
    if (!this.oauth2Client) {
      throw new Error('Google Calendar service not configured');
    }

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return this.oauth2Client;
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt?: Date }> {
    if (!this.oauth2Client) {
      throw new Error('Google Calendar service not configured');
    }

    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token,
      expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
    };
  }

  async createEvent(
    accessToken: string,
    refreshToken: string | undefined,
    calendarId: string,
    eventData: CalendarEventData
  ): Promise<CalendarEventResponse> {
    const auth = this.getAuthenticatedClient(accessToken, refreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const response = await calendar.events.insert({
        calendarId: calendarId || 'primary',
        requestBody: eventData,
        conferenceDataVersion: eventData.conferenceData ? 1 : 0,
        sendUpdates: 'all',
      });

      const event = response.data;
      return {
        id: event.id || '',
        htmlLink: event.htmlLink || undefined,
        hangoutLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || undefined,
        iCalUID: event.iCalUID || undefined,
        start: event.start as any,
        end: event.end as any,
      };
    } catch (error: any) {
      logger.error('Failed to create Google Calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  async updateEvent(
    accessToken: string,
    refreshToken: string | undefined,
    calendarId: string,
    eventId: string,
    eventData: Partial<CalendarEventData>
  ): Promise<CalendarEventResponse> {
    const auth = this.getAuthenticatedClient(accessToken, refreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const response = await calendar.events.patch({
        calendarId: calendarId || 'primary',
        eventId,
        requestBody: eventData,
        sendUpdates: 'all',
      });

      const event = response.data;
      return {
        id: event.id || '',
        htmlLink: event.htmlLink || undefined,
        hangoutLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || undefined,
        iCalUID: event.iCalUID || undefined,
        start: event.start as any,
        end: event.end as any,
      };
    } catch (error: any) {
      logger.error('Failed to update Google Calendar event:', error);
      throw new Error(`Failed to update calendar event: ${error.message}`);
    }
  }

  async deleteEvent(
    accessToken: string,
    refreshToken: string | undefined,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    const auth = this.getAuthenticatedClient(accessToken, refreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      await calendar.events.delete({
        calendarId: calendarId || 'primary',
        eventId,
        sendUpdates: 'all',
      });
    } catch (error: any) {
      logger.error('Failed to delete Google Calendar event:', error);
      throw new Error(`Failed to delete calendar event: ${error.message}`);
    }
  }

  async getCalendarList(accessToken: string, refreshToken: string | undefined): Promise<Array<{ id: string; summary: string }>> {
    const auth = this.getAuthenticatedClient(accessToken, refreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const response = await calendar.calendarList.list();
      return (response.data.items || []).map((item) => ({
        id: item.id || '',
        summary: item.summary || '',
      }));
    } catch (error: any) {
      logger.error('Failed to get Google Calendar list:', error);
      throw new Error(`Failed to get calendar list: ${error.message}`);
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();

