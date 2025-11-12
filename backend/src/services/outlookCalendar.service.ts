import { Client } from '@microsoft/microsoft-graph-client';
import { config } from '../config/env';
import logger from '../utils/logger';

export interface CalendarEventData {
  subject: string;
  body?: { contentType: string; content: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: Array<{ emailAddress: { address: string; name?: string }; type: string }>;
  isOnlineMeeting?: boolean;
  onlineMeetingProvider?: 'teamsForBusiness';
  reminderMinutesBeforeStart?: number;
}

export interface CalendarEventResponse {
  id: string;
  webLink?: string;
  onlineMeetingUrl?: string;
  iCalUId?: string;
  start?: { dateTime: string; timeZone: string };
  end?: { dateTime: string; timeZone: string };
}

export class OutlookCalendarService {
  private clientId: string;
  private clientSecret: string;
  private tenantId: string;
  private redirectUri: string;

  constructor() {
    this.clientId = config.microsoft.clientId;
    this.clientSecret = config.microsoft.clientSecret;
    this.tenantId = config.microsoft.tenantId;
    this.redirectUri = config.microsoft.redirectUri;

    if (!this.clientId || !this.clientSecret) {
      logger.warn('Outlook Calendar service not configured - credentials missing');
    }
  }

  getAuthUrl(state?: string): string {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Outlook Calendar service not configured');
    }

    const scopes = ['Calendars.ReadWrite', 'offline_access'];
    const scopeString = scopes.join(' ');
    const encodedState = encodeURIComponent(state || '');
    const encodedRedirect = encodeURIComponent(this.redirectUri);

    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${this.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodedRedirect}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent(scopeString)}&` +
      `state=${encodedState}`;
  }

  async getTokens(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Outlook Calendar service not configured');
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
      scope: 'Calendars.ReadWrite offline_access',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get tokens: ${error}`);
    }

    const tokens = await response.json() as any;
    const expiresIn = tokens.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt?: Date }> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Outlook Calendar service not configured');
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'Calendars.ReadWrite offline_access',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const tokens = await response.json() as any;
    const expiresIn = tokens.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      accessToken: tokens.access_token,
      expiresAt,
    };
  }

  private getAuthenticatedClient(accessToken: string): Client {
    const authProvider = {
      getAccessToken: async () => accessToken,
    };

    return Client.initWithMiddleware({
      authProvider: authProvider as any,
    });
  }

  async createEvent(
    accessToken: string,
    calendarId: string,
    eventData: CalendarEventData
  ): Promise<CalendarEventResponse> {
    const client = this.getAuthenticatedClient(accessToken);
    const calendarPath = calendarId === 'primary' || !calendarId ? '/me/calendar/events' : `/me/calendars/${calendarId}/events`;

    try {
      const event = await client.api(calendarPath).post({
        ...eventData,
        isOnlineMeeting: eventData.isOnlineMeeting ?? true,
        onlineMeetingProvider: eventData.onlineMeetingProvider || 'teamsForBusiness',
      });

      return {
        id: event.id,
        webLink: event.webLink,
        onlineMeetingUrl: event.onlineMeeting?.joinUrl,
        iCalUId: event.iCalUId,
        start: event.start,
        end: event.end,
      };
    } catch (error: any) {
      logger.error('Failed to create Outlook Calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  async updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    eventData: Partial<CalendarEventData>
  ): Promise<CalendarEventResponse> {
    const client = this.getAuthenticatedClient(accessToken);
    const calendarPath = calendarId === 'primary' || !calendarId
      ? `/me/calendar/events/${eventId}`
      : `/me/calendars/${calendarId}/events/${eventId}`;

    try {
      const event = await client.api(calendarPath).patch(eventData);

      return {
        id: event.id,
        webLink: event.webLink,
        onlineMeetingUrl: event.onlineMeeting?.joinUrl,
        iCalUId: event.iCalUId,
        start: event.start,
        end: event.end,
      };
    } catch (error: any) {
      logger.error('Failed to update Outlook Calendar event:', error);
      throw new Error(`Failed to update calendar event: ${error.message}`);
    }
  }

  async deleteEvent(accessToken: string, calendarId: string, eventId: string): Promise<void> {
    const client = this.getAuthenticatedClient(accessToken);
    const calendarPath = calendarId === 'primary' || !calendarId
      ? `/me/calendar/events/${eventId}`
      : `/me/calendars/${calendarId}/events/${eventId}`;

    try {
      await client.api(calendarPath).delete();
    } catch (error: any) {
      logger.error('Failed to delete Outlook Calendar event:', error);
      throw new Error(`Failed to delete calendar event: ${error.message}`);
    }
  }

  async getCalendarList(accessToken: string): Promise<Array<{ id: string; name: string }>> {
    const client = this.getAuthenticatedClient(accessToken);

    try {
      const response = await client.api('/me/calendars').get();
      return (response.value || []).map((calendar: any) => ({
        id: calendar.id,
        name: calendar.name,
      }));
    } catch (error: any) {
      logger.error('Failed to get Outlook Calendar list:', error);
      throw new Error(`Failed to get calendar list: ${error.message}`);
    }
  }
}

export const outlookCalendarService = new OutlookCalendarService();

