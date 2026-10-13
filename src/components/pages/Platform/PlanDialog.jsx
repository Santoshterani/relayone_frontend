import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import { useToast } from '../../../hooks';
import { planService } from '../../../services';

/** Create or edit a plan. Editing never changes buckets enterprises already bought. */
export default function PlanDialog({ open, plan, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ name: '', description: '', price: '', messages: '', sortOrder: '0', isActive: true });
  const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setF(plan ? { name: plan.name, description: plan.description || '', price: plan.price, messages: String(plan.messages), sortOrder: String(plan.sortOrder), isActive: plan.isActive }
      : { name: '', description: '', price: '', messages: '', sortOrder: '0', isActive: true });
  }, [open, plan]);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined, form: undefined }); };
  const perMessage = Number(f.price) >= 0 && Number(f.messages) > 0 && f.price !== '' ? (Number(f.price) / Number(f.messages)).toFixed(4) : null;

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (f.name.trim().length < 2) err.name = 'Give the plan a name (at least 2 characters).';
    if (f.price === '' || !(Number(f.price) >= 0)) err.price = 'Enter the price in dollars, 0 or more.';
    if (!(Number(f.messages) >= 1) || !Number.isInteger(Number(f.messages))) err.messages = 'Enter a whole number of messages, 1 or more.';
    if (Object.keys(err).length) { setErrors(err); return; }
    setBusy(true);
    try {
      const body = { name: f.name.trim(), description: f.description.trim(), price: Number(f.price), messages: Number(f.messages), sortOrder: Number(f.sortOrder) || 0, isActive: f.isActive };
      if (plan) await planService.update(plan.id, body); else await planService.create(body);
      toast.success(plan ? 'Plan saved.' : 'Plan created.'); onSaved();
    } catch (e2) { const fe = e2.fieldErrors(); setErrors(Object.keys(fe).length ? fe : e2.status === 409 ? { name: e2.message } : { form: e2.message }); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle sx={{ fontSize: 16 }}>{plan ? `Edit plan: ${plan.name}` : 'New plan'}</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {errors.form && <Alert severity="error" sx={{ mb: 2 }}>{errors.form}</Alert>}
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Plan name" autoFocus value={f.name} onChange={set('name')} error={!!errors.name} helperText={errors.name} />
            <TextField label="Description (optional)" value={f.description} onChange={set('description')} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Price (USD)" type="number" value={f.price} onChange={set('price')} error={!!errors.price} helperText={errors.price} inputProps={{ step: '0.01', min: 0 }} fullWidth />
              <TextField label="Messages" type="number" value={f.messages} onChange={set('messages')} error={!!errors.messages} helperText={errors.messages} inputProps={{ min: 1 }} fullWidth />
            </Box>
            {perMessage && <Typography variant="caption" color="text.secondary">Works out to ${perMessage} per message, for email and in-app alike.</Typography>}
            <TextField label="Show order" type="number" value={f.sortOrder} onChange={set('sortOrder')} helperText="Smaller numbers are shown first." inputProps={{ min: 0 }} />
            <FormControlLabel control={<Switch checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />} label={f.isActive ? 'On sale' : 'Hidden from new buyers'} />
            {plan && <Alert severity="info">Changes apply to new purchases only. Buckets already bought keep their size and price.</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
