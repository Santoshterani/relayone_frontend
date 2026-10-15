// API paths. One place, so a change in the backend is a one line change here.
export const AUTH = {
  SIGNUP: '/api/auth/signup', VERIFY: '/api/auth/verify-email', RESEND: '/api/auth/resend-verification', LOGIN: '/api/auth/login',
  FORGOT: '/api/auth/forgot-password', RESET: '/api/auth/reset-password', ACCEPT: '/api/auth/accept-invite',
  INVITATION: (token) => `/api/auth/invitations/${token}`, ME: '/api/auth/me', LOGOUT: '/api/auth/logout'
};
export const DASHBOARD = '/api/dashboard';
export const ENTERPRISE = { ROOT: '/api/enterprise', PROFILE: '/api/enterprise/profile', SUBMIT: '/api/enterprise/submit' };
export const API_KEYS = '/api/api-keys';
export const TEMPLATES = '/api/templates';
export const CHANNELS = '/api/channels';
export const MESSAGES = '/api/messages';
export const WEBHOOKS = '/api/webhooks';
export const WALLET = '/api/wallet';
export const TEAM = '/api/team';
export const ROLES = '/api/roles';
export const PLATFORM = '/api/platform';
export const PLANS = '/api/plans';
export const PLATFORM_PLANS = '/api/platform/plans';
export const PAYMENTS = '/api/payments';
export const TICKETS = '/api/tickets';
export const SUPPORT = '/api/support';
export const STAFF = '/api/staff';
