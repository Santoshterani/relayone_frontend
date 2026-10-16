import React from 'react';
import { Chip } from '@mui/material';

export const DOC_STATUS = {
  not_submitted: ['default', 'Not submitted'], pending: ['info', 'Under review'], verified: ['success', 'Verified'], rejected: ['error', 'Rejected']
};
export function DocChip({ status }) {
  const [color, label] = DOC_STATUS[status] || ['default', status];
  return <Chip size="small" color={color} variant={color === 'default' ? 'outlined' : 'filled'} label={label} sx={{ height: 22, fontWeight: 500 }} />;
}
export const fileSize = (n) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
