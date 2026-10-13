import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Chip, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { AppPageHeader, AppDataTable, AppConfirmDialog } from '../../common';
import { useApi, useAppContext, useToast } from '../../../hooks';
import { templateService } from '../../../services';
import { dateTime } from '../../../utils/format';

export default function Templates() {
  const { can } = useAppContext();
  const navigate = useNavigate();
  const toast = useToast();
  const [channel, setChannel] = useState('');
  const { data, loading, error, reload } = useApi(() => templateService.listTemplates(channel), [channel]);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const write = can('templates.write');

  const remove = async () => {
    setBusy(true);
    try { await templateService.deleteTemplate(removing.id); toast.success('Template deleted.'); setRemoving(null); reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const create = <Button variant="contained" onClick={() => navigate('/templates/new')}>New template</Button>;
  return (
    <>
      <AppPageHeader title="Templates" subtitle="Reusable messages with {placeholders}. Send one by its id: POST /v1/messages with templateId and variables." actions={write && create} />
      <ToggleButtonGroup size="small" exclusive value={channel} onChange={(e, v) => setChannel(v || '')} sx={{ mb: 2 }} aria-label="Channel filter">
        <ToggleButton value="" sx={{ px: 1.75 }}>All</ToggleButton><ToggleButton value="email" sx={{ px: 1.75 }}>Email</ToggleButton><ToggleButton value="inapp" sx={{ px: 1.75 }}>In-app</ToggleButton>
      </ToggleButtonGroup>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
      <AppDataTable loading={loading} rows={data} onRowClick={(t) => navigate(`/templates/${t.id}`)}
        empty={{ title: 'No templates yet', message: 'A template saves the text and the placeholders you fill in at send time, such as {name} or {code}.', action: write && create }}
        columns={[
          { key: 'id', label: 'Id', width: 70, render: (t) => <span className="mono">{t.id}</span> },
          { key: 'name', label: 'Name', render: (t) => <b>{t.name}</b> },
          { key: 'channel', label: 'Channel', render: (t) => <Chip size="small" variant="outlined" label={t.channel === 'email' ? 'Email' : 'In-app'} /> },
          { key: 'subject', label: 'Subject / title', render: (t) => t.subject || '–' },
          { key: 'ph', label: 'Placeholders', render: (t) => (t.placeholders.length ? t.placeholders.map((p) => <span key={p.key} className="mono" style={{ marginRight: 6 }}>{`{${p.key}}`}</span>) : '–') },
          { key: 'updatedAt', label: 'Updated', render: (t) => dateTime(t.updatedAt) },
          { key: 'act', label: '', align: 'right', render: (t) => write && <Button size="small" color="error" onClick={(e) => { e.stopPropagation(); setRemoving(t); }}>Delete</Button> }
        ]} />
      <AppConfirmDialog open={!!removing} danger busy={busy} title="Delete this template?" confirmLabel="Delete"
        message={removing ? `"${removing.name}" will be removed. Messages already sent keep their text. API calls using templateId ${removing.id} will fail.` : ''} onConfirm={remove} onClose={() => setRemoving(null)} />
    </>
  );
}
