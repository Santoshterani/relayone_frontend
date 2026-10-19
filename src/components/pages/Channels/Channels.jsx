import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, LinearProgress, MenuItem, Tab, Tabs, Typography } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import AppTextField from '../../common/AppTextField';
import Grid from '@mui/material/Grid2';
import { AppPageHeader, AppSectionCard, AppSkeletonLoader, AppStatusChip, AppConfirmDialog } from '../../common';
import { useApi, useAppContext, useToast } from '../../../hooks';
import { channelService } from '../../../services';
import { dateTime } from '../../../utils/format';
import { PROVIDERS as PRESETS } from './smtpGuides';
import SmtpGuide from './SmtpGuide';

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
  const pick = (e) => { const key = e.target.value; const p = PRESETS[key]; setForm((f) => ({ ...f, provider: key, ...(p.host ? { host: p.host, port: p.port, encryption: p.encryption } : {}), ...(p.username ? { username: p.username } : (PRESETS[f.provider] && PRESETS[f.provider].username && PRESETS[f.provider].username === f.username ? { username: '' } : {})) })); };
  const field = (k, label, props = {}) => <AppTextField label={label} value={form[k] ?? ''} onChange={set(k)} error={!!errors[k]} helperText={errors[k]} disabled={!canWrite} {...props} />;

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
  const remove = async () => { setRemoving(false); const r = await run('remove', () => channelService.removeEmail(), 'Removed. Emails go out from the shared RelayOne sender.'); if (r) onChanged(); };

  const own = data.email.mode === 'own_smtp';
  const u = usage.data;
  return (
    <AppSectionCard title="Email sender" icon={<MailOutlineIcon />} subtitle="Send from your own domain through your own SMTP server, or use the shared RelayOne sender."
      actions={<Chip size="small" color={own ? 'success' : 'default'} variant={own ? 'filled' : 'outlined'} label={own ? 'Using your SMTP' : 'Using shared sender'} />}>
      {!own && <Alert severity="info" sx={{ mb: 2 }}>Right now emails go out from the shared RelayOne address, at a slightly higher price. Connect your own SMTP server so mail comes from your domain.</Alert>}
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
          <Grid size={{ xs: 12, md: 6 }}><AppTextField select label="Provider" value={form.provider} onChange={pick} disabled={!canWrite}>{Object.entries(PRESETS).map(([k, p]) => <MenuItem key={k} value={k}>{p.label}</MenuItem>)}</AppTextField></Grid>
          <Grid size={{ xs: 12, md: 6 }}>{field('host', 'SMTP host', { placeholder: 'smtp.example.com' })}</Grid>
          <Grid size={{ xs: 6, md: 3 }}>{field('port', 'Port', { type: 'number' })}</Grid>
          <Grid size={{ xs: 6, md: 3 }}><AppTextField select label="Encryption" value={form.encryption} onChange={set('encryption')} disabled={!canWrite}><MenuItem value="starttls">STARTTLS (587)</MenuItem><MenuItem value="ssl">SSL/TLS (465)</MenuItem><MenuItem value="none">None</MenuItem></AppTextField></Grid>
          <Grid size={{ xs: 12, md: 6 }}>{field('username', 'Username', { autoComplete: 'off', helperText: errors.username || (PRESETS[form.provider] || PRESETS.custom).usernameHelp })}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{field('password', 'Password', { type: 'password', autoComplete: 'new-password', placeholder: sender ? 'Unchanged' : '', helperText: errors.password || (sender ? 'Leave empty to keep the saved password. It is stored encrypted and never shown.' : (PRESETS[form.provider] || PRESETS.custom).passwordHelp) })}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{field('fromName', 'From name')}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{field('fromEmail', 'From email', { type: 'email' })}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{field('replyTo', 'Reply-to (optional)', { type: 'email' })}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{field('dailyLimit', 'Daily sending limit', { type: 'number', helperText: errors.dailyLimit || 'Match your provider\'s limit. Extra emails wait in the queue. Empty = no limit.' })}</Grid>
        </Grid>
        <SmtpGuide guide={(PRESETS[form.provider] || PRESETS.custom).guide} />
        {canWrite && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />} disabled={!!busy}>{sender ? 'Save changes' : 'Save sender'}</Button>
            {sender && <Button variant="outlined" startIcon={<VerifiedOutlinedIcon />} onClick={verify} disabled={!!busy}>{busy === 'verify' ? 'Checking…' : 'Verify connection'}</Button>}
            {sender && <Button color="error" startIcon={<DeleteOutlineOutlinedIcon />} onClick={() => setRemoving(true)} disabled={!!busy}>Remove</Button>}
          </Box>
        )}
      </Box>
      {sender && sender.status === 'verified' && canWrite && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(240px, 320px) auto' }, gap: 1.5, mt: 3, alignItems: 'end', justifyContent: 'start' }}>
          <AppTextField
            label="Send a test email to"
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="name@example.com"
            InputProps={{ sx: { bgcolor: 'background.paper', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#C9D0E3' } } }}
          />
          <Button variant="outlined" startIcon={<SendOutlinedIcon />} onClick={sendTest} disabled={!!busy} sx={{ minHeight: 40, whiteSpace: 'nowrap' }}>{busy === 'test' ? 'Sending…' : 'Send test'}</Button>
        </Box>
      )}
      <AppConfirmDialog open={removing} danger title="Remove your SMTP sender?" confirmLabel="Remove" message="Emails will go out from the shared RelayOne sender at the shared price. You can connect your server again any time." onConfirm={remove} onClose={() => setRemoving(false)} />
    </AppSectionCard>
  );
}

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function InappCard({ data, canWrite, onChanged }) {
  const toast = useToast();
  const info = data.inapp;
  const [origins, setOrigins] = useState('');
  const [days, setDays] = useState(90);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { setOrigins((info.settings.allowedOrigins || []).join('\n')); setDays(info.settings.retentionDays); setErrors({}); }, [info.settings]);
  const apiUrl = API_URL || window.location.origin;
  const save = async (e) => {
    e.preventDefault();
    const list = origins.split(/[\s,]+/).filter(Boolean);
    setBusy(true);
    try { await channelService.saveInapp({ allowedOrigins: list, retentionDays: Number(days) }); toast.success('In-app settings saved.'); onChanged(); setErrors({}); }
    catch (err) { const fe = err.fieldErrors(); const first = Object.keys(fe).find((k) => k.startsWith('allowedOrigins'));
      if (first) setErrors({ ...fe, allowedOrigins: fe[first] }); else if (Object.keys(fe).length) setErrors(fe); else toast.error(err.message); }
    finally { setBusy(false); }
  };
  const snippet = `<div id="bell"></div>
<script src="${apiUrl}${info.widgetPath}"></script>
<script>
  RelayOneInbox.init({
    apiUrl: "${apiUrl}",
    mount: "#bell",
    // your own backend returns { token, expiresIn } for the signed-in user
    getToken: () => fetch("/notification-token").then((r) => r.json())
  });
</script>`;
  return (
    <AppSectionCard title="In-app notifications" icon={<NotificationsOutlinedIcon />} actions={<Chip size="small" color="success" label="Always on" />}
      subtitle="A bell with a live inbox for your own web app. Users who are offline find the messages waiting when they return.">
      <Typography variant="subtitle2" sx={{ mb: 1 }}>1. Your server asks for a token for the signed-in user (needs your API key)</Typography>
      <pre className="rl-code mono" style={{ margin: '0 0 16px' }}>{`POST ${info.subscriberTokenEndpoint}
{ "subscriberId": "user-42" }        // your own user id`}</pre>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>2. Add the bell to your page</Typography>
      <pre className="rl-code mono" style={{ margin: '0 0 8px', overflowX: 'auto' }}>{snippet}</pre>
      <Button size="small" sx={{ mb: 2 }} onClick={() => { navigator.clipboard && navigator.clipboard.writeText(snippet); toast.success('Copied.'); }}>Copy snippet</Button>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>3. Send with <code>channel: "inapp"</code></Typography>
      <pre className="rl-code mono" style={{ margin: '0 0 20px' }}>{`POST /v1/messages
{ "channel": "inapp", "to": "user-42", "subject": "Order shipped",
  "body": "Your order is on the way", "url": "https://yourshop.com/orders/1001" }`}</pre>
      <Box component="form" onSubmit={save} noValidate>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <AppTextField label="Your website addresses" multiline minRows={2} value={origins} onChange={(e) => setOrigins(e.target.value)} disabled={!canWrite}
              placeholder={'https://shop.example.com\nhttp://localhost:5050'} error={!!errors.allowedOrigins} helperText={errors.allowedOrigins || 'One per line. Only these websites can show the bell. Empty = any website with a valid token (fine for testing).'} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <AppTextField label="Keep notifications (days)" type="number" value={days} onChange={(e) => setDays(e.target.value)} disabled={!canWrite} error={!!errors.retentionDays} helperText={errors.retentionDays || 'Older ones are deleted automatically.'} />
          </Grid>
        </Grid>
        {canWrite && <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />} sx={{ mt: 2 }} disabled={busy}>Save settings</Button>}
      </Box>
    </AppSectionCard>
  );
}

export default function Channels() {
  const { can } = useAppContext();
  const { data, loading, error, reload } = useApi(() => channelService.getChannels(), []);
  const [tab, setTab] = useState('email');
  if (loading && !data) return <><AppPageHeader title="Channels" /><AppSkeletonLoader variant="card" /></>;
  if (error && !data) return <Alert severity="error">{error.message}</Alert>;
  return (
    <>
      <AppPageHeader title="Channels" subtitle="Where your messages are sent from." />
      <Tabs value={tab} onChange={(e, value) => setTab(value)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} aria-label="Message channels">
        <Tab value="email" icon={<MailOutlineIcon />} iconPosition="start" label="Mail" sx={{ textTransform: 'none' }} />
        <Tab value="inapp" icon={<NotificationsOutlinedIcon />} iconPosition="start" label="In-app" sx={{ textTransform: 'none' }} />
      </Tabs>
      {tab === 'email'
        ? <EmailCard data={data} canWrite={can('channels.write')} onChanged={reload} />
        : <InappCard data={data} canWrite={can('channels.write')} onChanged={reload} />}
    </>
  );
}
