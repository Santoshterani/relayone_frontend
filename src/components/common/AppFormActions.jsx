import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';

export default function AppFormActions({ submitLabel = 'Save', onCancel, busy = false, disabled = false, align = 'flex-end' }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: align, mt: 2 }}>
      {onCancel && <Button onClick={onCancel} disabled={busy}>Cancel</Button>}
      <Button type="submit" variant="contained" disabled={busy || disabled} startIcon={busy ? <CircularProgress size={14} color="inherit" /> : null}>{submitLabel}</Button>
    </Box>
  );
}
