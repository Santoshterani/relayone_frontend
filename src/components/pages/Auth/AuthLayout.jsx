import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { APP_NAME } from '../../../config';

/** Centered card used by every sign-in / sign-up style page. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <Box sx={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: 'background.default' }}>
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 20, color: 'primary.main', mb: 2, textAlign: 'center' }}>{APP_NAME}</Typography>
        <Paper variant="outlined" sx={{ p: 3.5 }}>
          <Typography variant="h2">{title}</Typography>
          {subtitle && <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>{subtitle}</Typography>}
          {!subtitle && <Box sx={{ mb: 2 }} />}
          {children}
        </Paper>
        {footer && <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>{footer}</Typography>}
      </Box>
    </Box>
  );
}
