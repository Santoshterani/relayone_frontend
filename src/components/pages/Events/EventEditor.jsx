import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, IconButton, Radio, Switch, Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import AppTextField from '../../common/AppTextField';
import { AppPageHeader, AppSectionCard, AppSkeletonLoader } from '../../common';
import { useAppContext, useToast } from '../../../hooks';
import { eventService, templateService } from '../../../services';
import { openPopup } from '../../../utils/relayonePopup';
import DeveloperSnippet from './DeveloperSnippet';

const COLORS = ['#12285E', '#2563EB', '#0F172A', '#067647', '#B42318'];
const blank = { name: '', key: '', channel: 'email', mode: 'choose', status: 'active', templateIds: [], defaultTemplateId: null, fields: [], brand: { name: '', logoUrl: '', color: '#12285E' }, origins: '' };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^[^a-z]+/, '').slice(0, 60);

/** Same rule as the server: which data fields each chosen template needs, which are missing, which are not used. */
function analyse(templates, fields) {
  const have = new Set(fields.map((f) => f.key)); const used = {}; const missing = {};
  for (const t of templates) for (const p of t.placeholders) {
    (used[p.key] = used[p.key] || []).push(t.name);
    if (p.required && !p.defaultValue && !have.has(p.key)) (missing[p.key] = missing[p.key] || { usedIn: [], sample: p.sampleValue || '' }).usedIn.push(t.name);
  }
  return { used, missing };
}

export default function EventEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const { can, user } = useAppContext();
  const write = can('templates.write');
  const [form, setForm] = useState(blank);
  const [keyTouched, setKeyTouched] = useState(false);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [snippet, setSnippet] = useState(false);
  const [saved, setSaved] = useState(null);

  const apply = (e) => {
    setSaved(e);
    setForm({ name: e.name, key: e.key, channel: e.channel, mode: e.mode, status: e.status, templateIds: e.templates.map((t) => t.id), defaultTemplateId: e.defaultTemplateId, fields: e.fields.map((f) => ({ key: f.key, sample: f.sample })),
      brand: { name: e.brand.name, logoUrl: e.brand.logoUrl, color: e.brand.color }, origins: e.allowedOrigins.join('\n') });
  };
  useEffect(() => {
    if (isNew) { setForm(blank); setLoading(false); return; }
    setLoading(true);
    eventService.getEvent(id).then(({ data }) => apply(data)).catch((e) => setLoadError(e.message)).finally(() => setLoading(false));
  }, [id, isNew]);
  useEffect(() => { templateService.listTemplates(form.channel).then(({ data }) => setAvailable(data)).catch(() => setAvailable([])); }, [form.channel]);

  const chosen = useMemo(() => available.filter((t) => form.templateIds.includes(t.id)), [available, form.templateIds]);
  const { used, missing } = useMemo(() => analyse(chosen, form.fields), [chosen, form.fields]);
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((s) => ({ ...s, [k]: undefined })); };
  const setBrand = (k, v) => setForm((f) => ({ ...f, brand: { ...f.brand, [k]: v } }));

  const toggleTemplate = (t) => setForm((f) => {
    const on = f.templateIds.includes(t.id); const ids = on ? f.templateIds.filter((x) => x !== t.id) : [...f.templateIds, t.id];
    return { ...f, templateIds: ids, defaultTemplateId: ids.includes(f.defaultTemplateId) ? f.defaultTemplateId : (ids[0] || null) };
  });
  const setField = (i, patch) => setForm((f) => ({ ...f, fields: f.fields.map((x, k) => (k === i ? { ...x, ...patch } : x)) }));
  const addMissing = () => setForm((f) => ({ ...f, fields: [...f.fields, ...Object.entries(missing).map(([key, m]) => ({ key, sample: m.sample }))] }));

  const save = async (e) => {
    e && e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Give the event a name.';
    if (isNew && !/^[a-z][a-z0-9_]{1,62}$/.test(form.key)) errs.key = 'Use lowercase letters, numbers and underscores, starting with a letter.';
    if (form.status === 'active' && !form.templateIds.length) errs.templateIds = 'Pick at least one template, or pause the event.';
    if (form.fields.some((f) => !/^\w{1,64}$/.test(f.key))) errs.fields = 'Field names use letters, numbers and underscores only.';
    setErrors(errs); if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const body = { name: form.name.trim(), mode: form.mode, status: form.status, templateIds: form.templateIds, defaultTemplateId: form.defaultTemplateId, fields: form.fields.map((f) => ({ key: f.key, sample: f.sample || '' })),
        brand: { name: form.brand.name.trim(), logoUrl: form.brand.logoUrl.trim(), color: form.brand.color }, allowedOrigins: form.origins.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean) };
      const { data } = isNew ? await eventService.createEvent({ ...body, key: form.key, channel: form.channel }) : await eventService.updateEvent(id, body);
      toast.success('Event saved.');
      if (isNew) navigate(`/events/${data.id}`, { replace: true }); else apply(data);
    } catch (err) {
      const fe = err.fieldErrors ? err.fieldErrors() : {};
      if (Object.keys(fe).length) setErrors({ ...fe, origins: fe.allowedOrigins }); else if (err.status === 409) setErrors({ [/key/i.test(err.message) ? 'key' : 'name']: err.message }); else if (/websites?|address/i.test(err.message)) setErrors({ origins: err.message }); else toast.error(err.message);
    } finally { setBusy(false); }
  };
  const test = async () => {
    try { const { data } = await eventService.testEvent(id, user.email); await openPopup({ session: data.id, onClose: () => eventService.getEvent(id).then((r) => apply(r.data)) }); } catch (err) { toast.error(err.message); }
  };

  if (loading) return <><AppPageHeader title="Event" /><AppSkeletonLoader variant="card" /></>;
  if (loadError) return <Alert severity="error">{loadError}</Alert>;
  const field = (k) => ({ value: form[k], onChange: set(k), error: !!errors[k], helperText: errors[k], disabled: !write });
  const dirty = saved && JSON.stringify({ ...form, origins: form.origins.trim() }) !== JSON.stringify((() => ({ name: saved.name, key: saved.key, channel: saved.channel, mode: saved.mode, status: saved.status, templateIds: saved.templates.map((t) => t.id), defaultTemplateId: saved.defaultTemplateId, fields: saved.fields.map((f) => ({ key: f.key, sample: f.sample })), brand: { ...saved.brand }, origins: saved.allowedOrigins.join('\n') }))());
  const missingKeys = Object.keys(missing);

  return (
    <Box component="form" onSubmit={save} noValidate>
      <AppPageHeader title={isNew ? 'New event' : form.name || 'Event'} subtitle={isNew ? 'Say what should be sent when something happens on your website.' : <>Event key <span className="mono">{form.key}</span>. Your developer uses this key once.</>}
        actions={<>
          <Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate('/events')}>Back</Button>
          {!isNew && <Button startIcon={<CodeOutlinedIcon />} onClick={() => setSnippet(true)}>Developer snippet</Button>}
          {!isNew && write && <Button startIcon={<PlayArrowOutlinedIcon />} onClick={test} disabled={dirty || !form.templateIds.length} title={dirty ? 'Save your changes first' : undefined}>Send a test</Button>}
          {write && <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />} disabled={busy}>{busy ? 'Saving…' : 'Save event'}</Button>}
        </>} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <AppSectionCard title="1. What is this event?">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><AppTextField label="Event name" required {...field('name')} onChange={(e) => { const name = e.target.value; setForm((f) => ({ ...f, name, ...(isNew && !keyTouched ? { key: slug(name) } : {}) })); setErrors((s) => ({ ...s, name: undefined })); }} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><AppTextField label="Event key" required {...field('key')} onChange={(e) => { setKeyTouched(true); set('key')(e); }} disabled={!isNew || !write} helperText={errors.key || (isNew ? 'Your developer uses this name. It cannot be changed later.' : 'Cannot be changed.')} slotProps={{ htmlInput: { className: 'mono' } }} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.75 }}>Channel</Typography>
                <ToggleButtonGroup size="small" exclusive value={form.channel} onChange={(e, v) => { if (v && isNew) setForm((f) => ({ ...f, channel: v, templateIds: [], defaultTemplateId: null })); }} aria-label="Channel" disabled={!isNew}>
                  <ToggleButton value="email" sx={{ px: 2 }}><EmailOutlinedIcon sx={{ mr: 0.75, fontSize: 18 }} />Email</ToggleButton>
                  <ToggleButton value="inapp" sx={{ px: 2 }}><NotificationsOutlinedIcon sx={{ mr: 0.75, fontSize: 18 }} />In-app</ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                <FormControlLabel control={<Switch checked={form.status === 'active'} onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? 'active' : 'paused' }))} disabled={!write} />} label={form.status === 'active' ? 'Active' : 'Paused (calls are refused)'} />
              </Grid>
            </Grid>
          </AppSectionCard>

          <AppSectionCard title="2. Which templates can be used?" subtitle={`Only ${form.channel === 'email' ? 'email' : 'in-app'} templates are listed. Create more under Templates.`}>
            {errors.templateIds && <Alert severity="error" sx={{ mb: 1.5 }}>{errors.templateIds}</Alert>}
            {!available.length ? <Alert severity="info">You have no {form.channel === 'email' ? 'email' : 'in-app'} templates yet. <Button size="small" onClick={() => navigate('/templates/new')}>Create one</Button></Alert> : (
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden', mb: 2 }}>
                {available.map((t, i) => {
                  const on = form.templateIds.includes(t.id);
                  return (
                    <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderTop: i ? 1 : 0, borderColor: 'divider', bgcolor: on ? 'action.hover' : 'transparent' }}>
                      <Checkbox checked={on} onChange={() => toggleTemplate(t)} disabled={!write} inputProps={{ 'aria-label': `Use ${t.name}` }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}><Typography sx={{ fontWeight: on ? 600 : 400 }}>{t.name}</Typography><Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{t.subject || '–'}</Typography></Box>
                      {on && (form.defaultTemplateId === t.id ? <Chip size="small" color="primary" label="Default" /> : <Button size="small" onClick={() => setForm((f) => ({ ...f, defaultTemplateId: t.id }))} disabled={!write}>Make default</Button>)}
                    </Box>
                  );
                })}
              </Box>
            )}
            <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.75 }}>Who decides which one is sent?</Typography>
            <Grid container spacing={1.5}>
              {[['choose', 'Let the person choose', 'A popup shows the templates above before sending.'], ['default', 'Always send the default', 'No popup. Sent automatically.']].map(([v, t, d]) => (
                <Grid key={v} size={{ xs: 12, sm: 6 }}>
                  <Box component="label" sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', p: 1.5, border: form.mode === v ? 2 : 1, borderColor: form.mode === v ? 'primary.main' : 'divider', borderRadius: 1.5, cursor: write ? 'pointer' : 'default', height: '100%', boxSizing: 'border-box' }}>
                    <Radio size="small" checked={form.mode === v} onChange={() => setForm((f) => ({ ...f, mode: v }))} disabled={!write} sx={{ p: 0.25 }} />
                    <Box><Typography sx={{ fontWeight: 600 }}>{t}</Typography><Typography variant="caption" color="text.secondary">{d}</Typography></Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </AppSectionCard>

          <AppSectionCard title="3. Data your website will send" subtitle="We check every chosen template against this list, so nothing goes out with a blank."
            actions={write && <Button size="small" startIcon={<AddOutlinedIcon />} onClick={() => setForm((f) => ({ ...f, fields: [...f.fields, { key: '', sample: '' }] }))}>Add field</Button>}>
            {errors.fields && <Alert severity="error" sx={{ mb: 1.5 }}>{errors.fields}</Alert>}
            {missingKeys.length > 0 && (
              <Alert severity="warning" sx={{ mb: 1.5 }} action={write && <Button color="inherit" size="small" onClick={addMissing}>Add {missingKeys.length === 1 ? 'it' : 'them'}</Button>}>
                {missingKeys.map((k) => `${k} (needed by ${missing[k].usedIn.join(', ')})`).join('; ')} {missingKeys.length === 1 ? 'is' : 'are'} not in the list yet.
              </Alert>
            )}
            {!form.fields.length ? <Typography color="text.secondary">No fields yet. Pick templates above and press “Add” to list the fields they need.</Typography> : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Field name</TableCell><TableCell>Sample value</TableCell><TableCell>Used in</TableCell><TableCell>Status</TableCell><TableCell /></TableRow></TableHead>
                  <TableBody>
                    {form.fields.map((f, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ minWidth: 150 }}><AppTextField value={f.key} onChange={(e) => setField(i, { key: e.target.value.trim() })} placeholder="order_id" disabled={!write} slotProps={{ htmlInput: { className: 'mono', 'aria-label': 'Field name' } }} /></TableCell>
                        <TableCell sx={{ minWidth: 170 }}><AppTextField value={f.sample} onChange={(e) => setField(i, { sample: e.target.value })} placeholder="Used in the preview and the test" disabled={!write} slotProps={{ htmlInput: { 'aria-label': `Sample value for ${f.key}` } }} /></TableCell>
                        <TableCell>{used[f.key] ? used[f.key].join(', ') : '–'}</TableCell>
                        <TableCell>{used[f.key] ? <Chip size="small" color="success" label="Ready" sx={{ height: 22 }} /> : <Chip size="small" variant="outlined" label="Not used" sx={{ height: 22 }} />}</TableCell>
                        <TableCell align="right">{write && <IconButton size="small" aria-label={`Remove ${f.key || 'field'}`} onClick={() => setForm((x) => ({ ...x, fields: x.fields.filter((_, k) => k !== i) }))}><DeleteOutlineOutlinedIcon fontSize="small" /></IconButton>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </AppSectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <AppSectionCard title="Popup look" subtitle="Shown when a person chooses a template.">
            <Box sx={{ display: 'grid', gap: 2 }}>
              <AppTextField label="Your business name" optional value={form.brand.name} onChange={(e) => setBrand('name', e.target.value)} disabled={!write} />
              <AppTextField label="Logo address" optional value={form.brand.logoUrl} onChange={(e) => setBrand('logoUrl', e.target.value)} disabled={!write} placeholder="https://yourshop.com/logo.png" helperText={errors['brand.logoUrl'] || 'A picture on the web. Leave empty to show your initial.'} error={!!errors['brand.logoUrl']} />
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.75 }}>Button colour</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  {COLORS.map((c) => <Box key={c} component="button" type="button" aria-label={`Colour ${c}`} aria-pressed={form.brand.color.toLowerCase() === c.toLowerCase()} onClick={() => setBrand('color', c)} disabled={!write}
                    sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: c, border: 0, cursor: 'pointer', outline: form.brand.color.toLowerCase() === c.toLowerCase() ? '2px solid' : 'none', outlineColor: 'text.primary', outlineOffset: 2 }} />)}
                  <input type="color" value={form.brand.color} onChange={(e) => setBrand('color', e.target.value)} disabled={!write} aria-label="Pick another colour" style={{ width: 34, height: 30, border: 0, background: 'none', padding: 0 }} />
                </Box>
              </Box>
              <AppTextField label="Websites allowed to open it" multiline minRows={2} value={form.origins} onChange={set('origins')} error={!!errors.origins} disabled={!write} placeholder="https://shop.yourcompany.com"
                helperText={errors.origins || 'One address per line. Only these websites can show the popup. Leave empty to allow any website.'} slotProps={{ htmlInput: { className: 'mono', style: { fontSize: 13 } } }} />
            </Box>
          </AppSectionCard>
          <AppSectionCard title="Ready for your developer">
            <Typography color="text.secondary" sx={{ mb: 1.5 }}>{isNew ? 'Save the event, then a short snippet appears for your developer to copy. After that you can change templates here without any code change.' : 'Copy the snippet once. After that you can change templates here without any code change.'}</Typography>
            {!isNew && <Button variant="outlined" startIcon={<CodeOutlinedIcon />} onClick={() => setSnippet(true)}>View developer snippet</Button>}
            {saved && saved.lastTest && <Alert severity={saved.lastTest.ok ? 'success' : 'warning'} sx={{ mt: 1.5 }}>{saved.lastTest.ok ? 'Last test passed.' : 'Last test did not finish.'}</Alert>}
          </AppSectionCard>
        </Grid>
      </Grid>
      {saved && <DeveloperSnippet event={saved} open={snippet} onClose={() => setSnippet(false)} />}
    </Box>
  );
}
