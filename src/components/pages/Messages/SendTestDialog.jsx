import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Typography } from '@mui/material';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import AppTextField from '../../common/AppTextField';
import { useAppContext, useChannelTypes, useToast } from '../../../hooks';
import { messageService, templateService } from '../../../services';

const RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Send one message through the real pipeline from the portal (charged like any other). */
export default function SendTestDialog({ open, onClose, onSent }) {
  const { can } = useAppContext();
  const toast = useToast();
  const channelTypes = useChannelTypes();
  const [channel, setChannel] = useState('email');
  const ch = channelTypes.of(channel);
  const [to, setTo] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [vars, setVars] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open && can('templates.read')) templateService.listTemplates().then((r) => setTemplates(r.data)).catch(() => setTemplates([])); }, [open, can]);
  const usable = templates.filter((t) => t.channel === channel);
  const tpl = usable.find((t) => t.id === templateId);
  useEffect(() => { setTemplateId(''); setVars({}); setErrors({}); }, [channel]);

  const close = () => { setTo(''); setSubject(''); setText(''); setTemplateId(''); setVars({}); setErrors({}); onClose(); };
  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (channel === 'email' && !RE.test(to.trim())) found.to = 'Enter a valid email address.';
    if (channel !== 'email' && !to.trim()) found.to = 'Enter the recipient.';
    if (!tpl) { if (ch.needsSubject && !subject.trim()) found.subject = 'Enter a subject.'; if (!text.trim()) found.body = 'Write the message.'; }
    if (tpl) tpl.placeholders.filter((p) => p.required && !p.defaultValue && !(vars[p.key] || '').trim()).forEach((p) => { found[`variables.${p.key}`] = 'Required'; });
    if (Object.keys(found).length) { setErrors(found); return; }
    setBusy(true);
    try {
      const body = { channel, to: to.trim(), ...(tpl ? { templateId: tpl.id, variables: vars } : { subject: subject.trim(), body: text }) };
      const { data } = await messageService.sendTest(body);
      toast.success(`Queued ${data.id}`); close(); onSent();
    } catch (err) { const fe = err.fieldErrors(); if (Object.keys(fe).length) setErrors(fe); else setErrors({ form: err.message }); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : close} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle sx={{ fontSize: 16 }}>Send a test message</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
          <Typography color="text.secondary">Goes through the same pipeline and price as an API call.</Typography>
          {errors.form && <Alert severity="error">{errors.form}</Alert>}
          <AppTextField select label="Channel" value={channel} onChange={(e) => setChannel(e.target.value)}>{channelTypes.types.map((c) => <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>)}</AppTextField>
          <AppTextField label={channel === 'email' ? 'To (email address)' : channel === 'inapp' ? 'To (your user id)' : 'To (recipient)'} value={to} onChange={(e) => { setTo(e.target.value); setErrors((s) => ({ ...s, to: undefined })); }} error={!!errors.to} helperText={errors.to} autoFocus />
          {usable.length > 0 && <AppTextField select label="Template" value={templateId} onChange={(e) => setTemplateId(e.target.value)} helperText="Or leave empty to write the message here."><MenuItem value="">No template</MenuItem>{usable.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}</AppTextField>}
          {tpl ? tpl.placeholders.map((p) => (
            <AppTextField key={p.key} label={`{${p.key}}${p.required && !p.defaultValue ? ' *' : ''}`} value={vars[p.key] || ''} placeholder={p.defaultValue || p.sampleValue || ''} onChange={(e) => { setVars((v) => ({ ...v, [p.key]: e.target.value })); setErrors((s) => ({ ...s, [`variables.${p.key}`]: undefined })); }}
              error={!!errors[`variables.${p.key}`]} helperText={errors[`variables.${p.key}`] || p.description} />
          )) : (
            <>
              {ch.needsSubject && <AppTextField label="Subject" value={subject} onChange={(e) => { setSubject(e.target.value); setErrors((s) => ({ ...s, subject: undefined })); }} error={!!errors.subject} helperText={errors.subject} />}
              <AppTextField label="Message" multiline minRows={4} value={text} onChange={(e) => { setText(e.target.value); setErrors((s) => ({ ...s, body: undefined })); }} error={!!errors.body} helperText={errors.body} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={close} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" disabled={busy} startIcon={<SendOutlinedIcon />}>Send</Button></DialogActions>
      </Box>
    </Dialog>
  );
}
