import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { notificationApi } from '@/api/notifications';
import { Button } from '@/components/ui/Button';
import { NotificationCenter } from '@/components/NotificationCenter';
import { User, LogOut, Menu, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout: logoutStore } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logoutStore();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      logoutStore();
      navigate('/login');
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      const loadUnreadCount = async () => {
        try {
          const response = await notificationApi.getNotifications(1, 1);
          const unread = response.notifications?.filter((n) => !n.isRead).length || 0;
          setUnreadCount(unread);
        } catch (error) {
          // Silently fail - notifications are optional
        }
      };

      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const getDashboardPath = () => {
    if (!user) return '/dashboard';
    switch (user.role) {
      case 'mentor':
        return '/dashboard/mentor';
      case 'mentee':
        return '/dashboard/mentee';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/dashboard';
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={isAuthenticated ? getDashboardPath() : '/'} className="flex items-center">
              <span className="text-xl font-bold text-primary-600">Capital Factory</span>
            </Link>
            {isAuthenticated && (
              <div className="hidden md:flex md:ml-10 md:space-x-4">
                <Link
                  to={getDashboardPath()}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                >
                  Dashboard
                </Link>
                {user?.role === 'mentee' && (
                  <Link
                    to="/mentors"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                  >
                    Find Mentors
                  </Link>
                )}
                {user?.role === 'mentor' && (
                  <Link
                    to="/availability"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                  >
                    Availability
                  </Link>
                )}
                <Link
                  to="/sessions"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                >
                  Sessions
                </Link>
                <Link
                  to="/profile"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                >
                  Profile
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setNotificationCenterOpen(true)}
                  className="relative p-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  <span>{user.name || user.email}</span>
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                    {user.role}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
            <button
              className="md:hidden ml-4 p-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to={getDashboardPath()}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            {user?.role === 'mentee' && (
              <Link
                to="/mentors"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Find Mentors
              </Link>
            )}
            <Link
              to="/sessions"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sessions
            </Link>
            <Link
              to="/profile"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Profile
            </Link>
          </div>
        </div>
      )}

      {notificationCenterOpen && (
        <NotificationCenter onClose={() => setNotificationCenterOpen(false)} />
      )}
    </nav>
  );
};

