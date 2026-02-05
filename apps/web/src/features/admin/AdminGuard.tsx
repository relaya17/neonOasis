import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionStore } from '../auth/authStore';

interface AdminGuardProps {
  children: ReactNode;
}

/** מגן על תא הטייס — רק משתמש מחובר עם is_admin נכנס */
export function AdminGuard({ children }: AdminGuardProps) {
  const userId = useSessionStore((s) => s.userId);
  const isAdmin = useSessionStore((s) => s.isAdmin);

  if (!userId) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
