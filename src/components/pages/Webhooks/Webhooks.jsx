import React, { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Switch, Typography, Tooltip } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import AppTextField from '../../common/AppTextField';
import { AppPageHeader, AppSectionCard, AppDataTable, AppConfirmDialog, AppStatusChip, CustomPagination } from '../../common';
import { useApi, useAppContext, useToast } from '../../../hooks';
import { webhookService } from '../../../services';
import { dateTime } from '../../../utils/format';
import useCopy from '../../../utils/useCopy';

function AddDialog({ open, onClose, onCreated }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const copy = useCopy();
  const close = () => { setUrl(''); setError(''); setCreated(null); onClose(); };
  const submit = async (e) => {
    e.preventDefault();
    if (!/^https?:\/\/.+/i.test(url.trim())) { setError('Enter a full address starting with https://'); return; }
    setBusy(true);
    try { const { data } = await webhookService.createWebhook(url.trim()); setCreated(data); onCreated(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onClose={busy ? undefined : close} maxWidth="sm" fullWidth>
      {created ? (
        <>
          <DialogTitle sx={{ fontSize: 16 }}>Copy your signing secret</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>This secret is shown once. Use it on your server to check that requests really come from RelayOne.</Alert>
            <Box className="rl-code mono" sx={{ userSelect: 'all' }}>{created.secret}</Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => copy(created.secret, 'Secret')} startIcon={<ContentCopyOutlinedIcon />}>Copy secret</Button><Button variant="contained" onClick={close}>I have saved it</Button></DialogActions>
        </>
      ) : (
        <Box component="form" onSubmit={submit} noValidate>
          <DialogTitle sx={{ fontSize: 16 }}>Add a webhook endpoint</DialogTitle>
          <DialogContent><AppTextField label="Endpoint URL" autoFocus value={url} onChange={(e) => { setUrl(e.target.value); setError(''); }} error={!!error} helperText={error || 'We send a POST here whenever a message is sent, delivered or fails. Must be https in production.'} sx={{ mt: 1 }} placeholder="https://api.yourapp.com/relayone/events" /></DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={close} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" disabled={busy} startIcon={<AddOutlinedIcon />}>Add endpoint</Button></DialogActions>
        </Box>
      )}
    </Dialog>
  );
}

const VERIFY = `// Node.js: check the signature before trusting a webhook
const crypto = require('crypto');
function verify(rawBody, header, secret) {
  const [t, v1] = header.split(',').map((p) => p.split('=')[1]);
  const expected = crypto.createHmac('sha256', secret).update(t + '.' + rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
}  // header: X-RelayOne-Signature   (also reject if t is older than 5 minutes)`;

export default function Webhooks() {
  const { can } = useAppContext();
  const toast = useToast();
  const write = can('webhooks.write');
  const hooks = useApi(() => webhookService.listWebhooks(), []);
  const [page, setPage] = useState(1); const [limit, setLimit] = useState(10);
  const deliveries = useApi(() => webhookService.listDeliveries({ page, limit }), [page, limit]);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const toggle = async (h) => { try { await webhookService.setActive(h.id, !h.active); hooks.reload(); } catch (e) { toast.error(e.message); } };
  const remove = async () => {
    setBusy(true);
    try { await webhookService.deleteWebhook(removing.id); toast.success('Endpoint removed.'); setRemoving(null); hooks.reload(); deliveries.reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const add = <Button variant="contained" onClick={() => setAdding(true)} startIcon={<AddOutlinedIcon />}>Add endpoint</Button>;

  return (
    <>
      <AppPageHeader title="Webhooks" subtitle="Get told when a message changes status, so your own system stays in sync." actions={write && add} />
      {hooks.error && <Alert severity="error" sx={{ mb: 2 }}>{hooks.error.message}</Alert>}
      <AppDataTable loading={hooks.loading && !hooks.data} rows={hooks.data}
        empty={{ title: 'No endpoints yet', message: 'Add an https endpoint on your server to receive status events.', action: write && add }}
        columns={[
          { key: 'url', label: 'Endpoint', render: (h) => <span className="mono">{h.url}</span> },
          { key: 'secretHint', label: 'Secret', render: (h) => <span className="mono">whsec_…{h.secretHint}</span> },
          { key: 'createdAt', label: 'Added', render: (h) => dateTime(h.createdAt) },
          { key: 'active', label: 'Active', render: (h) => <Tooltip title={write ? (h.active ? 'Pause sending' : 'Resume sending') : ''}><span><Switch size="small" checked={h.active} disabled={!write} onChange={() => toggle(h)} inputProps={{ 'aria-label': `Active ${h.url}` }} /></span></Tooltip> },
          { key: 'act', label: '', align: 'right', render: (h) => write && <Button size="small" color="error" startIcon={<DeleteOutlineOutlinedIcon />} onClick={() => setRemoving(h)}>Remove</Button> }
        ]} />

      <AppSectionCard title="Recent deliveries" icon={<HistoryOutlinedIcon />} sx={{ mt: 3 }} subtitle="Failed deliveries are retried with a growing delay, then marked failed.">
        <AppDataTable loading={deliveries.loading && !deliveries.data} rows={deliveries.data} empty={{ title: 'Nothing sent yet', message: 'Events appear here after your first message changes status.' }}
          columns={[
            { key: 'createdAt', label: 'Time', render: (d) => dateTime(d.createdAt) },
            { key: 'messageStatus', label: 'Event', render: (d) => <>message.<AppStatusChip status={d.messageStatus} /></> },
            { key: 'url', label: 'Endpoint', render: (d) => <span className="mono">{d.url}</span> },
            { key: 'status', label: 'Result', render: (d) => <AppStatusChip status={d.status} /> },
            { key: 'responseCode', label: 'HTTP', render: (d) => d.responseCode || '–' },
            { key: 'attempts', label: 'Tries' },
            { key: 'lastError', label: 'Error', render: (d) => d.lastError || '' }
          ]} />
        {deliveries.meta && deliveries.meta.total > 0 && <CustomPagination
          page={deliveries.meta.page}
          totalPages={deliveries.meta.pages}
          totalCount={deliveries.meta.total}
          pageSize={deliveries.meta.limit}
          pageSizeOptions={[10, 20, 50]}
          onPageChange={setPage}
          onPageSizeChange={(n) => { setLimit(n); setPage(1); }}
        />}
      </AppSectionCard>

      <AppSectionCard title="Verify the signature" icon={<VerifiedUserOutlinedIcon />} subtitle="Each request has an X-RelayOne-Signature header: t=<time>,v1=<HMAC-SHA256 of 't.body'>.">
        <pre className="rl-code mono" style={{ margin: 0 }}>{VERIFY}</pre>
      </AppSectionCard>
      <AddDialog open={adding} onClose={() => setAdding(false)} onCreated={hooks.reload} />
      <AppConfirmDialog open={!!removing} danger busy={busy} title="Remove this endpoint?" confirmLabel="Remove" message={removing ? `${removing.url} will stop receiving events, and its delivery history is deleted.` : ''} onConfirm={remove} onClose={() => setRemoving(null)} />
    </>
  );
}
