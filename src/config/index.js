// Global config. The API address comes from VITE_API_URL (.env).
export const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
export const TOKEN_KEY = 'relayone.token';
export const PAGE_SIZES = [5, 10, 20, 50];
export const APP_NAME = 'RelayOne';
export const APP_FULL_NAME = 'RelayOne – CPaaS Portal';
