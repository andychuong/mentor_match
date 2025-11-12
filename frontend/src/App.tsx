import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Login } from '@/pages/Login';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { DashboardMentee } from '@/pages/DashboardMentee';
import { DashboardMentor } from '@/pages/DashboardMentor';
import { DashboardAdmin } from '@/pages/DashboardAdmin';
import { Profile } from '@/pages/Profile';
import { Mentors } from '@/pages/Mentors';
import { MentorDetail } from '@/pages/MentorDetail';
import { Sessions } from '@/pages/Sessions';
import { SessionDetail } from '@/pages/SessionDetail';
import { Feedback } from '@/pages/Feedback';
import { Availability } from '@/pages/Availability';
import { useAuthStore } from '@/store/authStore';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  const getDefaultRoute = () => {
    if (!isAuthenticated || !user) {
      return '/login';
    }
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={getDefaultRoute()} replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Navigate to={getDefaultRoute()} replace />
              </ProtectedRoute>
            }
          />
          {/* Fallback route for /dashboard without role - redirects to role-specific dashboard */}
          <Route
            path="/dashboard/mentee"
            element={
              <ProtectedRoute requiredRole="mentee">
                <DashboardMentee />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/mentor"
            element={
              <ProtectedRoute requiredRole="mentor">
                <DashboardMentor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mentors"
            element={
              <ProtectedRoute>
                <Mentors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentors/:id"
            element={
              <ProtectedRoute>
                <MentorDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <Sessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/:id"
            element={
              <ProtectedRoute>
                <SessionDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/:id/feedback"
            element={
              <ProtectedRoute>
                <Feedback />
              </ProtectedRoute>
            }
          />

          <Route
            path="/availability"
            element={
              <ProtectedRoute requiredRole="mentor">
                <Availability />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
          <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

