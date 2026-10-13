import React from 'react';
import { Box, Typography } from '@mui/material';

export default function AppPageHeader({ title, subtitle, actions }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
      <Box><Typography variant="h1">{title}</Typography>{subtitle && <Typography color="text.secondary" sx={{ mt: 0.25 }}>{subtitle}</Typography>}</Box>
      {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
    </Box>
  );
}
