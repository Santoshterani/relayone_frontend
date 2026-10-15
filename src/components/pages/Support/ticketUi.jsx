import React from 'react';
import { Chip } from '@mui/material';

export const CATEGORIES = [['outage', 'Outage / server down'], ['delivery', 'Message delivery'], ['billing', 'Billing'], ['account', 'Account'], ['api', 'API / integration'], ['other', 'Other']];
export const PRIORITIES = [['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['urgent', 'Urgent']];
export const categoryLabel = (c) => (CATEGORIES.find(([v]) => v === c) || [c, c])[1];

const TONE = { low: 'default', medium: 'info', high: 'warning', urgent: 'error' };
export function PriorityChip({ priority }) {
  const label = (PRIORITIES.find(([v]) => v === priority) || [priority, priority])[1];
  return <Chip size="small" variant={priority === 'low' || priority === 'medium' ? 'outlined' : 'filled'} color={TONE[priority] || 'default'} label={label} sx={{ height: 22, fontWeight: 500 }} />;
}
export const ago = (iso) => {
  if (!iso) return '–';
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
};
export const minutes = (m) => { if (m == null) return '–'; if (m < 60) return `${m} min`; const h = m / 60; return h < 48 ? `${h.toFixed(1)} h` : `${(h / 24).toFixed(1)} d`; };
