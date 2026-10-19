import React, { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem } from '@mui/material';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import AppTextField from '../../common/AppTextField';
import { useToast } from '../../../hooks';
import { supportService } from '../../../services';
import { CATEGORIES, PRIORITIES } from './ticketUi';

export default function NewTicketDialog({ open, onClose, onCreated }) {
  const toast = useToast();
  const [f, setF] = useState({ subject: '', category: 'other', priority: 'medium', body: '' });
  const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setErrors((s) => ({ ...s, [k]: undefined })); };
  const close = () => { setF({ subject: '', category: 'other', priority: 'medium', body: '' }); setErrors({}); onClose(); };
  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (f.subject.trim().length < 3) found.subject = 'Give the issue a short title (3+ characters).';
    if (f.body.trim().length < 2) found.body = 'Describe what is happening.';
    if (Object.keys(found).length) { setErrors(found); return; }
    setBusy(true);
    try { const { data } = await supportService.create({ ...f, subject: f.subject.trim(), body: f.body.trim() }); toast.success(`Ticket #${data.id} raised.`); close(); onCreated(data); } catch (err) {
      const fe = err.fieldErrors(); setErrors(Object.keys(fe).length ? fe : { form: err.message });
    } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onClose={busy ? undefined : close} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle sx={{ fontSize: 16 }}>Raise a support ticket</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
          {errors.form && <Alert severity="error">{errors.form}</Alert>}
          <AppTextField label="Subject" autoFocus value={f.subject} onChange={set('subject')} error={!!errors.subject} helperText={errors.subject} inputProps={{ maxLength: 200 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <AppTextField select label="Category" value={f.category} onChange={set('category')}>{CATEGORIES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}</AppTextField>
            <AppTextField select label="Priority" value={f.priority} onChange={set('priority')} helperText="Critical is for outages that stop sending. Escalations also become Critical.">{PRIORITIES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}</AppTextField>
          </Box>
          <AppTextField label="What is happening?" multiline minRows={5} value={f.body} onChange={set('body')} error={!!errors.body} helperText={errors.body || 'Include error messages, message IDs and when it started.'} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={close} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" disabled={busy} startIcon={<AddCommentOutlinedIcon />}>Raise ticket</Button></DialogActions>
      </Box>
    </Dialog>
  );
}
