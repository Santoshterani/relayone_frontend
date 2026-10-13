import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { get, post } from './apiHandler';
import { UNAUTHORIZED_EVENT } from './axios';
import { AUTH } from '../constants';
import { getAuthToken, setAuthToken, clearAuthToken } from '../config/session';
import { can } from '../config/permission';

export const SessionContext = createContext(null);

/** Holds the signed-in user for the whole app. `loading` is true until the stored token has been checked. */
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getAuthToken());

  const refresh = useCallback(async () => {
    try { setUser((await get(AUTH.ME)).data); } catch (e) { clearAuthToken(); setUser(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (getAuthToken()) refresh(); }, [refresh]);
  useEffect(() => {
    const onOut = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onOut);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onOut);
  }, []);

  /** Call with the { token, user } the server returns from login / verify-email / accept-invite. */
  const startSession = useCallback((session) => { setAuthToken(session.token); setUser(session.user); setLoading(false); }, []);
  const logout = useCallback(async () => { try { await post(AUTH.LOGOUT); } catch (e) { /* ignore */ } clearAuthToken(); setUser(null); }, []);

  const value = useMemo(() => ({ user, loading, startSession, logout, refresh, can: (code) => can(user, code) }), [user, loading, startSession, logout, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
