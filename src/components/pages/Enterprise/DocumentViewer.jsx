import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

export default function DocumentViewer({ doc, load, onClose }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!load) return undefined;
    let cancelled = false;
    let objectUrl;
    setUrl('');
    setError('');
    setLoading(true);
    load().then((blob) => {
      if (!(blob instanceof Blob)) throw new Error('The document could not be loaded.');
      objectUrl = URL.createObjectURL(blob);
      if (!cancelled) setUrl(objectUrl);
      else URL.revokeObjectURL(objectUrl);
    }).catch((err) => {
      if (!cancelled) setError(err.message || 'Could not open the file.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [load]);

  return (
    <Dialog open={!!load} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{doc?.title || 'Document preview'}</DialogTitle>
      <DialogContent dividers sx={{ p: 0, minHeight: '60vh', bgcolor: 'action.hover' }}>
        {loading && <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {url && <Box component="iframe" src={url} title={doc?.title || 'Document preview'} sx={{ display: 'block', width: '100%', height: { xs: '70vh', md: '78vh' }, border: 0, bgcolor: 'background.paper' }} />}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}
