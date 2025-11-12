import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { sessionsApi } from '@/api/sessions';
import { mentorsApi } from '@/api/mentors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { formatDateTime } from '@/lib/utils';
import { Session, Mentor } from '@/types';
import { Calendar, Users, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export const DashboardMentee: React.FC = () => {
  const { user } = useAuthStore();
  const [upcomingSessions, setUpcomingSessions] = React.useState<Session[]>([]);
  const [recommendedMentors, setRecommendedMentors] = React.useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [sessionsResponse, mentorsResponse] = await Promise.all([
        sessionsApi.list({ status: 'confirmed', limit: 5 }).catch(() => ({ items: [], pagination: {} })),
        mentorsApi.list({ available: true, limit: 3, sort: 'matchScore', order: 'desc' }).catch(() => ({ items: [], pagination: {} })),
      ]);
      setUpcomingSessions(sessionsResponse?.items || sessionsResponse?.data?.items || (Array.isArray(sessionsResponse) ? sessionsResponse : []));
      setRecommendedMentors(mentorsResponse?.items || mentorsResponse?.data?.items || (Array.isArray(mentorsResponse) ? mentorsResponse : []));
    } catch (error: any) {
      console.error('Dashboard load error:', error);
      toast.error(error.message || 'Failed to load dashboard data');
      setUpcomingSessions([]);
      setRecommendedMentors([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading message="Loading dashboard..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.profile?.name || (user as any)?.name || user?.email || 'Mentee'}!</h1>
        <p className="mt-2 text-gray-600">Find mentors and book sessions to get the guidance you need.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Upcoming Sessions">
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No upcoming sessions</p>
                <Link to="/mentors">
                  <Button>Find a Mentor</Button>
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
                        <h4 className="font-semibold text-gray-900">{session.mentor?.name || 'Unknown Mentor'}</h4>
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

          <Card title="Recommended Mentors">
            {recommendedMentors.length === 0 ? (
              <p className="text-gray-600">No mentors available at the moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{mentor.profile.name}</h4>
                        {mentor.matchScore && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium text-primary-600">
                              {mentor.matchScore.toFixed(0)}% Match
                            </span>
                          </div>
                        )}
                      </div>
                      {mentor.averageRating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-700">{mentor.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{mentor.profile.bio}</p>
                    {mentor.profile.expertiseAreas && mentor.profile.expertiseAreas.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {mentor.profile.expertiseAreas.slice(0, 3).map((area, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link to={`/mentors/${mentor.id}`}>
                      <Button size="sm" className="w-full">View Profile</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link to="/mentors">
                <Button variant="outline" className="w-full">Browse All Mentors</Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Quick Actions">
            <div className="space-y-3">
              <Link to="/mentors">
                <Button className="w-full">Find Mentors</Button>
              </Link>
              <Link to="/sessions">
                <Button variant="outline" className="w-full">My Sessions</Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline" className="w-full">Edit Profile</Button>
              </Link>
            </div>
          </Card>

          <Card title="Stats">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed Sessions</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

