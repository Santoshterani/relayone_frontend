import React from 'react';
import { Paper, Typography } from '@mui/material';

export default function AppMetricCard({ label, value, hint, tone }) {
  const color = { good: 'success.main', bad: 'error.main', warn: 'warning.main' }[tone] || 'text.primary';
  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography sx={{ fontSize: 24, fontWeight: 600, color, lineHeight: 1.3 }}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Paper>
  );
}
