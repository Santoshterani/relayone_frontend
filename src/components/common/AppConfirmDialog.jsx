import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

export default function AppConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = false, busy = false, onConfirm, onClose }) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 16 }}>{title}</DialogTitle>
      <DialogContent><DialogContentText>{message}</DialogContentText></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" color={danger ? 'error' : 'primary'} onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
