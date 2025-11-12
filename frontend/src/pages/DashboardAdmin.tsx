import React from 'react';
import { adminApi } from '@/api/admin';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Analytics } from '@/types';
import { Users, Calendar, Star, TrendingUp, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export const DashboardAdmin: React.FC = () => {
  const [analytics, setAnalytics] = React.useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getAnalytics();
      setAnalytics(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (type: 'sessions' | 'users' | 'feedback') => {
    try {
      const blob = await adminApi.exportData(type, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export started');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
    }
  };

  if (isLoading) {
    return <Loading message="Loading analytics..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Platform overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.totalSessions || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.activeUsersCount || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.averageSessionRating?.toFixed(1) || '0.0'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Utilization</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.mentorUtilizationRate?.toFixed(0) || 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Data Export">
          <p className="text-sm text-gray-600 mb-4">
            Export platform data for analysis and reporting.
          </p>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport('sessions')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Sessions
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport('users')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport('feedback')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Feedback
            </Button>
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-2">
            <a href="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </a>
            <a href="/admin/sessions">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                View All Sessions
              </Button>
            </a>
            <a href="/admin/analytics">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Detailed Analytics
              </Button>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};

