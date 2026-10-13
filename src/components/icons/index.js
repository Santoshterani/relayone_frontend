import React from 'react';
import { SvgIcon } from '@mui/material';

const make = (d) => function Icon(props) { return <SvgIcon fontSize="small" viewBox="0 0 24 24" {...props}><path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></SvgIcon>; };
export const DashboardIcon = make('M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z');
export const BuildingIcon = make('M4 21V4l8-2v19M12 8l8 2v11M8 8h.01M8 12h.01M8 16h.01M16 14h.01M16 18h.01');
export const KeyIcon = make('M14 10a4 4 0 11-3.5 6L3 16v-3h3v-2h3l1.5-1.5A4 4 0 0114 10zM16 8h.01');
export const TemplateIcon = make('M4 4h16v16H4zM4 9h16M9 9v11');
export const ChannelIcon = make('M3 7l9 6 9-6M3 5h18v14H3z');
export const MessageIcon = make('M4 5h16v11H9l-5 4z');
export const WebhookIcon = make('M8 12a4 4 0 118 0M12 16v5M6 21h12M5 8l3 4M19 8l-3 4');
export const WalletIcon = make('M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 7l12-3v3M16 14h2');
export const TeamIcon = make('M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0M17 11a3 3 0 10-1-5.8M21 20a5 5 0 00-4-4.9');
export const ShieldIcon = make('M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4');
export const ListIcon = make('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01');
export const LogoutIcon = make('M9 4H5v16h4M16 8l4 4-4 4M20 12H9');
