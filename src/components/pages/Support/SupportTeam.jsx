import React, { useState } from 'react';
import { Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, MenuItem, TextField, Typography } from '@mui/material';
import { AppPageHeader, AppDataTable, AppStatusChip, AppConfirmDialog } from '../../common';
import { useApi, useAppContext, useToast } from '../../../hooks';
import { staffService } from '../../../services';

const PERMS = [
  ['support.view', 'View tickets', 'See every ticket and its history'],
  ['support.reply', 'Reply', 'Reply to enterprises and add internal notes'],
  ['support.resolve', 'Resolve', 'Resolve, reopen and close tickets'],
  ['support.escalate', 'Escalate', 'Escalate a ticket with a reason'],
  ['support.assign', 'Assign', 'Assign tickets to agents']
];
const RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function PermissionChecks({ value, onChange }) {
  const toggle = (code) => onChange(value.includes(code) ? value.filter((c) => c !== code) : [...new Set([...value, code, 'support.view'])]);
  return (
    <FormGroup>
      {PERMS.map(([code, label, hint]) => (
        <FormControlLabel key={code} control={<Checkbox checked={value.includes(code)} onChange={() => toggle(code)} disabled={code === 'support.view' && value.length > 1} />}
          label={<Box><Typography sx={{ fontWeight: 500 }}>{label}</Typography><Typography variant="caption" color="text.secondary">{hint}</Typography></Box>} sx={{ alignItems: 'flex-start', mb: 0.5 }} />
      ))}
    </FormGroup>
  );
}

function AddDialog({ open, isSuper, onClose, onAdded }) {
  const toast = useToast();
  const [f, setF] = useState({ email: '', name: '', staffType: 'agent' }); const [perms, setPerms] = useState(['support.view', 'support.reply']);
  const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false);
  const close = () => { setF({ email: '', name: '', staffType: 'agent' }); setPerms(['support.view', 'support.reply']); setErrors({}); onClose(); };
  const submit = async (e) => {
    e.preventDefault();
    if (!RE.test(f.email.trim())) { setErrors({ email: 'Enter a valid email address.' }); return; }
    setBusy(true);
    try { await staffService.add({ email: f.email.trim(), name: f.name.trim(), staffType: f.staffType, permissions: f.staffType === 'lead' ? [] : perms }); toast.success(`Invitation sent to ${f.email.trim()}.`); close(); onAdded(); } catch (err) {
      const fe = err.fieldErrors(); setErrors(Object.keys(fe).length ? fe : err.status === 409 ? { email: err.message } : { form: err.message });
    } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onClose={busy ? undefined : close} maxWidth="xs" fullWidth>
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle sx={{ fontSize: 16 }}>{isSuper ? 'Add support staff' : 'Add a support agent'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
          {errors.form && <Alert severity="error">{errors.form}</Alert>}
          <TextField label="Work email" type="email" autoFocus value={f.email} onChange={(e) => { setF({ ...f, email: e.target.value }); setErrors({}); }} error={!!errors.email} helperText={errors.email} />
          <TextField label="Name (optional)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          {isSuper && <TextField select label="Role" value={f.staffType} onChange={(e) => setF({ ...f, staffType: e.target.value })} helperText={f.staffType === 'lead' ? 'A Support Admin has every support permission and can add agents.' : 'An agent only gets the permissions ticked below.'}><MenuItem value="lead">Support Admin</MenuItem><MenuItem value="agent">Support Agent</MenuItem></TextField>}
          {f.staffType === 'agent' && <Box><Typography variant="h3" sx={{ mb: 0.5 }}>What can this agent do?</Typography><PermissionChecks value={perms} onChange={setPerms} /></Box>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={close} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" disabled={busy}>Send invitation</Button></DialogActions>
      </Box>
    </Dialog>
  );
}

function PermissionsDialog({ member, onClose, onSaved }) {
  const toast = useToast();
  const [perms, setPerms] = useState(member ? member.permissions : []); const [busy, setBusy] = useState(false);
  React.useEffect(() => { if (member) setPerms(member.permissions); }, [member]);
  const save = async () => { setBusy(true); try { await staffService.setPermissions(member.id, perms); toast.success('Permissions saved.'); onSaved(); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  return (
    <Dialog open={!!member} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 16 }}>Permissions for {member && member.name}</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}><PermissionChecks value={perms} onChange={setPerms} /></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" onClick={save} disabled={busy || !perms.includes('support.view')}>Save</Button></DialogActions>
    </Dialog>
  );
}

/** Super Admin adds Support Admins. A Support Admin adds agents and chooses what each can do. */
export default function SupportTeam() {
  const { user } = useAppContext();
  const toast = useToast();
  const staff = useApi(() => staffService.list(), []);
  const [adding, setAdding] = useState(false); const [editing, setEditing] = useState(null); const [removing, setRemoving] = useState(null); const [busy, setBusy] = useState(false);
  const isSuper = !!user.isSuperAdmin;
  const act = async (fn, ok) => { try { await fn(); if (ok) toast.success(ok); staff.reload(); } catch (e) { toast.error(e.message); } };
  const remove = async () => { setBusy(true); await act(() => staffService.remove(removing.id), 'Removed.'); setBusy(false); setRemoving(null); };
  const canTouch = (m) => m.id !== user.id && (isSuper || m.staffType === 'agent');

  return (
    <>
      <AppPageHeader title="Support team" subtitle={isSuper ? 'Add a Support Admin. They add agents and decide what each agent can do.' : 'Add agents and choose what each can do: view, reply, resolve, escalate, assign.'}
        actions={<Button variant="contained" onClick={() => setAdding(true)}>{isSuper ? 'Add staff' : 'Add agent'}</Button>} />
      {staff.error && <Alert severity="error" sx={{ mb: 2 }}>{staff.error.message}</Alert>}
      <AppDataTable loading={staff.loading && !staff.data} rows={staff.data} empty={{ title: 'No support staff yet', message: isSuper ? 'Add a Support Admin to start.' : 'Add your first agent.' }}
        columns={[
          { key: 'name', label: 'Name', render: (m) => <Box><b>{m.name}</b>{m.id === user.id && <Chip size="small" label="You" sx={{ ml: 1, height: 20 }} />}<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{m.email}</Typography></Box> },
          { key: 'role', label: 'Role' },
          { key: 'permissions', label: 'Can', render: (m) => (m.staffType === 'lead' ? 'Everything, and add agents' : m.permissions.length ? m.permissions.map((p) => (PERMS.find(([c]) => c === p) || [p, p])[1]).join(', ') : 'Nothing yet') },
          { key: 'status', label: 'Status', render: (m) => <AppStatusChip status={m.status} /> },
          { key: 'act', label: '', align: 'right', render: (m) => canTouch(m) && (
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
              {m.staffType === 'agent' && <Button size="small" onClick={() => setEditing(m)}>Permissions</Button>}
              {m.status === 'invited' && <Button size="small" onClick={() => act(() => staffService.resendInvite(m.id), 'Invitation sent again.')}>Resend invite</Button>}
              <Button size="small" color="error" onClick={() => setRemoving(m)}>Remove</Button>
            </Box>) }
        ]} />
      <AddDialog open={adding} isSuper={isSuper} onClose={() => setAdding(false)} onAdded={staff.reload} />
      <PermissionsDialog member={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); staff.reload(); }} />
      <AppConfirmDialog open={!!removing} danger busy={busy} title="Remove this person?" confirmLabel="Remove" message={removing ? `${removing.name} (${removing.email}) will lose access immediately. Tickets assigned to them become unassigned.` : ''} onConfirm={remove} onClose={() => setRemoving(null)} />
    </>
  );
}
