import React, { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Typography, Chip, InputAdornment } from '@mui/material';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ForwardToInboxOutlinedIcon from '@mui/icons-material/ForwardToInboxOutlined';
import AppTextField from '../../common/AppTextField';
import { AppDataTable, AppStatusChip, AppConfirmDialog, CustomPagination } from '../../common';
import { useApi, useAppContext, useToast } from '../../../hooks';
import { teamService, roleService } from '../../../services';
import { dateTime } from '../../../utils/format';

const RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InviteDialog({ open, roles, onClose, onInvited }) {
  const toast = useToast();
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [roleId, setRoleId] = useState('');
  const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false);
  const close = () => { setEmail(''); setName(''); setRoleId(''); setErrors({}); onClose(); };
  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!RE.test(email.trim())) found.email = 'Enter a valid email address.';
    if (!roleId) found.roleId = 'Choose a role.';
    if (Object.keys(found).length) { setErrors(found); return; }
    setBusy(true);
    try { await teamService.invite({ email: email.trim(), name: name.trim(), roleId }); toast.success(`Invitation sent to ${email.trim()}.`); close(); onInvited(); } catch (err) {
      const fe = err.fieldErrors(); setErrors(Object.keys(fe).length ? fe : err.status === 409 ? { email: err.message } : { form: err.message });
    } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onClose={busy ? undefined : close} maxWidth="xs" fullWidth>
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle sx={{ fontSize: 16 }}>Invite a teammate</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
          {errors.form && <Alert severity="error">{errors.form}</Alert>}
          <AppTextField label="Work email" type="email" autoFocus value={email} onChange={(e) => { setEmail(e.target.value); setErrors((s) => ({ ...s, email: undefined })); }} error={!!errors.email} helperText={errors.email} />
          <AppTextField label="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <AppTextField select label="Role" value={roleId} onChange={(e) => { setRoleId(e.target.value); setErrors((s) => ({ ...s, roleId: undefined })); }} error={!!errors.roleId} helperText={errors.roleId || 'What they can see and do. Manage roles in the Roles tab.'}>
            {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
          </AppTextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={close} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" disabled={busy} startIcon={<PersonAddAlt1OutlinedIcon />}>Send invitation</Button></DialogActions>
      </Box>
    </Dialog>
  );
}

export default function UsersPanel() {
  const { can } = useAppContext();
  const toast = useToast();
  const manage = can('team.manage');
  const team = useApi(() => teamService.listTeam(), []);
  const roles = useApi(() => (manage ? roleService.roleOptions() : Promise.resolve({ data: [] })), [manage]);
  const [inviting, setInviting] = useState(false);
  const [q, setQ] = useState(''); const [status, setStatus] = useState('all'); const [roleF, setRoleF] = useState('all');
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(5);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const act = async (fn, okText) => { try { await fn(); if (okText) toast.success(okText); team.reload(); } catch (e) { toast.error(e.message); team.reload(); } };
  const remove = async () => { setBusy(true); await act(() => teamService.removeMember(removing.id), 'Member removed.'); setBusy(false); setRemoving(null); };
  const all = team.data || [];
  const rows = all.filter((u) => (status === 'all' || u.status === status) && (roleF === 'all' || u.role.id === roleF) && (!q.trim() || `${u.name} ${u.email}`.toLowerCase().includes(q.trim().toLowerCase())));
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const roleNames = Array.from(new Map(all.map((u) => [u.role.id, u.role.name])).entries());

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) minmax(140px, 1fr)', md: manage ? 'minmax(0, 1fr) 150px 170px auto' : 'minmax(0, 1fr) 150px 170px' }, gap: 1.5, alignItems: 'center', mb: 2 }}>
        <AppTextField size="small" placeholder="Search users…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} sx={{ minWidth: 0, width: '100%' }} inputProps={{ 'aria-label': 'Search users' }} />
        <AppTextField select size="small" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} sx={{ minWidth: 0, width: '100%' }} inputProps={{ 'aria-label': 'Filter by status' }}>
          <MenuItem value="all">All Status</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="invited">Invited</MenuItem>
        </AppTextField>
        <AppTextField select size="small" value={roleF} onChange={(e) => { setRoleF(e.target.value); setPage(1); }} sx={{ minWidth: 0, width: '100%' }} inputProps={{ 'aria-label': 'Filter by role' }}>
          <MenuItem value="all">All Roles</MenuItem>{roleNames.map(([id, n]) => <MenuItem key={id} value={id}>{n}</MenuItem>)}
        </AppTextField>
        {manage && <Button variant="contained" startIcon={<PersonAddAlt1OutlinedIcon />} onClick={() => setInviting(true)} sx={{ width: { xs: '100%', sm: 'auto' }, justifySelf: { xs: 'stretch', sm: 'end' } }}>Invite</Button>}
      </Box>
      {team.error && <Alert severity="error" sx={{ mb: 2 }}>{team.error.message}</Alert>}
      <AppDataTable loading={team.loading && !team.data} rows={team.data ? pageRows : team.data}
        columns={[
          { key: 'name', label: 'Name', render: (u) => <Box><b>{u.name}</b>{u.isYou && <Chip size="small" label="You" sx={{ ml: 1, height: 20 }} />}<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{u.email}</Typography></Box> },
          { key: 'role', label: 'Role', render: (u) => (manage && !u.isYou && roles.data
            ? <AppTextField select value={u.role.id} onChange={(e) => act(() => teamService.changeRole(u.id, e.target.value), 'Role updated.')} sx={{ minWidth: 190 }} inputProps={{ 'aria-label': `Role of ${u.name}` }}>{roles.data.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}</AppTextField>
            : u.role.name) },
          { key: 'status', label: 'Status', render: (u) => <AppStatusChip status={u.status} /> },
          { key: 'lastLoginAt', label: 'Last sign-in', render: (u) => (u.lastLoginAt ? dateTime(u.lastLoginAt) : 'Never') },
          { key: 'act', label: '', align: 'right', render: (u) => manage && !u.isYou && (
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
              {u.status === 'invited' && <Button size="small" startIcon={<ForwardToInboxOutlinedIcon />} onClick={() => act(() => teamService.resendInvite(u.id), 'Invitation sent again.')}>Resend invite</Button>}
              <Button size="small" color="error" startIcon={<DeleteOutlineOutlinedIcon />} onClick={() => setRemoving(u)}>Remove</Button>
            </Box>) }
        ]} />
      {team.data && rows.length > 0 && <CustomPagination
        page={currentPage}
        totalPages={totalPages}
        totalCount={rows.length}
        pageSize={pageSize}
        pageSizeOptions={[5, 10, 20, 50]}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />}
      <InviteDialog open={inviting} roles={roles.data || []} onClose={() => setInviting(false)} onInvited={team.reload} />
      <AppConfirmDialog open={!!removing} danger busy={busy} title="Remove this member?" confirmLabel="Remove" message={removing ? `${removing.name} (${removing.email}) will lose access immediately.` : ''} onConfirm={remove} onClose={() => setRemoving(null)} />
    </>
  );
}
