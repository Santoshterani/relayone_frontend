// What each portal page needs. The server enforces the same rules; this only decides what to show.
export const PAGE_PERMISSION = {
  dashboard: 'dashboard.read', profile: 'enterprise.read', apiKeys: 'apikeys.read', templates: 'templates.read',
  channels: 'channels.read', messages: 'messages.read', webhooks: 'webhooks.read', wallet: 'wallet.read',
  team: 'team.read', roles: 'roles.manage', platform: 'platform.manage'
};
export const can = (user, code) => !!user && Array.isArray(user.permissions) && user.permissions.includes(code);
