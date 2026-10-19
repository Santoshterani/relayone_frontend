import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

export default function AppSectionCard({ title, subtitle, actions, icon, children, sx }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 2, ...sx }}>
      {(title || actions) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            {icon && <Box sx={{ display: 'flex', color: 'primary.main', mt: 0.125 }}>{icon}</Box>}
            <Box><Typography variant="h3">{title}</Typography>{subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}</Box>
          </Box>
          {actions}
        </Box>
      )}
      {children}
    </Paper>
  );
}
