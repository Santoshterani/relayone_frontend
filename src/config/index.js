// Global config. The API address comes from VITE_API_URL (.env).
export const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
export const TOKEN_KEY = 'relaylite.token';
export const PAGE_SIZES = [10, 20, 50];
export const APP_NAME = 'RelayLite';
