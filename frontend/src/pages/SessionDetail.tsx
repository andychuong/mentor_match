import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { sessionsApi } from '@/api/sessions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { formatDateTime } from '@/lib/utils';
import { Session } from '@/types';
import { ArrowLeft, Calendar, Clock, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export const SessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [session, setSession] = React.useState<Session | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditingNotes, setIsEditingNotes] = React.useState(false);
  const [editedNotes, setEditedNotes] = React.useState('');
  const [isSavingNotes, setIsSavingNotes] = React.useState(false);

  const isMentor = user?.id === session?.mentorId;
  const isMentee = user?.id === session?.menteeId;

  React.useEffect(() => {
    if (id) {
      loadSession();
    }
  }, [id]);

  const loadSession = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const sessionData = await sessionsApi.getById(id);
      setSession(sessionData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load session details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!session || !window.confirm('Are you sure you want to cancel this session?')) {
      return;
    }
    try {
      await sessionsApi.cancel(session.id);
      toast.success('Session cancelled');
      navigate('/sessions');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel session');
    }
  };

  const handleEditNotes = () => {
    const currentNotes = isMentor ? (session?.mentorNotes || '') : (session?.menteeNotes || '');
    setEditedNotes(currentNotes);
    setIsEditingNotes(true);
  };

  const handleCancelEdit = () => {
    setIsEditingNotes(false);
    setEditedNotes('');
  };

  const handleSaveNotes = async () => {
    if (!session) return;
    setIsSavingNotes(true);
    try {
      const updateData = isMentor
        ? { mentorNotes: editedNotes }
        : { menteeNotes: editedNotes };

      const updatedSession = await sessionsApi.update(session.id, updateData);
      setSession(updatedSession);
      setIsEditingNotes(false);
      toast.success('Notes saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (isLoading) {
    return <Loading message="Loading session details..." />;
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <p className="text-gray-600">Session not found</p>
          <Link to="/sessions">
            <Button className="mt-4">Back to Sessions</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/sessions" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Sessions
      </Link>

      <Card>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Session Details</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${session.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                session.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  session.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
              }`}>
              {session.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-1">Mentor</h2>
            <p className="text-lg font-semibold text-gray-900">{session.mentor?.name || 'Unknown'}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-1">Mentee</h2>
            <p className="text-lg font-semibold text-gray-900">{session.mentee?.name || 'Unknown'}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled Time
            </h2>
            <p className="text-lg text-gray-900">{formatDateTime(session.scheduledAt)}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duration
            </h2>
            <p className="text-lg text-gray-900">{session.durationMinutes} minutes</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Topic</h2>
          <p className="text-lg text-gray-900">{session.topic}</p>
        </div>


        {session.notes && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Session Request Notes</h2>
            <p className="text-gray-700">{session.notes}</p>
          </div>
        )}

        {session.summary && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Summary</h2>
            <p className="text-gray-700">{session.summary}</p>
          </div>
        )}

        {/* Mentor's Notes */}
        <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Mentor's Notes</h2>
            {isMentor && !isEditingNotes && (
              <button
                onClick={handleEditNotes}
                className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
          {isEditingNotes && isMentor ? (
            <div>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={4}
                placeholder="Add your notes about this session..."
              />
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  {isSavingNotes ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-line">
              {session.mentorNotes || 'No notes added yet.'}
            </p>
          )}
        </div>

        {/* Mentee's Notes */}
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Mentee's Notes</h2>
            {isMentee && !isEditingNotes && (
              <button
                onClick={handleEditNotes}
                className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
          {isEditingNotes && isMentee ? (
            <div>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={4}
                placeholder="Add your notes about this session..."
              />
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  {isSavingNotes ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-line">
              {session.menteeNotes || 'No notes added yet.'}
            </p>
          )}
        </div>

        {session.googleMeetLink && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Meeting Link</h2>
            <a
              href={session.googleMeetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              Join Google Meet
            </a>
          </div>
        )}

        <div className="flex gap-4">
          {session.status === 'completed' && (
            <Link to={`/sessions/${session.id}/feedback`}>
              <Button>Submit Feedback</Button>
            </Link>
          )}
          {session.status !== 'completed' && session.status !== 'cancelled' && (
            <Button variant="danger" onClick={handleCancel}>
              Cancel Session
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};





