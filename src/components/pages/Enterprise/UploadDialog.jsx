import React, { useRef, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { useToast } from '../../../hooks';
import { enterpriseService } from '../../../services';
import { readBase64 } from '../../../utils/openFile';
import { fileSize } from './documentUi';

const MAX = 10 * 1024 * 1024;
const OK = ['application/pdf', 'image/png', 'image/jpeg'];

/** Choose a PDF, JPG or PNG (max 10 MB) for one document type. */
export default function UploadDialog({ doc, onClose, onUploaded }) {
  const toast = useToast();
  const input = useRef(null);
  const [file, setFile] = useState(null); const [expiry, setExpiry] = useState(''); const [notes, setNotes] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const close = () => { setFile(null); setExpiry(''); setNotes(''); setError(''); onClose(); };
  const pick = (f) => {
    setError('');
    if (!f) return;
    if (!OK.includes(f.type)) { setError('Choose a PDF, JPG or PNG file.'); return; }
    if (f.size > MAX) { setError('The file is larger than 10 MB.'); return; }
    setFile(f);
  };
  const submit = async () => {
    if (!file) { setError('Choose a file first.'); return; }
    setBusy(true);
    try {
      await enterpriseService.uploadDocument(doc.type, { fileName: file.name, contentBase64: await readBase64(file), expiryDate: expiry || undefined, notes: notes.trim() || undefined });
      toast.success(`${doc.title} uploaded.`); close(); onUploaded();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return (
    <Dialog open={!!doc} onClose={busy ? undefined : close} maxWidth="xs" fullWidth>
      {doc && (
        <>
          <DialogTitle sx={{ fontSize: 16 }}>{doc.status === 'not_submitted' ? 'Upload' : 'Replace'}: {doc.title}</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Box onClick={() => input.current && input.current.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
              sx={{ border: '2px dashed', borderColor: file ? 'success.main' : 'divider', borderRadius: 2, p: 3, textAlign: 'center', cursor: 'pointer', bgcolor: 'background.default' }} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') input.current.click(); }}>
              <Typography sx={{ fontWeight: 600 }}>{file ? file.name : 'Click to choose a file or drop it here'}</Typography>
              <Typography variant="caption" color="text.secondary">{file ? fileSize(file.size) : 'PDF, JPG or PNG, up to 10 MB'}</Typography>
              <input ref={input} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/png,image/jpeg" aria-label="Document file" onChange={(e) => pick(e.target.files[0])} />
            </Box>
            <TextField label="Expiry date (optional)" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="Notes for the reviewer (optional)" multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} inputProps={{ maxLength: 500 }} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={close} disabled={busy}>Cancel</Button><Button variant="contained" onClick={submit} disabled={busy || !file}>Submit document</Button></DialogActions>
        </>
      )}
    </Dialog>
  );
}
