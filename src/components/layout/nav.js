import { DashboardIcon, BuildingIcon, KeyIcon, TemplateIcon, ChannelIcon, MessageIcon, WebhookIcon, WalletIcon, TeamIcon, ShieldIcon, ListIcon, TagIcon, LifebuoyIcon, HeadsetIcon } from '../icons';

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
  { path: '/team', label: 'Users & Roles', icon: TeamIcon, permission: 'team.read' },
  { path: '/support', label: 'Support', icon: LifebuoyIcon, permission: 'tickets.read' },
  { path: '/desk', label: 'Support desk', icon: HeadsetIcon, permission: 'support.view' },
  { path: '/support-team', label: 'Support team', icon: TeamIcon, permission: 'support.staff' },
  { path: '/overview', label: 'Overview', icon: DashboardIcon, permission: 'platform.manage' },
  { path: '/platform', label: 'Enterprises', icon: ListIcon, permission: 'platform.manage' },
  { path: '/pricing', label: 'Plans & pricing', icon: TagIcon, permission: 'platform.manage' }
];
