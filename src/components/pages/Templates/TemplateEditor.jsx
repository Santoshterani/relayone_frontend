import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, MenuItem, Switch, Tab, Tabs, TextField, Typography, Paper, FormControlLabel } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AppPageHeader, AppSectionCard, AppSkeletonLoader } from '../../common';
import { useApi, useAppContext, useToast } from '../../../hooks';
import { templateService } from '../../../services';
import { extractKeys, render } from '../../../utils/placeholders';
import EmailDesigner from './EmailDesigner';
import ChannelText from './ChannelText';

const blank = { name: '', channel: 'email', subject: '', body: '' };
const blankVariants = { email: { mode: 'plain', design: null, html: '' }, whatsapp: '', telegram: '' };

export default function TemplateEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAppContext();
  const write = can('templates.write');
  const [form, setForm] = useState(blank);
  const [variants, setVariants] = useState(blankVariants);
  const [tab, setTab] = useState('message');
  const catalog = useApi(() => templateService.getCatalog(), []);
  const [meta, setMeta] = useState({}); // key -> { description, isRequired, defaultValue, sampleValue }
  const [loading, setLoading] = useState(!isNew);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (isNew) { setForm(blank); setVariants(blankVariants); setMeta({}); setLoading(false); return; }
    setLoading(true);
    templateService.getTemplate(id).then(({ data }) => {
      setForm({ name: data.name, channel: data.channel, subject: data.subject, body: data.body });
      setVariants({ email: data.variants.email, whatsapp: data.variants.whatsapp.body, telegram: data.variants.telegram.body });
      setMeta(Object.fromEntries(data.placeholders.map((p) => [p.key, { description: p.description, isRequired: p.required, defaultValue: p.defaultValue || '', sampleValue: p.sampleValue || '' }])));
    }).catch((e) => setLoadError(e.message)).finally(() => setLoading(false));
  }, [id, isNew]);

  const em = variants.email;
  // Same rule as the server: placeholders from the text, the email design or HTML, and the WhatsApp / Telegram text.
  const keys = useMemo(() => extractKeys(form.subject, form.body, em.mode === 'builder' ? JSON.stringify(em.design && em.design.blocks) : '', em.mode === 'html' ? em.html : '', variants.whatsapp, variants.telegram),
    [form.subject, form.body, em, variants.whatsapp, variants.telegram]);
  const m = (k) => meta[k] || { description: '', isRequired: true, defaultValue: '', sampleValue: '' };
  const setM = (k, patch) => setMeta((s) => ({ ...s, [k]: { ...m(k), ...patch } }));
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((s) => ({ ...s, [k]: undefined })); };
  const inapp = form.channel === 'inapp';
  const designed = !inapp && em.mode !== 'plain';

  // live preview with sample values, else default, else the placeholder itself
  const values = Object.fromEntries(keys.map((k) => [k, m(k).sampleValue || m(k).defaultValue || '']));
  const filled = useMemo(() => Object.fromEntries(Object.entries(values).filter(([, v]) => v)), [JSON.stringify(values)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (inapp && tab === 'design') setTab('message'); }, [inapp, tab]);
  const previewSubject = render(form.subject, values); const previewBody = render(form.body, values);

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Give the template a name.';
    if (!inapp && !form.subject.trim()) e.subject = 'An email needs a subject.';
    if (!designed && !form.body.trim()) e.body = 'Write the message text.';
    if (designed && em.mode === 'builder' && !(em.design && em.design.blocks.length)) { e.design = 'Add at least one block to the email design.'; setTab('design'); }
    if (designed && em.mode === 'html' && !String(em.html || '').trim()) { e.design = 'Paste the HTML for the email.'; setTab('design'); }
    setErrors(e); return !Object.keys(e).length;
  };
  const save = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const v = {
        ...(inapp ? {} : { email: em.mode === 'builder' ? { mode: 'builder', design: em.design } : em.mode === 'html' ? { mode: 'html', html: em.html } : { mode: 'plain' } }),
        whatsapp: { body: variants.whatsapp }, telegram: { body: variants.telegram }
      };
      const payload = { name: form.name.trim(), subject: form.subject.trim(), body: form.body, variants: v };
      const { data } = isNew ? await templateService.createTemplate({ ...payload, channel: form.channel }) : await templateService.updateTemplate(id, payload);
      if (data.placeholders.length) {
        await templateService.savePlaceholders(data.id, data.placeholders.map((p) => ({ key: p.key, description: m(p.key).description || '', isRequired: m(p.key).isRequired, defaultValue: m(p.key).defaultValue || '', sampleValue: m(p.key).sampleValue || '' })));
      }
      if (!isNew) { setVariants({ email: data.variants.email, whatsapp: data.variants.whatsapp.body, telegram: data.variants.telegram.body }); }
      toast.success('Template saved.');
      if (isNew) navigate(`/templates/${data.id}`, { replace: true });
    } catch (err) {
      const fe = err.fieldErrors();
      if (Object.keys(fe).length) setErrors(fe); else if (err.status === 409) setErrors({ name: err.message }); else toast.error(err.message);
    } finally { setBusy(false); }
  };

  if (loading) return <><AppPageHeader title="Template" /><AppSkeletonLoader variant="card" /></>;
  if (loadError) return <Alert severity="error">{loadError}</Alert>;
  const field = (k) => ({ value: form[k], onChange: set(k), error: !!errors[k], helperText: errors[k], disabled: !write });

  return (
    <Box component="form" onSubmit={save} noValidate>
      <AppPageHeader title={isNew ? 'New template' : form.name || 'Template'} subtitle={isNew ? 'Write the message and mark placeholders with {braces}.' : `Template id ${id}. Use it as templateId in the API.`}
        actions={<><Button onClick={() => navigate('/templates')}>Back</Button>{write && <Button type="submit" variant="contained" disabled={busy}>Save template</Button>}</>} />
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} aria-label="Template sections">
        <Tab value="message" label="Message" />
        {!inapp && <Tab value="design" label={`Email design${em.mode !== 'plain' ? ` (${em.mode === 'builder' ? 'builder' : 'HTML'})` : ''}`} />}
        <Tab value="whatsapp" label="WhatsApp" />
        <Tab value="telegram" label="Telegram" />
      </Tabs>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: tab === 'design' ? 12 : 7 }}>
          {tab === 'message' && (
          <AppSectionCard title="Message" subtitle={designed ? 'The plain-text version. For a designed email it is only used as the text part, and can stay empty.' : undefined}>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 8 }}><TextField label="Template name" {...field('name')} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><TextField select label="Channel" value={form.channel} onChange={set('channel')} disabled={!isNew} helperText={isNew ? undefined : 'Cannot change later'}>
                  <MenuItem value="email">Email</MenuItem><MenuItem value="inapp">In-app</MenuItem></TextField></Grid>
              </Grid>
              <TextField label={inapp ? 'Notification title' : 'Email subject'} {...field('subject')} />
              <TextField label={inapp ? 'Notification text' : designed ? 'Plain-text version (optional)' : 'Email body'} multiline minRows={7} {...field('body')} slotProps={{ htmlInput: { className: 'mono', style: { fontSize: 13 } } }}
                helperText={errors.body || 'Use {name}, {order_id}… Letters, numbers and underscore only.'} />
            </Box>
          </AppSectionCard>
          )}
          {tab === 'design' && (
            <AppSectionCard title="Email design" subtitle="Colours, layout and buttons for HTML email. Industry layouts (e-commerce, fintech…) are one click away.">
              {errors.design && <Alert severity="error" sx={{ mb: 2 }}>{errors.design}</Alert>}
              <EmailDesigner value={em} onChange={(email) => { setVariants((s) => ({ ...s, email })); setErrors((s) => ({ ...s, design: undefined })); }} disabled={!write}
                subject={form.subject} body={form.body} sampleValues={filled} catalog={catalog.data}
                onSample={({ subject, samples }) => { if (!form.subject.trim()) setForm((f) => ({ ...f, subject })); setMeta((s) => ({ ...s, ...Object.fromEntries(Object.entries(samples).map(([k, v]) => [k, { ...(s[k] || { description: '', isRequired: true, defaultValue: '' }), sampleValue: s[k] && s[k].sampleValue ? s[k].sampleValue : v }])) })); }} />
            </AppSectionCard>
          )}
          {tab === 'whatsapp' && <AppSectionCard title="WhatsApp"><ChannelText label="WhatsApp" value={variants.whatsapp} onChange={(v) => setVariants((s) => ({ ...s, whatsapp: v }))} max={1024} disabled={!write} sampleValues={values} bubbleColor="#d9fdd3" /></AppSectionCard>}
          {tab === 'telegram' && <AppSectionCard title="Telegram"><ChannelText label="Telegram" value={variants.telegram} onChange={(v) => setVariants((s) => ({ ...s, telegram: v }))} max={4096} disabled={!write} sampleValues={values} bubbleColor="#ffffff" /></AppSectionCard>}

          <AppSectionCard title="Placeholders" subtitle="Found automatically in the subject, text, email design and WhatsApp or Telegram text. Describe each one so your team knows what to send.">
            {keys.length === 0 ? <Typography color="text.secondary">No placeholders yet. Type <code>{'{name}'}</code> in the text above.</Typography> : (
              <>
                <Alert severity="info" sx={{ mb: 1.5 }}>At send time: the value from the API call is used; if missing, the default; if there is no default and the placeholder is required, the call is rejected with <code>422 missing_template_variables</code>.</Alert>
                {keys.map((k) => (
                  <Paper key={k} variant="outlined" sx={{ p: 1.5, mb: 1.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <span className="mono" style={{ fontWeight: 500 }}>{`{${k}}`}</span>
                      <FormControlLabel sx={{ m: 0 }} label={<Typography variant="caption">{m(k).isRequired ? 'Required' : 'Optional'}</Typography>}
                        control={<Switch size="small" checked={m(k).isRequired} onChange={(e) => setM(k, { isRequired: e.target.checked })} disabled={!write} inputProps={{ 'aria-label': `${k} required` }} />} />
                    </Box>
                    <Grid container spacing={1.5}>
                      <Grid size={12}><TextField label="Description" value={m(k).description} onChange={(e) => setM(k, { description: e.target.value })} placeholder="What goes here?" disabled={!write} inputProps={{ 'aria-label': `Description of ${k}` }} /></Grid>
                      <Grid size={{ xs: 12, sm: 6 }}><TextField label="Default value" value={m(k).defaultValue} onChange={(e) => setM(k, { defaultValue: e.target.value })} disabled={!write} inputProps={{ 'aria-label': `Default of ${k}` }} /></Grid>
                      <Grid size={{ xs: 12, sm: 6 }}><TextField label="Sample (preview only)" value={m(k).sampleValue} onChange={(e) => setM(k, { sampleValue: e.target.value })} disabled={!write} inputProps={{ 'aria-label': `Sample of ${k}` }} /></Grid>
                    </Grid>
                  </Paper>
                ))}
              </>
            )}
          </AppSectionCard>
        </Grid>
        {tab !== 'design' && <Grid size={{ xs: 12, lg: 5 }}>
          <AppSectionCard title="Preview" subtitle="Uses the sample value, else the default.">
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }} aria-live="polite">
              <Typography variant="caption" color="text.secondary">{inapp ? 'Title' : 'Subject'}</Typography>
              <Typography sx={{ fontWeight: 600, mb: 1.5 }}>{previewSubject || '–'}</Typography>
              <Typography variant="caption" color="text.secondary">{inapp ? 'Text' : 'Body'}</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{previewBody || '–'}</Typography>
            </Paper>
          </AppSectionCard>
          {!isNew && (
            <AppSectionCard title="Send with this template">
              <pre className="rl-code mono" style={{ margin: 0 }}>{`POST /v1/messages
{ "channel": "${form.channel}",
  "to": "${inapp ? 'user-42' : 'user@example.com'}",
  "templateId": ${id},
  "variables": { ${keys.map((k) => `"${k}": "…"`).join(', ')} } }`}</pre>
            </AppSectionCard>
          )}
        </Grid>}
      </Grid>
    </Box>
  );
}
