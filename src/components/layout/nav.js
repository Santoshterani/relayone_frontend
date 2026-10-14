import { DashboardIcon, BuildingIcon, KeyIcon, TemplateIcon, ChannelIcon, MessageIcon, WebhookIcon, WalletIcon, TeamIcon, ShieldIcon, ListIcon, TagIcon } from '../icons';

// Sidebar entries. `permission` decides who sees one; `superOnly` entries are for the Super Admin only.
export const NAV = [
  { path: '/', label: 'Dashboard', icon: DashboardIcon, permission: 'dashboard.read', end: true },
  { path: '/profile', label: 'Enterprise', icon: BuildingIcon, permission: 'enterprise.read' },
  { path: '/api-keys', label: 'API keys', icon: KeyIcon, permission: 'apikeys.read' },
  { path: '/templates', label: 'Templates', icon: TemplateIcon, permission: 'templates.read' },
  { path: '/channels', label: 'Channels', icon: ChannelIcon, permission: 'channels.read' },
  { path: '/messages', label: 'Message logs', icon: MessageIcon, permission: 'messages.read' },
  { path: '/webhooks', label: 'Webhooks', icon: WebhookIcon, permission: 'webhooks.read' },
  { path: '/wallet', label: 'Wallet & billing', icon: WalletIcon, permission: 'wallet.read' },
  { path: '/team', label: 'Team', icon: TeamIcon, permission: 'team.read' },
  { path: '/roles', label: 'Roles', icon: ShieldIcon, permission: 'roles.manage' },
  { path: '/overview', label: 'Overview', icon: DashboardIcon, permission: 'platform.manage' },
  { path: '/platform', label: 'Enterprises', icon: ListIcon, permission: 'platform.manage' },
  { path: '/pricing', label: 'Plans & pricing', icon: TagIcon, permission: 'platform.manage' }
];
