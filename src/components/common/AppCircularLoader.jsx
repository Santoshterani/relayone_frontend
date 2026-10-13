import React from 'react';
import { Box, CircularProgress, Backdrop } from '@mui/material';

/** overlay = covers the screen. Default = inline, centred in its parent. */
export default function AppCircularLoader({ overlay = false, size = 28 }) {
  if (overlay) return <Backdrop open sx={{ zIndex: 2000, bgcolor: 'rgba(244,246,251,.7)' }}><CircularProgress size={size} /></Backdrop>;
  return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={size} /></Box>;
}
