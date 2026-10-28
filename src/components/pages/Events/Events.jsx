import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Chip, IconButton, Menu, MenuItem } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { AppPageHeader, AppDataTable, AppConfirmDialog, CustomPagination } from '../../common';
import { useApi, useAppContext, useChannelTypes, useToast } from '../../../hooks';
import { eventService } from '../../../services';
import { dateTime } from '../../../utils/format';

/** One word for where an event stands, so the admin knows what to do next. */
export const eventState = (e) => {
  if (e.status === 'paused') return { color: 'default', label: 'Paused' };
  if (!e.templateCount) return { color: 'warning', label: 'Add a template' };
  if (e.missingCount) return { color: 'warning', label: `Add ${e.missingCount} field${e.missingCount > 1 ? 's' : ''}` };
  return { color: 'success', label: 'Ready' };
};

export default function Events() {
  const channelTypes = useChannelTypes();
  const { can } = useAppContext();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => eventService.listEvents(), []);
  const [removing, setRemoving] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const write = can('templates.write');
  const rows = data || [];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const remove = async () => {
    setBusy(true);
    try { await eventService.deleteEvent(removing.id); toast.success('Event deleted.'); setRemoving(null); setPage(1); reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const create = <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => navigate('/events/new')}>New event</Button>;
  return (
    <>
      <AppPageHeader title="Events" subtitle="Decide in the portal what is sent when something happens on your website. Your developer only names the event, you control the templates." actions={write && create} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
      <AppDataTable loading={loading} rows={data ? pageRows : data} onRowClick={(e) => navigate(`/events/${e.id}`)}
        empty={{ title: 'No events yet', message: 'An event such as “Order billing” links your website to the templates you choose here. No code changes are needed when you swap a template.', action: write && create }}
        columns={[
          { key: 'name', label: 'Name', render: (e) => <b>{e.name}</b> },
          { key: 'key', label: 'Event key', render: (e) => <span className="mono">{e.key}</span> },
          { key: 'channel', label: 'Channel', render: (e) => <Chip size="small" variant="outlined" label={channelTypes.labelOf(e.channel)} /> },
          { key: 'mode', label: 'Who chooses', render: (e) => (e.mode === 'choose' ? 'Person chooses in a popup' : 'Default is sent automatically') },
          { key: 'templates', label: 'Templates', render: (e) => e.templateCount },
          { key: 'state', label: 'Status', render: (e) => { const s = eventState(e); return <Chip size="small" color={s.color} variant={s.color === 'default' ? 'outlined' : 'filled'} label={s.label} sx={{ fontWeight: 500, height: 22 }} />; } },
          { key: 'test', label: 'Last test', render: (e) => (e.lastTest ? `${e.lastTest.ok ? 'Passed' : 'Failed'}, ${dateTime(e.lastTest.at)}` : 'Not tested') },
          { key: 'act', label: 'Actions', width: 90, align: 'right', render: (e) => write && (
            <IconButton size="small" aria-label={`Actions for ${e.name}`} onClick={(ev) => { ev.stopPropagation(); setActionMenu({ anchorEl: ev.currentTarget, event: e }); }}>
              <MoreVertIcon />
            </IconButton>
          ) }
        ]} />
      {rows.length > 0 && <CustomPagination
        page={currentPage}
        totalPages={totalPages}
        totalCount={rows.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />}
      <Menu anchorEl={actionMenu?.anchorEl} open={!!actionMenu} onClose={() => setActionMenu(null)}>
        <MenuItem onClick={() => { const event = actionMenu.event; setActionMenu(null); navigate(`/events/${event.id}`); }}>
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { setRemoving(actionMenu.event); setActionMenu(null); }} sx={{ color: 'error.main' }}>
          <DeleteOutlineOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
      <AppConfirmDialog open={!!removing} danger busy={busy} title="Delete this event?" confirmLabel="Delete"
        message={removing ? `“${removing.name}” will be removed. Your website calls that use the key ${removing.key} will stop working until you create it again. Messages already sent are not affected.` : ''} onConfirm={remove} onClose={() => setRemoving(null)} />
    </>
  );
}
