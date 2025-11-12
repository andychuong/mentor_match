import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import { usersApi } from '@/api/users';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { User } from '@/types';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { CalendarSettings } from '@/components/CalendarSettings';

export const Profile: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Partial<User>>();

  React.useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userData = await usersApi.getCurrentUser();
      reset({
        profile: userData.profile,
      });
      setUser(userData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: Partial<User>) => {
    setIsSaving(true);
    try {
      const updatedUser = await usersApi.updateCurrentUser(data);
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getSyncStatusIcon = () => {
    if (!user) return null;
    switch (user.airtableSyncStatus) {
      case 'synced':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <Loading message="Loading profile..." />;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-2 text-gray-600">Manage your profile information</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card title="Personal Information">
          <div className="space-y-4">
            <Input
              label="Name"
              defaultValue={user.profile?.name || ''}
              error={errors.profile?.name?.message}
              {...register('profile.name', { required: 'Name is required' })}
            />
            <Input
              label="Email"
              type="email"
              defaultValue={user.email}
              disabled
              className="bg-gray-50"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                className="input min-h-[100px]"
                defaultValue={user.profile?.bio || ''}
                {...register('profile.bio')}
              />
            </div>
          </div>
        </Card>

        {user.role === 'mentor' && (
          <Card title="Expertise Areas">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expertise Areas (comma-separated)
                </label>
                <Input
                  defaultValue={user.profile?.expertiseAreas?.join(', ') || ''}
                  placeholder="e.g., SaaS, B2B, Marketing"
                  {...register('profile.expertiseAreas', {
                    setValueAs: (value: string) => value ? value.split(',').map(a => a.trim()).filter(Boolean) : []
                  })}
                />
              <p className="mt-1 text-sm text-gray-500">
                Enter your areas of expertise separated by commas
              </p>
            </div>
          </Card>
        )}

        {(user.role === 'mentee') && (
          <>
            <Card title="Industry Focus">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry Focus (comma-separated)
                </label>
                <Input
                  defaultValue={user.profile?.industryFocus?.join(', ') || ''}
                  placeholder="e.g., Technology, Healthcare, Finance"
                  {...register('profile.industryFocus', {
                    setValueAs: (value: string) => value ? value.split(',').map(f => f.trim()).filter(Boolean) : []
                  })}
                />
              </div>
            </Card>
            <Card title="Startup Stage">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Startup Stage
                </label>
                <select
                  className="input"
                  defaultValue={user.profile?.startupStage || ''}
                  {...register('profile.startupStage')}
                >
                  <option value="">Select stage</option>
                  <option value="idea">Idea Stage</option>
                  <option value="mvp">MVP</option>
                  <option value="early">Early Stage</option>
                  <option value="growth">Growth Stage</option>
                  <option value="scaling">Scaling</option>
                </select>
              </div>
            </Card>
          </>
        )}

        <Card title="Airtable Sync Status">
          <div className="flex items-center gap-2">
            {getSyncStatusIcon()}
            <span className="text-sm text-gray-700 capitalize">
              {user.airtableSyncStatus}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Your profile sync status with Airtable
          </p>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => reset()}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </form>

      <div className="mt-8">
        <CalendarSettings />
      </div>
    </div>
  );
};

