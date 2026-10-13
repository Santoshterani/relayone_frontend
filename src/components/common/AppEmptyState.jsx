import React from 'react';
import { Box, Typography } from '@mui/material';

export default function AppEmptyState({ title, message, action }) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
      <Typography variant="h3" gutterBottom>{title}</Typography>
      {message && <Typography color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: action ? 2 : 0 }}>{message}</Typography>}
      {action}
    </Box>
  );
}
