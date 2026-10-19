import React, { useState } from 'react';
import { Alert, Button, Chip, Tooltip } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { AppPageHeader, AppDataTable, AppConfirmDialog } from '../../common';
import RoleDialog from './RoleDialog';
import { useApi, useToast } from '../../../hooks';
import { roleService } from '../../../services';

export default function Roles() {
  const toast = useToast();
  const roles = useApi(() => roleService.listRoles(), []);
  const catalog = useApi(() => roleService.getCatalog(), []);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, role = edit
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try { await roleService.deleteRole(removing.id); toast.success('Role deleted.'); setRemoving(null); roles.reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const total = catalog.data ? catalog.data.permissions.filter((p) => p.assignable).length : 0;

  return (
    <>
      <AppPageHeader title="Roles" subtitle="Enterprise Admin can do everything. Create other roles that only see and do what that kind of person needs."
        actions={<Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => setEditing({})}>New role</Button>} />
      {roles.error && <Alert severity="error" sx={{ mb: 2 }}>{roles.error.message}</Alert>}
      <AppDataTable loading={roles.loading && !roles.data} rows={roles.data}
        columns={[
          { key: 'name', label: 'Role', render: (r) => <><b>{r.name}</b> {r.isSystem && <Chip size="small" label="Built-in" sx={{ ml: 0.5, height: 20 }} />}</> },
          { key: 'description', label: 'Description', render: (r) => r.description || '–' },
          { key: 'memberCount', label: 'Members', align: 'right' },
          { key: 'permissions', label: 'Access', render: (r) => (r.isSystem ? 'Everything' : `${r.permissions.filter((p) => !catalog.data || catalog.data.permissions.some((c) => c.code === p && c.assignable)).length} of ${total || '…'} permissions`) },
          { key: 'act', label: '', align: 'right', render: (r) => (r.isSystem ? null : (
            <>
              <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setEditing(r)}>Edit</Button>
              <Tooltip title={r.memberCount ? 'Move its members to another role first' : ''}><span><Button size="small" color="error" startIcon={<DeleteOutlineOutlinedIcon />} disabled={r.memberCount > 0} onClick={() => setRemoving(r)}>Delete</Button></span></Tooltip>
            </>)) }
        ]} />
      <RoleDialog open={!!editing} role={editing && editing.id ? editing : null} catalog={catalog.data} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); roles.reload(); }} />
      <AppConfirmDialog open={!!removing} danger busy={busy} title="Delete this role?" confirmLabel="Delete" message={removing ? `"${removing.name}" will be removed.` : ''} onConfirm={remove} onClose={() => setRemoving(null)} />
    </>
  );
}
