import React from 'react';
import { Chip } from '@mui/material';

const TONES = {
  delivered: ['success', 'Delivered'], sent: ['info', 'Sent'], queued: ['default', 'Queued'], failed: ['error', 'Failed'],
  active: ['success', 'Active'], sandbox: ['warning', 'Sandbox'], review: ['info', 'In review'], changes: ['warning', 'Changes needed'],
  rejected: ['error', 'Rejected'], suspended: ['error', 'Suspended'], verified: ['success', 'Verified'], unverified: ['default', 'Not verified'],
  invited: ['info', 'Invited'], disabled: ['default', 'Disabled'], pending: ['default', 'Pending']
};
export default function AppStatusChip({ status, label }) {
  const [color, text] = TONES[status] || ['default', status];
  return <Chip size="small" color={color} variant={color === 'default' ? 'outlined' : 'filled'} label={label || text} sx={{ fontWeight: 500, height: 22 }} />;
}
