import type { ReactNode } from 'react';
import { ConsentGate } from './ConsentGate';

interface AuthGuardProps {
  children: ReactNode;
}

/** Wraps protected routes — consent (Terms/Privacy) then age verification, session */
export function AuthGuard({ children }: AuthGuardProps) {
  return <ConsentGate>{children}</ConsentGate>;
}
