import React from 'react';
import { Link } from 'react-router-dom';
import { mentorsApi, MentorFilters } from '@/api/mentors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Mentor } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Star, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export const Mentors: React.FC = () => {
  const [mentors, setMentors] = React.useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<MentorFilters>({
    available: true,
    page: 1,
    limit: 20,
    sort: 'matchScore',
    order: 'desc',
  });
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    loadMentors();
  }, [filters]);

  const loadMentors = async () => {
    setIsLoading(true);
    try {
      const response = await mentorsApi.list(filters);
      // Handle both paginated and array responses
      const mentorsList = response.items || (response as any).data || (Array.isArray(response) ? response : []);
      setMentors(mentorsList);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load mentors');
      setMentors([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof MentorFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  if (isLoading) {
    return <Loading message="Loading mentors..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find Mentors</h1>
        <p className="mt-2 text-gray-600">Browse available mentors and find the perfect match</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card title="Filters">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-10"
                    placeholder="Search mentors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  className="input"
                  value={filters.sort || 'matchScore'}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                >
                  <option value="matchScore">Match Score</option>
                  <option value="rating">Rating</option>
                  <option value="availability">Availability</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.available}
                    onChange={(e) => handleFilterChange('available', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Available only</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={filters.minRating || ''}
                  onChange={(e) => handleFilterChange('minRating', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {mentors.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-600">No mentors found matching your criteria.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mentors.map((mentor) => (
                <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {mentor.profile.name}
                      </h3>
                      {mentor.matchScore !== undefined && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm font-medium">
                            {mentor.matchScore.toFixed(0)}% Match
                          </span>
                        </div>
                      )}
                      {mentor.averageRating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-700">
                            {mentor.averageRating.toFixed(1)} ({mentor.totalSessions || 0} sessions)
                          </span>
                        </div>
                      )}
                    </div>
                    {mentor.profile.profilePictureUrl && (
                      <img
                        src={mentor.profile.profilePictureUrl}
                        alt={mentor.profile.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {mentor.profile.bio}
                  </p>
                  {mentor.profile.expertiseAreas && mentor.profile.expertiseAreas.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {mentor.profile.expertiseAreas.map((area, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  )}
                  {mentor.matchReasoning && (
                    <p className="text-xs text-gray-500 mb-4 italic">
                      "{mentor.matchReasoning}"
                    </p>
                  )}
                  {mentor.availableSlots && mentor.availableSlots.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-2">Available slots:</p>
                      <div className="space-y-1">
                        {mentor.availableSlots.slice(0, 2).map((slot, idx) => (
                          <p key={idx} className="text-xs text-gray-500">
                            {formatDateTime(slot.startTime)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  <Link to={`/mentors/${mentor.id}`}>
                    <Button className="w-full">View Profile & Book Session</Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

