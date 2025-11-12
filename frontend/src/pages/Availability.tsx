import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import { mentorsApi } from '@/api/mentors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { TimeSlot } from '@/types';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Calendar, Plus, Trash2 } from 'lucide-react';

interface AvailabilityForm {
  startTime: string;
  endTime: string;
}

export const Availability: React.FC = () => {
  const { user } = useAuthStore();
  const [availability, setAvailability] = React.useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AvailabilityForm>();

  React.useEffect(() => {
    if (user?.id) {
      loadAvailability();
    }
  }, [user]);

  const loadAvailability = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const slots = await mentorsApi.getAvailability(user.id);
      setAvailability(slots);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load availability');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: AvailabilityForm) => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const newSlot: TimeSlot = {
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      };
      const updatedSlots = [...availability, newSlot];
      await mentorsApi.setAvailability(user.id, updatedSlots);
      setAvailability(updatedSlots);
      reset();
      toast.success('Availability slot added');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add availability slot');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (index: number) => {
    if (!user?.id) return;
    if (!window.confirm('Are you sure you want to remove this availability slot?')) {
      return;
    }
    try {
      const updatedSlots = availability.filter((_, i) => i !== index);
      await mentorsApi.setAvailability(user.id, updatedSlots);
      setAvailability(updatedSlots);
      toast.success('Availability slot removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove availability slot');
    }
  };

  const handleSaveAll = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await mentorsApi.setAvailability(user.id, availability);
      toast.success('Availability saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save availability');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loading message="Loading availability..." />;
  }

  if (user?.role !== 'mentor') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <p className="text-gray-600">This page is only available for mentors.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Availability</h1>
        <p className="mt-2 text-gray-600">Set your available time slots for mentorship sessions</p>
      </div>

      <Card title="Add Availability Slot" className="mb-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="datetime-local"
              error={errors.startTime?.message}
              {...register('startTime', { required: 'Start time is required' })}
            />
            <Input
              label="End Time"
              type="datetime-local"
              error={errors.endTime?.message}
              {...register('endTime', { required: 'End time is required' })}
            />
          </div>
          <Button type="submit" isLoading={isSaving}>
            <Plus className="h-4 w-4 mr-2" />
            Add Slot
          </Button>
        </form>
      </Card>

      <Card title="Your Availability Slots">
        {availability.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No availability slots set</p>
            <p className="text-sm text-gray-500">Add slots above to make yourself available for sessions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {availability.map((slot, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(slot.startTime)}
                  </p>
                  <p className="text-sm text-gray-600">
                    to {formatDateTime(slot.endTime)}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            ))}
            <div className="pt-4 border-t border-gray-200">
              <Button onClick={handleSaveAll} isLoading={isSaving}>
                Save All Changes
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

