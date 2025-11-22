// client/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

type Props = {
  children: React.ReactElement;
  roles?: string[]; // allowed roles
};

export default function ProtectedRoute({ children, roles }: Props) {
  // selectors typed inline
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role ?? '')) {
    return <div className="p-8">Unauthorized — you don't have permission to view this page.</div>;
  }

  return children;
}
