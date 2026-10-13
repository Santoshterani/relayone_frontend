import { useContext } from 'react';
import { SessionContext } from '../utils/contexts';

/** { user, loading, startSession, logout, refresh, can(permission) } */
export default function useAppContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useAppContext must be used inside SessionProvider');
  return ctx;
}
