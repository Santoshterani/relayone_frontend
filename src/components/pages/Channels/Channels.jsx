import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, LinearProgress, MenuItem, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AppPageHeader, AppSectionCard, AppSkeletonLoader, AppStatusChip, AppConfirmDialog } from '../../common';
import { useApi, useAppContext, useToast } from '../../../hooks';
import { channelService } from '../../../services';
import { dateTime } from '../../../utils/format';

const PRESETS = {
  gmail: { label: 'Gmail / Google Workspace', host: 'smtp.gmail.com', port: 587, encryption: 'starttls' },
  m365: { label: 'Microsoft 365', host: 'smtp.office365.com', port: 587, encryption: 'starttls' },
  ses: { label: 'Amazon SES', host: 'email-smtp.us-east-1.amazonaws.com', port: 587, encryption: 'starttls' },
  sendgrid: { label: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, encryption: 'starttls', username: 'apikey' },
  custom: { label: 'Other SMTP server' }
};
const empty = { provider: 'custom', host: '', port: 587, encryption: 'starttls', username: '', password: '', fromName: '', fromEmail: '', replyTo: '', dailyLimit: 2000 };

function EmailCard({ data, canWrite, onChanged }) {
  const toast = useToast();
  const sender = data.email.sender;
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState('');
  const [testTo, setTestTo] = useState('');
  const [removing, setRemoving] = useState(false);
  const usage = useApi(() => channelService.emailUsage(), [sender && sender.status]);

  useEffect(() => {
    setForm(sender ? { provider: sender.provider, host: sender.host, port: sender.port, encryption: sender.encryption, username: sender.username, password: '', fromName: sender.fromName, fromEmail: sender.fromEmail, replyTo: sender.replyTo || '', dailyLimit: sender.dailyLimit ?? '' } : empty);
    setErrors({});
  }, [sender]);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((s) => ({ ...s, [k]: undefined })); };
  const pick = (e) => { const key = e.target.value; const p = PRESETS[key]; setForm((f) => ({ ...f, provider: key, ...(p.host ? { host: p.host, port: p.port, encryption: p.encryption } : {}), ...(p.username ? { username: p.username } : {}) })); };
  const field = (k, label, props = {}) => <TextField label={label} value={form[k] ?? ''} onChange={set(k)} error={!!errors[k]} helperText={errors[k]} disabled={!canWrite} {...props} />;

  const run = async (name, fn, okText) => {
    setBusy(name);
    try { const r = await fn(); if (okText) toast.success(okText); return r; } catch (err) { const fe = err.fieldErrors(); if (Object.keys(fe).length) setErrors(fe); else toast.error(err.message); return null; } finally { setBusy(''); }
  };
  const save = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.host.trim()) found.host = 'Enter the SMTP host.';
    if (!form.username.trim()) found.username = 'Enter the SMTP username.';
    if (!sender && !form.password) found.password = 'Enter the SMTP password.';
    if (!form.fromName.trim()) found.fromName = 'Enter the sender name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.fromEmail.trim())) found.fromEmail = 'Enter a valid sender email.';
    if (Object.keys(found).length) { setErrors(found); return; }
    const body = { provider: form.provider, host: form.host.trim(), port: Number(form.port), encryption: form.encryption, username: form.username.trim(), password: form.password, fromName: form.fromName.trim(), fromEmail: form.fromEmail.trim(), replyTo: form.replyTo.trim() || null, dailyLimit: form.dailyLimit === '' ? null : Number(form.dailyLimit) };
    const r = await run('save', () => channelService.saveEmail(body), 'Saved. Now verify the connection.');
    if (r) onChanged();
  };
  const verify = async () => { const r = await run('verify', () => channelService.verifyEmail()); if (r) { onChanged(); const s = r.data.email.sender; if (s.status === 'verified') toast.success('Connected. Your emails now send from your own server.'); } };
  const sendTest = async () => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testTo.trim())) { toast.error('Enter an email address to send the test to.'); return; } await run('test', () => channelService.testEmail(testTo.trim()), `Test email sent to ${testTo.trim()}.`); };
  const remove = async () => { setRemoving(false); const r = await run('remove', () => channelService.removeEmail(), 'Removed. Emails go out from the shared RelayLite sender.'); if (r) onChanged(); };

  const own = data.email.mode === 'own_smtp';
  const u = usage.data;
  return (
    <AppSectionCard title="Email sender" subtitle="Send from your own domain through your own SMTP server, or use the shared RelayLite sender."
      actions={<Chip size="small" color={own ? 'success' : 'default'} variant={own ? 'filled' : 'outlined'} label={own ? 'Using your SMTP' : 'Using shared sender'} />}>
      {!own && <Alert severity="info" sx={{ mb: 2 }}>Right now emails go out from the shared RelayLite address, at a slightly higher price. Connect your own SMTP server so mail comes from your domain.</Alert>}
      {own && u && u.dailyLimit != null && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="caption" color="text.secondary">Sent in the last 24 hours</Typography><Typography variant="caption"><b>{u.sentLast24h}</b> of {u.dailyLimit}</Typography></Box>
          <LinearProgress variant="determinate" value={Math.min(100, (u.sentLast24h / u.dailyLimit) * 100)} color={u.remaining === 0 ? 'warning' : 'primary'} sx={{ height: 6, borderRadius: 3, mt: 0.5 }} />
          {u.remaining === 0 && <Typography variant="caption" color="warning.main">Daily limit reached. New emails wait in the queue and go out as older ones pass the 24 hour mark.</Typography>}
        </Box>
      )}
      {sender && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <AppStatusChip status={sender.status} />
          {sender.status === 'verified' && <Typography variant="caption" color="text.secondary">Verified {dateTime(sender.verifiedAt)}</Typography>}
          {sender.status === 'failed' && <Typography variant="caption" color="error">{sender.lastError}</Typography>}
          {sender.status === 'unverified' && <Typography variant="caption" color="text.secondary">Saved but not verified yet. Messages still use the shared sender until you verify.</Typography>}
        </Box>
      )}
      <Box component="form" onSubmit={save} noValidate>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}><TextField select label="Provider" value={form.provider} onChange={pick} disabled={!canWrite}>{Object.entries(PRESETS).map(([k, p]) => <MenuItem key={k} value={k}>{p.label}</MenuItem>)}</TextField></Grid>
          <Grid size={{ xs: 12, md: 6 }}>{field('host', 'SMTP host', { placeholder: 'smtp.example.com' })}</Grid>
          <Grid size={{ xs: 6, md: 3 }}>{field('port', 'Port', { type: 'number' })}</Grid>
          <Grid size={{ xs: 6, md: 3 }}><TextField select label="Encryption" value={form.encryption} onChange={set('encryption')} disabled={!canWrite}><MenuItem value="starttls">STARTTLS (587)</MenuItem><MenuItem value="ssl">SSL/TLS (465)</MenuItem><MenuItem value="none">None</MenuItem></TextField></Grid>
          <Grid size={{ xs: 12, md: 3 }}>{field('username', 'Username', { autoComplete: 'off' })}</Grid>
          <Grid size={{ xs: 12, md: 3 }}>{field('password', 'Password', { type: 'password', autoComplete: 'new-password', placeholder: sender ? 'Unchanged' : '', helperText: errors.password || (sender ? 'Leave empty to keep the saved password. It is stored encrypted and never shown.' : 'Stored encrypted.') })}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{field('fromName', 'From name')}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{field('fromEmail', 'From email', { type: 'email' })}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{field('replyTo', 'Reply-to (optional)', { type: 'email' })}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{field('dailyLimit', 'Daily sending limit', { type: 'number', helperText: errors.dailyLimit || 'Match your provider\'s limit. Extra emails wait in the queue. Empty = no limit.' })}</Grid>
        </Grid>
        {canWrite && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            <Button type="submit" variant="contained" disabled={!!busy}>{sender ? 'Save changes' : 'Save sender'}</Button>
            {sender && <Button variant="outlined" onClick={verify} disabled={!!busy}>{busy === 'verify' ? 'Checking…' : 'Verify connection'}</Button>}
            {sender && <Button color="error" onClick={() => setRemoving(true)} disabled={!!busy}>Remove</Button>}
          </Box>
        )}
      </Box>
      {sender && sender.status === 'verified' && canWrite && (
        <Box sx={{ display: 'flex', gap: 1, mt: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TextField label="Send a test email to" value={testTo} onChange={(e) => setTestTo(e.target.value)} sx={{ maxWidth: 320 }} />
          <Button variant="outlined" onClick={sendTest} disabled={!!busy} sx={{ mt: 0.25 }}>{busy === 'test' ? 'Sending…' : 'Send test'}</Button>
        </Box>
      )}
      <AppConfirmDialog open={removing} danger title="Remove your SMTP sender?" confirmLabel="Remove" message="Emails will go out from the shared RelayLite sender at the shared price. You can connect your server again any time." onConfirm={remove} onClose={() => setRemoving(false)} />
    </AppSectionCard>
  );
}

export default function Channels() {
  const { can } = useAppContext();
  const { data, loading, error, reload } = useApi(() => channelService.getChannels(), []);
  if (loading && !data) return <><AppPageHeader title="Channels" /><AppSkeletonLoader variant="card" /></>;
  if (error && !data) return <Alert severity="error">{error.message}</Alert>;
  return (
    <>
      <AppPageHeader title="Channels" subtitle="Where your messages are sent from." />
      <EmailCard data={data} canWrite={can('channels.write')} onChanged={reload} />
      <AppSectionCard title="In-app notifications" actions={<Chip size="small" color="success" label="Always on" />}
        subtitle="Push messages to your own web app in real time. Users who are offline find them in their inbox.">
        <Typography sx={{ mb: 1 }}>1. Your server asks for a short-lived token for one of your users (needs your API key):</Typography>
        <pre className="rl-code mono" style={{ margin: '0 0 12px' }}>{`POST /v1/subscriber-tokens
{ "subscriberId": "user-42" }        // your own user id`}</pre>
        <Typography sx={{ mb: 1 }}>2. Your web page connects with that token and listens:</Typography>
        <pre className="rl-code mono" style={{ margin: '0 0 12px' }}>{`const socket = io("API_URL", { auth: { token } });
socket.on("notification", (n) => show(n.title, n.body));`}</pre>
        <Typography>3. Send with <code>channel: "inapp"</code> and <code>to: "user-42"</code>. Online users get it instantly; offline users read it later from <code>GET /v1/inbox</code>.</Typography>
      </AppSectionCard>
    </>
  );
}
