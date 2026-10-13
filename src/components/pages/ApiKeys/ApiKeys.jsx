import React, { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, Tooltip } from '@mui/material';
import { AppPageHeader, AppSectionCard, AppDataTable, AppStatusChip, AppConfirmDialog } from '../../common';
import { useApi, useAppContext, useToast } from '../../../hooks';
import { apiKeyService } from '../../../services';
import { BASE_URL } from '../../../config';
import { dateTime } from '../../../utils/format';
import useCopy from '../../../utils/useCopy';

function NewKeyDialog({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const copy = useCopy();
  const reset = () => { setName(''); setError(''); setCreated(null); };
  const close = () => { const had = !!created; reset(); onClose(had); };

  const submit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) { setError('Give the key a name, for example "Production server".'); return; }
    setBusy(true);
    try { const { data } = await apiKeyService.createKey(name.trim()); setCreated(data); onCreated(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onClose={busy ? undefined : close} maxWidth="sm" fullWidth>
      {created ? (
        <>
          <DialogTitle sx={{ fontSize: 16 }}>Copy your API key</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>This is the only time the full key is shown. Store it somewhere safe. If you lose it, revoke it and create a new one.</Alert>
            <Box className="rl-code mono" sx={{ wordBreak: 'break-all', userSelect: 'all' }}>{created.key}</Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => copy(created.key, 'API key')}>Copy key</Button><Button variant="contained" onClick={close}>I have saved it</Button></DialogActions>
        </>
      ) : (
        <Box component="form" onSubmit={submit} noValidate>
          <DialogTitle sx={{ fontSize: 16 }}>Create an API key</DialogTitle>
          <DialogContent>
            <TextField label="Key name" autoFocus value={name} onChange={(e) => { setName(e.target.value); setError(''); }} error={!!error} helperText={error || 'Helps you tell keys apart later.'} sx={{ mt: 1 }} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={close} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" disabled={busy}>Create key</Button></DialogActions>
        </Box>
      )}
    </Dialog>
  );
}

export default function ApiKeys() {
  const { can } = useAppContext();
  const toast = useToast();
  const copy = useCopy();
  const { data, loading, error, reload } = useApi(() => apiKeyService.listKeys(), []);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [busy, setBusy] = useState(false);
  const write = can('apikeys.write');

  const revoke = async () => {
    setBusy(true);
    try { await apiKeyService.revokeKey(revoking.id); toast.success('Key revoked. It stops working immediately.'); setRevoking(null); reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const snippet = `curl -X POST ${BASE_URL}/v1/messages \\
  -H "Authorization: Bearer rl_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "channel": "email", "to": "user@example.com",
        "subject": "Hello {name}", "body": "Welcome, {name}!",
        "variables": { "name": "Asha" } }'`;

  return (
    <>
      <AppPageHeader title="API keys" subtitle="Your server uses a key to send messages. Keep keys secret and never put them in a browser or mobile app."
        actions={write && <Button variant="contained" onClick={() => setCreating(true)}>Create key</Button>} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
      <AppDataTable loading={loading} rows={data}
        empty={{ title: 'No API keys yet', message: write ? 'Create a key to start sending messages from your own backend.' : 'Ask an administrator to create a key.', action: write && <Button variant="contained" onClick={() => setCreating(true)}>Create key</Button> }}
        columns={[
          { key: 'name', label: 'Name', render: (k) => <b>{k.name}</b> },
          { key: 'prefix', label: 'Key', render: (k) => <span className="mono">{k.prefix}…</span> },
          { key: 'createdAt', label: 'Created', render: (k) => dateTime(k.createdAt) },
          { key: 'lastUsedAt', label: 'Last used', render: (k) => (k.lastUsedAt ? dateTime(k.lastUsedAt) : 'Never') },
          { key: 'status', label: 'Status', render: (k) => (k.active ? <AppStatusChip status="active" /> : <AppStatusChip status="disabled" label="Revoked" />) },
          { key: 'act', label: '', align: 'right', render: (k) => write && k.active && <Button size="small" color="error" onClick={() => setRevoking(k)}>Revoke</Button> }
        ]} />
      <AppSectionCard title="Send your first message" sx={{ mt: 3 }}
        actions={<Tooltip title="Copy"><IconButton size="small" onClick={() => copy(snippet, 'Example')} aria-label="Copy example">⧉</IconButton></Tooltip>}>
        <Typography color="text.secondary" sx={{ mb: 1 }}>Placeholders like <code>{'{name}'}</code> are filled from <code>variables</code>. In the sandbox the first few messages are free tests.</Typography>
        <pre className="rl-code mono" style={{ margin: 0 }}>{snippet}</pre>
      </AppSectionCard>
      <NewKeyDialog open={creating} onClose={() => setCreating(false)} onCreated={reload} />
      <AppConfirmDialog open={!!revoking} danger busy={busy} title="Revoke this key?" confirmLabel="Revoke"
        message={revoking ? `"${revoking.name}" (${revoking.prefix}…) will stop working at once. Any server still using it will get 401 errors.` : ''} onConfirm={revoke} onClose={() => setRevoking(null)} />
    </>
  );
}
