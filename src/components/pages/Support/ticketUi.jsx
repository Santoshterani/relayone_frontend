import React from 'react';
import { Chip } from '@mui/material';

export const CATEGORIES = [['outage', 'Outage / server down'], ['delivery', 'Message delivery'], ['billing', 'Billing'], ['account', 'Account'], ['api', 'API / integration'], ['other', 'Other']];
export const PRIORITIES = [['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['critical', 'Critical']];
export const categoryLabel = (c) => (CATEGORIES.find(([v]) => v === c) || [c, c])[1];

const TONE = { low: 'default', medium: 'info', high: 'warning', critical: 'error' };
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

const hrs = (ms) => { const h = Math.abs(ms) / 36e5; return h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : h < 48 ? `${h.toFixed(h < 10 ? 1 : 0)} h` : `${Math.round(h / 24)} d`; };
/** Resolve-by text for a live ticket: "3.5 h left" or "Overdue by 2 h". Empty once resolved or closed. */
export function dueInfo(t) {
  if (!t.dueAt || !['open', 'in_progress', 'escalated'].includes(t.status)) return null;
  const left = new Date(t.dueAt).getTime() - Date.now();
  return { late: left < 0, text: left < 0 ? `Overdue by ${hrs(left)}` : `${hrs(left)} left` };
}
export function DueChip({ ticket }) {
  const d = dueInfo(ticket);
  if (!d) return <span>–</span>;
  return <Chip size="small" variant={d.late ? 'filled' : 'outlined'} color={d.late ? 'error' : 'default'} label={d.text} sx={{ height: 22, fontWeight: 500 }} />;
}
export function LevelChip({ ticket }) {
  return ticket.level === 2 ? <Chip size="small" color="error" variant="outlined" label="Senior (L2)" sx={{ height: 22 }} /> : null;
}
