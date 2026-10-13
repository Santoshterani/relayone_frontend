import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

export default function AppSectionCard({ title, subtitle, actions, children, sx }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 2, ...sx }}>
      {(title || actions) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
          <Box><Typography variant="h3">{title}</Typography>{subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}</Box>
          {actions}
        </Box>
      )}
      {children}
    </Paper>
  );
}
