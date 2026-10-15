import axios from 'axios';
import { BASE_URL } from '../config';
import { getAuthToken, clearAuthToken } from '../config/session';

export const UNAUTHORIZED_EVENT = 'relayone:unauthorized';
const instance = axios.create({ baseURL: BASE_URL, timeout: 20000, headers: { 'Content-Type': 'application/json' } });

instance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
// A 401 on a request that carried a token means the session ended: drop it and tell the app.
instance.interceptors.response.use((r) => r, (error) => {
  const had = !!(error.config && error.config.headers && error.config.headers.Authorization);
  if (error.response && error.response.status === 401 && had) {
    clearAuthToken();
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
  return Promise.reject(error);
});
export default instance;
