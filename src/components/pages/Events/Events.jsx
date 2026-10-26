import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Chip } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { AppPageHeader, AppDataTable, AppConfirmDialog } from '../../common';
import { useApi, useAppContext, useToast } from '../../../hooks';
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
  const { can } = useAppContext();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => eventService.listEvents(), []);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const write = can('templates.write');
  const remove = async () => {
    setBusy(true);
    try { await eventService.deleteEvent(removing.id); toast.success('Event deleted.'); setRemoving(null); reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const create = <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => navigate('/events/new')}>New event</Button>;
  return (
    <>
      <AppPageHeader title="Events" subtitle="Decide in the portal what is sent when something happens on your website. Your developer only names the event, you control the templates." actions={write && create} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
      <AppDataTable loading={loading} rows={data} onRowClick={(e) => navigate(`/events/${e.id}`)}
        empty={{ title: 'No events yet', message: 'An event such as “Order billing” links your website to the templates you choose here. No code changes are needed when you swap a template.', action: write && create }}
        columns={[
          { key: 'name', label: 'Name', render: (e) => <b>{e.name}</b> },
          { key: 'key', label: 'Event key', render: (e) => <span className="mono">{e.key}</span> },
          { key: 'channel', label: 'Channel', render: (e) => <Chip size="small" variant="outlined" label={e.channel === 'email' ? 'Email' : 'In-app'} /> },
          { key: 'mode', label: 'Who chooses', render: (e) => (e.mode === 'choose' ? 'Person chooses in a popup' : 'Default is sent automatically') },
          { key: 'templates', label: 'Templates', render: (e) => e.templateCount },
          { key: 'state', label: 'Status', render: (e) => { const s = eventState(e); return <Chip size="small" color={s.color} variant={s.color === 'default' ? 'outlined' : 'filled'} label={s.label} sx={{ fontWeight: 500, height: 22 }} />; } },
          { key: 'test', label: 'Last test', render: (e) => (e.lastTest ? `${e.lastTest.ok ? 'Passed' : 'Failed'}, ${dateTime(e.lastTest.at)}` : 'Not tested') },
          { key: 'act', label: '', align: 'right', render: (e) => write && <Button size="small" color="error" startIcon={<DeleteOutlineOutlinedIcon />} onClick={(ev) => { ev.stopPropagation(); setRemoving(e); }}>Delete</Button> }
        ]} />
      <AppConfirmDialog open={!!removing} danger busy={busy} title="Delete this event?" confirmLabel="Delete"
        message={removing ? `“${removing.name}” will be removed. Your website calls that use the key ${removing.key} will stop working until you create it again. Messages already sent are not affected.` : ''} onConfirm={remove} onClose={() => setRemoving(null)} />
    </>
  );
}
