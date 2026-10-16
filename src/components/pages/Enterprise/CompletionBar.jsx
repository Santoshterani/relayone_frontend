import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { colors } from '../../../config/theme';

const R = 22; const C = 2 * Math.PI * R;

/** Ring plus the five onboarding steps. steps = [{ label, state: 'done' | 'active' | 'pending' }]. */
export default function CompletionBar({ percent, steps }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2.5, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      <Box sx={{ position: 'relative', width: 56, height: 56, flex: '0 0 auto' }}>
        <svg width="56" height="56" viewBox="0 0 52 52" role="img" aria-label={`Profile ${percent}% complete`}>
          <circle cx="26" cy="26" r={R} fill="none" stroke={colors.line} strokeWidth="4" />
          <circle cx="26" cy="26" r={R} fill="none" stroke={percent === 100 ? colors.good : colors.navy} strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - percent / 100)} transform="rotate(-90 26 26)" />
        </svg>
        <Typography sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13 }}>{percent}%</Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 240 }}>
        <Typography variant="h3">Profile {percent}% complete</Typography>
        <Typography variant="caption" color="text.secondary">Complete all sections to unlock live sending and faster KYC approval.</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {steps.map((s) => (
            <Box key={s.label} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: 10, fontSize: 12, fontWeight: 500,
              bgcolor: s.state === 'done' ? '#E7F6EE' : s.state === 'active' ? '#FFF4DB' : 'action.hover', color: s.state === 'done' ? 'success.main' : s.state === 'active' ? 'warning.main' : 'text.secondary' }}>
              <span aria-hidden>{s.state === 'done' ? '✓' : s.state === 'active' ? '◔' : '–'}</span>{s.label}
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
