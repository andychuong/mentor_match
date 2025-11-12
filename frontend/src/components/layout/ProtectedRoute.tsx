import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!user || !roles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};



