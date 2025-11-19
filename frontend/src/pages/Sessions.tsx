import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { sessionsApi } from '@/api/sessions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { formatDateTime } from '@/lib/utils';
import { Session } from '@/types';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const Sessions: React.FC = () => {
  const { user } = useAuthStore();
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>('all');

  React.useEffect(() => {
    loadSessions();
  }, [filter]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const filters: any = { limit: 50 };
      if (filter !== 'all') {
        filters.status = filter;
      }
      const response = await sessionsApi.list(filters);
      setSessions(response.items);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to cancel this session?')) {
      return;
    }
    try {
      await sessionsApi.cancel(sessionId);
      toast.success('Session cancelled');
      loadSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel session');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return <Loading message="Loading sessions..." />;
  }

  const upcomingSessions = sessions.filter(
    (s) => s.status === 'confirmed' && new Date(s.scheduledAt) > new Date()
  );
  const pastSessions = sessions.filter(
    (s) => s.status === 'completed' || new Date(s.scheduledAt) < new Date()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
        <p className="mt-2 text-gray-600">View and manage your mentorship sessions</p>
      </div>

      <div className="mb-6 flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'pending' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'confirmed' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('confirmed')}
        >
          Confirmed
        </Button>
        <Button
          variant={filter === 'completed' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
      </div>

      {upcomingSessions.length > 0 && (
        <Card title="Upcoming Sessions" className="mb-6">
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(session.status)}
                      <h3 className="font-semibold text-gray-900">
                        {user?.role === 'mentor' ? session.mentee.name : session.mentor.name}
                      </h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                        {session.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {formatDateTime(session.scheduledAt)}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">{session.topic}</p>
                    {session.notes && (
                      <p className="text-xs text-gray-500 mt-1">{session.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/sessions/${session.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                    {session.status !== 'completed' && session.status !== 'cancelled' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancel(session.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="All Sessions">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No sessions found</p>
            {user?.role === 'mentee' && (
              <Link to="/mentors">
                <Button>Find a Mentor</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(session.status)}
                      <h3 className="font-semibold text-gray-900">
                        {user?.role === 'mentor' ? session.mentee.name : session.mentor.name}
                      </h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                        {session.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {formatDateTime(session.scheduledAt)}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">{session.topic}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/sessions/${session.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                    {session.status === 'completed' && (
                      <Link to={`/sessions/${session.id}/feedback`}>
                        <Button size="sm">Feedback</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};





