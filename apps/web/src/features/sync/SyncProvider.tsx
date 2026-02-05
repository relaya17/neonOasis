import type { ReactNode } from 'react';
import { useSyncSocket } from './useSyncSocket';

interface SyncProviderProps {
  children: ReactNode;
}

/** Provides socket to tree — use useSyncSocket in features */
export function SyncProvider({ children }: SyncProviderProps) {
  useSyncSocket();
  return <>{children}</>;
}
