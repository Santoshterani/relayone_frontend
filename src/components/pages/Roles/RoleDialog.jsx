import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { useToast } from '../../../hooks';
import { roleService } from '../../../services';

// One row per area: the read permission and, where there is one, the permission that changes things.
const AREAS = [
  { label: 'Dashboard', read: 'dashboard.read' },
  { label: 'Enterprise profile', read: 'enterprise.read', write: 'enterprise.update', writeLabel: 'Edit' },
  { label: 'API keys', read: 'apikeys.read', write: 'apikeys.write', writeLabel: 'Create & revoke' },
  { label: 'Message logs', read: 'messages.read', write: 'messages.send', writeLabel: 'Send tests' },
  { label: 'Templates', read: 'templates.read', write: 'templates.write', writeLabel: 'Create & edit' },
  { label: 'Channels', read: 'channels.read', write: 'channels.write', writeLabel: 'Configure' },
  { label: 'Webhooks', read: 'webhooks.read', write: 'webhooks.write', writeLabel: 'Add & remove' },
  { label: 'Wallet & billing', read: 'wallet.read', write: 'wallet.topup', writeLabel: 'Top up' },
  { label: 'Team', read: 'team.read' }
];

/** Create or edit a custom role. Ticking a "change" permission ticks and locks its "view" permission. */
export default function RoleDialog({ open, role, catalog, onClose, onSaved }) {
  const toast = useToast();
  const [name, setName] = useState(''); const [description, setDescription] = useState('');
  const [perms, setPerms] = useState(new Set()); const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false);
  const implies = catalog ? catalog.writeImpliesRead : {};
  const always = catalog ? catalog.alwaysOn : 'dashboard.read';

  useEffect(() => {
    if (!open) return;
    setName(role ? role.name : ''); setDescription(role ? role.description || '' : ''); setErrors({});
    setPerms(new Set([...(role ? role.permissions : []), always]));
  }, [open, role, always]);

  const forced = useMemo(() => new Set([always, ...[...perms].map((c) => implies[c]).filter(Boolean)]), [perms, implies, always]);
  const toggle = (code) => setPerms((s) => { const n = new Set(s); if (n.has(code)) n.delete(code); else { n.add(code); if (implies[code]) n.add(implies[code]); } return n; });

  const submit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) { setErrors({ name: 'Give the role a name (at least 2 characters).' }); return; }
    setBusy(true);
    try {
      const body = { name: name.trim(), description: description.trim(), permissions: [...perms] };
      if (role) await roleService.updateRole(role.id, body); else await roleService.createRole(body);
      toast.success(role ? 'Role updated.' : 'Role created.'); onSaved();
    } catch (err) { const fe = err.fieldErrors(); setErrors(Object.keys(fe).length ? fe : err.status === 409 ? { name: err.message } : { form: err.message }); } finally { setBusy(false); }
  };
  const box = (code, label) => (code
    ? <Checkbox size="small" checked={perms.has(code)} disabled={forced.has(code)} onChange={() => toggle(code)} inputProps={{ 'aria-label': `${label}` }} />
    : null);

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle sx={{ fontSize: 16 }}>{role ? `Edit role: ${role.name}` : 'New role'}</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {errors.form && <Alert severity="error" sx={{ mb: 2 }}>{errors.form}</Alert>}
          <Box sx={{ display: 'grid', gap: 2, mb: 2 }}>
            <TextField label="Role name" autoFocus value={name} onChange={(e) => { setName(e.target.value); setErrors({}); }} error={!!errors.name} helperText={errors.name} placeholder="e.g. Developer, Support, Finance" />
            <TextField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Box>
          <Typography variant="h3" sx={{ mb: 0.5 }}>What this role can do</Typography>
          <Typography variant="caption" color="text.secondary">Allowing a change also allows viewing. Managing the team and roles stays with Enterprise Admins.</Typography>
          <Table size="small" sx={{ mt: 1 }}>
            <TableHead><TableRow><TableCell>Area</TableCell><TableCell align="center">View</TableCell><TableCell>Change</TableCell></TableRow></TableHead>
            <TableBody>
              {AREAS.map((a) => (
                <TableRow key={a.label}>
                  <TableCell>{a.label}</TableCell>
                  <TableCell align="center">{box(a.read, `View ${a.label}`)}</TableCell>
                  <TableCell>{a.write ? <Box sx={{ display: 'flex', alignItems: 'center' }}>{box(a.write, `${a.writeLabel} ${a.label}`)}<Typography variant="caption" color="text.secondary">{a.writeLabel}</Typography></Box> : <Typography variant="caption" color="text.disabled">–</Typography>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" disabled={busy}>{role ? 'Save role' : 'Create role'}</Button></DialogActions>
      </Box>
    </Dialog>
  );
}
