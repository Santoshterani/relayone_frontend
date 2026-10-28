import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, MenuItem, Tab, Tabs, Typography } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import BrushOutlinedIcon from '@mui/icons-material/BrushOutlined';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import TelegramIcon from '@mui/icons-material/Telegram';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AppTextField from '../../common/AppTextField';
import Grid from '@mui/material/Grid2';
import { AppPageHeader, AppSectionCard, AppSkeletonLoader } from '../../common';
import { useChannelTypes, useApi, useAppContext, useToast } from '../../../hooks';
import { templateService } from '../../../services';
import { extractKeys } from '../../../utils/placeholders';
import EmailDesigner from './EmailDesigner';
import ChannelText from './ChannelText';
import LivePreview from './LivePreview';
import PlaceholderTable from './PlaceholderTable';

const blank = { name: '', channel: 'email', subject: '', body: '' };
const blankVariants = { email: { mode: 'plain', design: null, html: '', htmlDirty: false }, whatsapp: '', telegram: '' };
// An email saved in HTML mode has no builder design, so its HTML is the author's own. In builder mode the HTML follows the design.
const loadEmail = (e) => ({ ...e, htmlDirty: e.mode === 'html' });

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
      setVariants({ email: loadEmail(data.variants.email), whatsapp: data.variants.whatsapp.body, telegram: data.variants.telegram.body });
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
  const [showText, setShowText] = useState(false);
  const channelTypes = useChannelTypes();
  const ch = channelTypes.of(form.channel);
  const inapp = !ch.designable; // channels without an email-style designer use the simple title + text form
  const designed = !inapp && em.mode !== 'plain';
  const showPreview = tab === 'message' || tab === 'design';

  // live preview with sample values, else default, else the placeholder itself
  const values = Object.fromEntries(keys.map((k) => [k, m(k).sampleValue || m(k).defaultValue || '']));
  const filled = useMemo(() => Object.fromEntries(Object.entries(values).filter(([, v]) => v)), [JSON.stringify(values)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (inapp && tab === 'design') setTab('message'); }, [inapp, tab]);

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Give the template a name.';
    if (ch.needsSubject && !form.subject.trim()) e.subject = `A ${ch.label.toLowerCase()} message needs a subject.`;
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
      if (!isNew) { setVariants({ email: loadEmail(data.variants.email), whatsapp: data.variants.whatsapp.body, telegram: data.variants.telegram.body }); }
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
        actions={<><Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate('/templates')}>Back</Button>{write && <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />} disabled={busy}>Save template</Button>}</>} />
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} aria-label="Template sections">
        <Tab value="message" icon={inapp ? <ChatOutlinedIcon /> : <EmailOutlinedIcon />} iconPosition="start" label={inapp ? ch.label : 'Basics'} />
        {!inapp && <Tab value="design" icon={<BrushOutlinedIcon />} iconPosition="start" label={`Email design${em.mode !== 'plain' ? ` (${em.mode === 'builder' ? 'builder' : 'HTML'})` : ''}`} />}
        <Tab value="whatsapp" icon={<ChatOutlinedIcon />} iconPosition="start" label="WhatsApp" />
        <Tab value="telegram" icon={<TelegramIcon />} iconPosition="start" label="Telegram" />
      </Tabs>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: showPreview ? 7 : 12 }}>
          {tab === 'message' && (
          <AppSectionCard title={inapp ? ch.label : 'Basics'} subtitle={inapp ? (ch.code === 'inapp' ? 'What the user sees in the bell inside your app: a short title and a line of text.' : `What is sent to ${ch.label}: an optional title and the text.`) : designed ? 'Name and channel. The subject and layout are on the Email design tab.' : 'Name, subject and body of a plain-text email. Choose Email design for a coloured layout.'}>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 8 }}><AppTextField label="Template name" required {...field('name')} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><AppTextField select label="Channel" required value={form.channel} onChange={set('channel')} disabled={!isNew} helperText={isNew ? undefined : 'Cannot change later'}>
                  {channelTypes.types.map((c) => <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>)}</AppTextField></Grid>
              </Grid>
              {!designed && <AppTextField label={`${ch.label} ${ch.needsSubject ? 'subject' : 'title'}`} required={ch.needsSubject || ch.code === 'inapp'} {...field('subject')} />}
              {!designed && <AppTextField label={`${ch.label} ${ch.designable ? 'body' : 'text'}`} required={inapp} multiline minRows={7} {...field('body')} slotProps={{ htmlInput: { className: 'mono', style: { fontSize: 13 } } }}
                helperText={errors.body || (inapp ? 'Shown in the bell. Use {name}, {order_id}… Letters, numbers and underscore only.' : 'Use {name}, {order_id}… Letters, numbers and underscore only.')} />}
              {designed && (showText
                ? <AppTextField label="Text version (optional)" multiline minRows={5} {...field('body')} slotProps={{ htmlInput: { className: 'mono', style: { fontSize: 13 } } }} helperText="Used by mail apps that cannot show the design. Leave empty and one is made from the design." />
                : <Box><Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setShowText(true)}>Edit text version</Button><Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Made automatically from the design for mail apps that cannot show it.</Typography></Box>)}
            </Box>
          </AppSectionCard>
          )}
          {tab === 'design' && (
            <AppSectionCard title="Email design" subtitle="Colours, layout and buttons for HTML email. What you build is also available as HTML in the Custom HTML tab.">
              {errors.design && <Alert severity="error" sx={{ mb: 2 }}>{errors.design}</Alert>}
              {designed && <Box sx={{ mb: 2 }}><AppTextField label="Email subject" required {...field('subject')} /></Box>}
              <EmailDesigner value={em} onChange={(email) => { setVariants((s) => ({ ...s, email })); setErrors((s) => ({ ...s, design: undefined })); }} disabled={!write} catalog={catalog.data}
                onSample={({ subject, samples }) => { if (!form.subject.trim()) setForm((f) => ({ ...f, subject })); setMeta((s) => ({ ...s, ...Object.fromEntries(Object.entries(samples).map(([k, v]) => [k, { ...(s[k] || { description: '', isRequired: true, defaultValue: '' }), sampleValue: s[k] && s[k].sampleValue ? s[k].sampleValue : v }])) })); }} />
            </AppSectionCard>
          )}
          {tab === 'whatsapp' && <AppSectionCard title="WhatsApp"><ChannelText label="WhatsApp" value={variants.whatsapp} onChange={(v) => setVariants((s) => ({ ...s, whatsapp: v }))} max={1024} disabled={!write} sampleValues={values} bubbleColor="#d9fdd3" /></AppSectionCard>}
          {tab === 'telegram' && <AppSectionCard title="Telegram"><ChannelText label="Telegram" value={variants.telegram} onChange={(v) => setVariants((s) => ({ ...s, telegram: v }))} max={4096} disabled={!write} sampleValues={values} bubbleColor="#ffffff" /></AppSectionCard>}

          <PlaceholderTable keys={keys} meta={m} setMeta={setM} disabled={!write} />
        </Grid>
        {showPreview && <Grid size={{ xs: 12, lg: 5 }}>
          <LivePreview inapp={inapp} label={inapp ? ch.label : undefined} email={em} subject={form.subject} body={form.body} values={filled} />
          {!isNew && (
            <AppSectionCard title="Send with this template">
              <pre className="rl-code mono" style={{ margin: 0 }}>{`POST /v1/messages
{ "channel": "${form.channel}",
  "to": "${ch.code === 'email' ? 'user@example.com' : ch.code === 'inapp' ? 'user-42' : 'recipient-id'}",
  "templateId": ${id},
  "variables": { ${keys.map((k) => `"${k}": "…"`).join(', ')} } }`}</pre>
            </AppSectionCard>
          )}
        </Grid>}
      </Grid>
    </Box>
  );
}
