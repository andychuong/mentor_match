import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { mentorsApi } from '@/api/mentors';
import { sessionsApi } from '@/api/sessions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { formatDateTime } from '@/lib/utils';
import { Mentor, TimeSlot } from '@/types';
import { Star, Calendar, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface BookingForm {
  scheduledAt: string;
  topic: string;
  notes?: string;
}

export const MentorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mentor, setMentor] = React.useState<Mentor | null>(null);
  const [availability, setAvailability] = React.useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isBooking, setIsBooking] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingForm>();

  React.useEffect(() => {
    if (id) {
      loadMentorData();
    }
  }, [id]);

  const loadMentorData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [mentorData, availabilityData] = await Promise.all([
        mentorsApi.getById(id),
        mentorsApi.getAvailability(id),
      ]);
      setMentor(mentorData);
      setAvailability(availabilityData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load mentor details');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: BookingForm) => {
    if (!id) return;
    setIsBooking(true);
    try {
      await sessionsApi.create({
        mentorId: id,
        scheduledAt: data.scheduledAt,
        topic: data.topic,
        notes: data.notes,
      });
      toast.success('Session request sent successfully!');
      navigate('/sessions');
    } catch (error: any) {
      toast.error(error.message || 'Failed to book session');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return <Loading message="Loading mentor details..." />;
  }

  if (!mentor) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <p className="text-gray-600">Mentor not found</p>
          <Link to="/mentors">
            <Button className="mt-4">Back to Mentors</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/mentors" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Mentors
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-start gap-4 mb-6">
              {mentor.profile?.profilePictureUrl && (
                <img
                  src={mentor.profile.profilePictureUrl}
                  alt={mentor.profile?.name || 'Mentor'}
                  className="w-24 h-24 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {mentor.profile?.name || 'Mentor'}
                </h1>
                {mentor.matchScore !== undefined && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                      {mentor.matchScore.toFixed(0)}% Match
                    </span>
                  </div>
                )}
                {mentor.averageRating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="text-gray-700 font-medium">
                      {mentor.averageRating.toFixed(1)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      ({mentor.totalSessions || 0} sessions)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-700">{mentor.profile?.bio || 'No bio available'}</p>
            </div>

            {mentor.profile?.expertiseAreas && mentor.profile.expertiseAreas.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Expertise Areas</h2>
                <div className="flex flex-wrap gap-2">
                  {mentor.profile.expertiseAreas.map((area, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {mentor.matchReasoning && (
              <div className="mb-6 p-4 bg-primary-50 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Why this match?</h2>
                <p className="text-gray-700 italic">"{mentor.matchReasoning}"</p>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card title="Book a Session">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Date & Time
                </label>
                <Input
                  type="datetime-local"
                  error={errors.scheduledAt?.message}
                  {...register('scheduledAt', { required: 'Date and time is required' })}
                />
                {availability.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-2">Available slots:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {availability.map((slot, idx) => {
                        try {
                          const slotDate = new Date(slot.startTime);
                          if (isNaN(slotDate.getTime())) {
                            return null;
                          }
                          const localDate = new Date(slotDate.getTime() - slotDate.getTimezoneOffset() * 60000);
                          return (
                            <button
                              key={idx}
                              type="button"
                              className="text-xs text-primary-600 hover:text-primary-700 block"
                              onClick={() => {
                                const input = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
                                if (input) {
                                  input.value = localDate.toISOString().slice(0, 16);
                                }
                              }}
                            >
                              {formatDateTime(slot.startTime)}
                            </button>
                          );
                        } catch (error) {
                          console.error('Error formatting slot:', error, slot);
                          return null;
                        }
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Topic
                </label>
                <Input
                  placeholder="What would you like to discuss?"
                  error={errors.topic?.message}
                  {...register('topic', { required: 'Topic is required' })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="Any additional information..."
                  {...register('notes')}
                />
              </div>
              <Button type="submit" className="w-full" isLoading={isBooking}>
                Request Session
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

