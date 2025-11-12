import React from 'react';
import { Button } from '@/components/ui/Button';
import { Calendar, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { calendarApi, CalendarIntegration } from '@/api/calendar';
import toast from 'react-hot-toast';

export const CalendarSettings: React.FC = () => {
  const [integrations, setIntegrations] = React.useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [connecting, setConnecting] = React.useState<'google' | 'outlook' | null>(null);

  const loadIntegrations = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await calendarApi.getIntegrations();
      setIntegrations(data);
    } catch (error: any) {
      toast.error('Failed to load calendar integrations');
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const handleConnect = async (provider: 'google' | 'outlook') => {
    try {
      setConnecting(provider);
      const authUrl = provider === 'google'
        ? await calendarApi.getGoogleAuthUrl()
        : await calendarApi.getOutlookAuthUrl();

      // Open OAuth flow in new window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        `${provider}CalendarAuth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'calendar-oauth-callback') {
          window.removeEventListener('message', messageListener);
          popup?.close();

          try {
            if (provider === 'google') {
              await calendarApi.connectGoogle(event.data.code, event.data.calendarId);
            } else {
              await calendarApi.connectOutlook(event.data.code, event.data.calendarId);
            }

            toast.success(`${provider === 'google' ? 'Google' : 'Outlook'} Calendar connected successfully`);
            await loadIntegrations();
          } catch (error: any) {
            toast.error(`Failed to connect ${provider === 'google' ? 'Google' : 'Outlook'} Calendar`);
            console.error('Connection error:', error);
          } finally {
            setConnecting(null);
          }
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setConnecting(null);
        }
      }, 1000);
    } catch (error: any) {
      toast.error(`Failed to start ${provider === 'google' ? 'Google' : 'Outlook'} Calendar connection`);
      console.error('Auth URL error:', error);
      setConnecting(null);
    }
  };

  const handleToggleSync = async (provider: 'google' | 'outlook', enabled: boolean) => {
    try {
      await calendarApi.toggleSync(provider, enabled);
      toast.success(`Calendar sync ${enabled ? 'enabled' : 'disabled'}`);
      await loadIntegrations();
    } catch (error: any) {
      toast.error('Failed to toggle sync');
      console.error('Toggle sync error:', error);
    }
  };

  const handleDisconnect = async (provider: 'google' | 'outlook') => {
    if (!confirm(`Are you sure you want to disconnect ${provider === 'google' ? 'Google' : 'Outlook'} Calendar?`)) {
      return;
    }

    try {
      await calendarApi.disconnect(provider);
      toast.success(`${provider === 'google' ? 'Google' : 'Outlook'} Calendar disconnected`);
      await loadIntegrations();
    } catch (error: any) {
      toast.error('Failed to disconnect calendar');
      console.error('Disconnect error:', error);
    }
  };

  const googleIntegration = integrations.find((i) => i.provider === 'google');
  const outlookIntegration = integrations.find((i) => i.provider === 'outlook');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-primary-600" />
        <span className="ml-2">Loading calendar settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Calendar Integration</h2>
        <p className="text-gray-600">
          Connect your calendar to automatically sync mentorship sessions. Sessions will be added to your calendar
          with meeting links when confirmed.
        </p>
      </div>

      {/* Google Calendar */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-lg">Google Calendar</h3>
              <p className="text-sm text-gray-600">
                Sync sessions to your Google Calendar with Google Meet links
              </p>
            </div>
          </div>
          {googleIntegration ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
          ) : (
            <Button
              onClick={() => handleConnect('google')}
              disabled={connecting === 'google'}
              size="sm"
            >
              {connecting === 'google' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Google Calendar
                </>
              )}
            </Button>
          )}
        </div>

        {googleIntegration && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sync Enabled</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={googleIntegration.syncEnabled}
                  onChange={(e) => handleToggleSync('google', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            {googleIntegration.lastSyncAt && (
              <div className="text-sm text-gray-500">
                Last synced: {new Date(googleIntegration.lastSyncAt).toLocaleString()}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDisconnect('google')}
              className="mt-2"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        )}
      </div>

      {/* Outlook Calendar */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-lg">Outlook Calendar</h3>
              <p className="text-sm text-gray-600">
                Sync sessions to your Outlook Calendar with Teams meeting links
              </p>
            </div>
          </div>
          {outlookIntegration ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
          ) : (
            <Button
              onClick={() => handleConnect('outlook')}
              disabled={connecting === 'outlook'}
              size="sm"
            >
              {connecting === 'outlook' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Outlook Calendar
                </>
              )}
            </Button>
          )}
        </div>

        {outlookIntegration && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sync Enabled</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={outlookIntegration.syncEnabled}
                  onChange={(e) => handleToggleSync('outlook', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            {outlookIntegration.lastSyncAt && (
              <div className="text-sm text-gray-500">
                Last synced: {new Date(outlookIntegration.lastSyncAt).toLocaleString()}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDisconnect('outlook')}
              className="mt-2"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">How it works</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Sessions are automatically synced to your connected calendars when confirmed</li>
          <li>Google Calendar sessions include Google Meet links</li>
          <li>Outlook Calendar sessions include Teams meeting links</li>
          <li>You can toggle sync on/off without disconnecting</li>
          <li>Calendar events are updated when session details change</li>
        </ul>
      </div>
    </div>
  );
};

