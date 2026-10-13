import { TOKEN_KEY } from './index';

// Browser storage can be blocked, so every access is wrapped.
export const getAuthToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; } };
export const setAuthToken = (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch (e) { /* ignore */ } };
export const clearAuthToken = () => { try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ } };
export const getCurrentUserRole = (user) => (user ? (user.isSuperAdmin ? 'Super Admin' : user.role && user.role.name) : null);
