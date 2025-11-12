import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { feedbackApi, CreateFeedbackData } from '@/api/feedback';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface FeedbackForm extends CreateFeedbackData {
  topicsCoveredString?: string;
}

export const Feedback: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FeedbackForm>();

  const onSubmit = async (data: FeedbackForm) => {
    if (!id) return;
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const topicsCovered = data.topicsCoveredString
        ? data.topicsCoveredString.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined;

      await feedbackApi.create({
        sessionId: id,
        rating,
        writtenFeedback: data.writtenFeedback,
        topicsCovered,
        helpfulnessRating: data.helpfulnessRating,
        wouldRecommend: data.wouldRecommend,
        isAnonymous: data.isAnonymous,
      });
      toast.success('Feedback submitted successfully!');
      navigate('/sessions');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Session Feedback</h1>
        <p className="text-gray-600 mb-6">
          Please share your experience to help us improve the mentorship program.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`p-2 rounded-lg transition-colors ${
                    rating >= value
                      ? 'text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                >
                  <Star className="h-8 w-8 fill-current" />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="mt-2 text-sm text-gray-600">{rating} out of 5 stars</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Written Feedback
            </label>
            <textarea
              className="input min-h-[120px]"
              placeholder="Share your thoughts about the session..."
              {...register('writtenFeedback')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topics Covered (comma-separated)
            </label>
            <Input
              placeholder="e.g., Product strategy, Market analysis, Fundraising"
              {...register('topicsCoveredString')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Helpfulness Rating (1-5)
            </label>
            <Input
              type="number"
              min="1"
              max="5"
              placeholder="Rate how helpful the session was"
              {...register('helpfulnessRating', {
                min: { value: 1, message: 'Rating must be at least 1' },
                max: { value: 5, message: 'Rating must be at most 5' },
              })}
            />
            {errors.helpfulnessRating && (
              <p className="mt-1 text-sm text-red-600">{errors.helpfulnessRating.message}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('wouldRecommend')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">I would recommend this mentor</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isAnonymous')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Submit feedback anonymously</span>
            </label>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/sessions')}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Submit Feedback
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

