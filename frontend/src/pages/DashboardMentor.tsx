import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { sessionsApi } from '@/api/sessions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { formatDateTime } from '@/lib/utils';
import { Session } from '@/types';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export const DashboardMentor: React.FC = () => {
  const { user } = useAuthStore();
  const [upcomingSessions, setUpcomingSessions] = React.useState<Session[]>([]);
  const [pendingRequests, setPendingRequests] = React.useState<Session[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [upcomingResponse, pendingResponse] = await Promise.all([
        sessionsApi.list({ status: 'confirmed', limit: 5 }).catch(() => ({ items: [], pagination: {} })),
        sessionsApi.list({ status: 'pending', limit: 5 }).catch(() => ({ items: [], pagination: {} })),
      ]);
      setUpcomingSessions(upcomingResponse?.items || upcomingResponse?.data?.items || (Array.isArray(upcomingResponse) ? upcomingResponse : []));
      setPendingRequests(pendingResponse?.items || pendingResponse?.data?.items || (Array.isArray(pendingResponse) ? pendingResponse : []));
    } catch (error: any) {
      console.error('Dashboard load error:', error);
      toast.error(error.message || 'Failed to load dashboard data');
      setUpcomingSessions([]);
      setPendingRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSession = async (sessionId: string) => {
    try {
      await sessionsApi.update(sessionId, { status: 'confirmed' });
      toast.success('Session accepted');
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept session');
    }
  };

  const handleDeclineSession = async (sessionId: string) => {
    try {
      await sessionsApi.cancel(sessionId);
      toast.success('Session declined');
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to decline session');
    }
  };

  if (isLoading) {
    return <Loading message="Loading dashboard..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.profile?.name || (user as any)?.name || user?.email || 'Mentor'}!</h1>
        <p className="mt-2 text-gray-600">Manage your sessions and availability.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Upcoming Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingSessions.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Utilization Rate</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Pending Session Requests">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-900">{session.mentee.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{formatDateTime(session.scheduledAt)}</p>
                    <p className="text-sm text-gray-700 mt-2">{session.topic}</p>
                    {session.matchScore && (
                      <p className="text-xs text-primary-600 mt-1">
                        Match Score: {session.matchScore}%
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptSession(session.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeclineSession(session.id)}
                    >
                      Decline
                    </Button>
                    <Link to={`/sessions/${session.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Upcoming Sessions">
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No upcoming sessions</p>
              <Link to="/availability">
                <Button>Set Availability</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{session.mentee.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{formatDateTime(session.scheduledAt)}</p>
                      <p className="text-sm text-gray-700 mt-2">{session.topic}</p>
                    </div>
                    <Link to={`/sessions/${session.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
              <Link to="/sessions">
                <Button variant="outline" className="w-full">View All Sessions</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link to="/availability">
              <Button className="w-full">Manage Availability</Button>
            </Link>
            <Link to="/sessions">
              <Button variant="outline" className="w-full">All Sessions</Button>
            </Link>
            <Link to="/profile">
              <Button variant="outline" className="w-full">Edit Profile</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

