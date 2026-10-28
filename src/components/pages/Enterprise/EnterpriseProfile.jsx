import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, FormGroup, MenuItem, Paper, Tab, Tabs, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import AppTextField from '../../common/AppTextField';
import Grid from '@mui/material/Grid2';
import { AppPageHeader, AppSkeletonLoader, AppStatusChip, AppConfirmDialog } from '../../common';
import { useApi, useAppContext, useToast } from '../../../hooks';
import { enterpriseService } from '../../../services';
import { INDUSTRIES, SIZES, COUNTRIES, USES, VOLUMES } from '../../../constants';
import { date } from '../../../utils/format';
import CompletionBar from './CompletionBar';
import DocumentList from './DocumentList';
import DocumentViewer from './DocumentViewer';
import UploadDialog from './UploadDialog';
import { DocChip } from './documentUi';

const REQUIRED = ['legalName', 'industry', 'companySize', 'addressLine', 'city', 'state', 'postalCode', 'country', 'contactName', 'contactEmail', 'contactPhone', 'billingEmail'];
const SECTIONS = {
  company: ['legalName', 'brandName', 'industry', 'companySize', 'website', 'registrationNo', 'addressLine', 'city', 'state', 'postalCode', 'country'],
  contact: ['contactName', 'contactDesignation', 'contactEmail', 'contactPhone', 'billingEmail'],
  legal: ['gstin', 'pan'],
  usage: ['declaredUses', 'expectedVolume']
};
const filled = (form, keys) => keys.every((k) => (Array.isArray(form[k]) ? form[k].length : String(form[k] || '').trim()));

const STATUS_TEXT = {
  sandbox: 'Fill in your details and upload your documents, then submit them for approval. Until approved you can send a few test messages.',
  review: 'The RelayOne team is reviewing your details and documents, so editing is locked for now.',
  changes: 'The RelayOne team asked for changes. Update the details or replace the documents, then submit again.',
  rejected: 'This application was not approved.',
  active: 'Approved. You can send live messages. You can still keep these details up to date.',
  suspended: 'This account is suspended.'
};

/** One card with its own Edit button and save bar. `children(disabled)` renders the fields. */
function Section({ title, subtitle, icon, id, editing, setEditing, canEdit, dirty, busy, onSave, onCancel, children }) {
  const on = editing === id;
  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {icon && <Box sx={{ display: 'flex', width: 36, height: 36, flex: '0 0 36px', alignItems: 'center', justifyContent: 'center', borderRadius: 1.25, bgcolor: 'rgba(49, 95, 232, 0.09)', color: 'primary.main', '& svg': { fontSize: 18 } }}>{icon}</Box>}
          <Box><Typography variant="h3">{title}</Typography>{subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}</Box>
        </Box>
        {canEdit && !on && <Button size="small" variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => setEditing(id)} aria-label={`Edit ${title}`}>Edit</Button>}
      </Box>
      {children(!on)}
      {on && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption"><b>{dirty ? 'Unsaved changes' : 'No changes yet'}</b>{dirty ? ' — review your edits before saving' : ''}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}><Button size="small" onClick={onCancel} disabled={busy}>Cancel</Button><Button size="small" variant="contained" startIcon={<SaveOutlinedIcon />} onClick={onSave} disabled={busy || !dirty}>Save changes</Button></Box>
        </Box>
      )}
    </Paper>
  );
}

export default function EnterpriseProfile() {
  const { can, refresh } = useAppContext();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => enterpriseService.getEnterprise(), []);
  const docsApi = useApi(() => enterpriseService.listDocuments(), []);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [tab, setTab] = useState('company');
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => { if (data) { setForm(data.profile); setErrors({}); } }, [data]);
  const ent = data && data.enterprise;
  const docs = docsApi.data || [];
  const editable = !!ent && ent.canEdit && can('enterprise.update');
  const dirtyOf = (keys) => !!form && !!data && keys.some((k) => JSON.stringify(form[k]) !== JSON.stringify(data.profile[k]));

  const progress = useMemo(() => {
    if (!form || !ent) return null;
    const uploaded = docs.filter((d) => d.status !== 'not_submitted').length;
    const company = filled(form, REQUIRED.slice(0, 8)); const contact = filled(form, REQUIRED.slice(8));
    const legal = filled(form, ['declaredUses', 'expectedVolume']) && (form.country !== 'India' || filled(form, ['gstin', 'pan']));
    const kyc = ent.status === 'active';
    const docsDone = docs.length > 0 && uploaded === docs.length;
    const percent = Math.round(((company ? 1 : 0) + (contact ? 1 : 0) + (legal ? 1 : 0) + (docs.length ? uploaded / docs.length : 0) + (kyc ? 1 : 0)) * 20);
    const st = (done, active) => (done ? 'done' : active ? 'active' : 'pending');
    return { uploaded, percent, steps: [
      { label: 'Company Info', state: st(company, !company) }, { label: 'Contact Details', state: st(contact, company && !contact) }, { label: 'Legal & Tax', state: st(legal, false) },
      { label: `Documents (${uploaded}/${docs.length || 5})`, state: st(docsDone, uploaded > 0) },
      { label: 'KYC Approval', state: st(kyc, ent.status === 'review') }] };
  }, [form, ent, docs]);

  if (loading || !form) return <><AppPageHeader title="Enterprise" /><AppSkeletonLoader variant="card" /></>;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((s) => ({ ...s, [k]: undefined })); };
  const field = (k, label, disabled, props = {}) => (
    <AppTextField label={label} required={REQUIRED.includes(k)} value={form[k] || ''} onChange={set(k)} disabled={disabled} error={!!errors[k]} helperText={errors[k]} {...props} />
  );
  const select = (k, label, disabled, options) => field(k, label, disabled, { select: true, children: options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>) });
  const saveSection = (id) => async () => {
    setBusy(true);
    try { await enterpriseService.saveProfile(Object.fromEntries(SECTIONS[id].map((k) => [k, form[k] ?? (k === 'declaredUses' ? [] : '')]))); toast.success('Saved.'); setEditing(null); await reload(); await docsApi.reload(); } catch (err) {
      const fe = err.fieldErrors();
      if (Object.keys(fe).length) setErrors(fe); else toast.error(err.message);
    } finally { setBusy(false); }
  };
  const cancelSection = (id) => () => { setForm((f) => ({ ...f, ...Object.fromEntries(SECTIONS[id].map((k) => [k, data.profile[k]])) })); setErrors({}); setEditing(null); };
  const sec = (id, title, subtitle, icon, render) => (
    <Section id={id} title={title} subtitle={subtitle} icon={icon} editing={editing} setEditing={setEditing} canEdit={editable && (!editing || editing === id)} dirty={dirtyOf(SECTIONS[id])} busy={busy} onSave={saveSection(id)} onCancel={cancelSection(id)}>{render}</Section>
  );

  const submit = async () => {
    setConfirm(false); setBusy(true);
    try { await enterpriseService.submitForReview(); toast.success('Submitted for review.'); await reload(); await docsApi.reload(); await refresh(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  const toggleUse = (u) => setForm((f) => ({ ...f, declaredUses: f.declaredUses.includes(u) ? f.declaredUses.filter((x) => x !== u) : [...f.declaredUses, u] }));
  const canSubmit = can('enterprise.update') && ['sandbox', 'changes'].includes(ent.status);
  const missing = REQUIRED.filter((k) => !String(data.profile[k] || '').trim());
  const docsLeft = docs.filter((d) => d.status === 'not_submitted').length; const docsRejected = docs.filter((d) => d.status === 'rejected').length;
  const verified = docs.filter((d) => d.status === 'verified').length;
  const view = (d) => setPreview({ doc: d, load: () => enterpriseService.documentFile(d.type) });

  return (
    <>
      <AppPageHeader title="Enterprise Management" subtitle="Manage your enterprise profile, compliance documents and team accounts" />
      <Alert severity={{ review: 'info', active: 'success', changes: 'warning', rejected: 'error', suspended: 'error' }[ent.status] || 'warning'} sx={{ mb: 2 }}>
        {STATUS_TEXT[ent.status]}{ent.submittedAt && ent.status === 'review' ? ` Submitted ${date(ent.submittedAt)}.` : ''}
        {ent.reviewNote && ['changes', 'rejected'].includes(ent.status) && <Box sx={{ mt: 0.5 }}><b>Note from RelayOne:</b> {ent.reviewNote}</Box>}
      </Alert>
      {progress && <CompletionBar percent={progress.percent} steps={progress.steps} />}

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="company" icon={<BusinessOutlinedIcon />} iconPosition="start" label="Company Profile" sx={{ textTransform: 'none' }} />
        <Tab value="legal" icon={<GavelOutlinedIcon />} iconPosition="start" label="Legal & Tax" sx={{ textTransform: 'none' }} />
        <Tab value="docs" icon={<FolderOpenOutlinedIcon />} iconPosition="start" sx={{ textTransform: 'none' }} label={<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>Documents<Box component="span" sx={{ px: 0.75, borderRadius: 10, fontSize: 12, lineHeight: '20px', bgcolor: docsLeft || docsRejected ? 'warning.main' : 'success.main', color: '#fff' }}>{progress ? progress.uploaded : 0}/{docs.length || 5}</Box></Box>} />
      </Tabs>

      {tab === 'company' && (
        <>
          {sec('company', 'Company Details', 'Your enterprise legal information and registered address', <BusinessOutlinedIcon />, (off) => (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>{field('legalName', 'Legal company name', off)}</Grid>
              <Grid size={{ xs: 12, md: 6 }}>{field('brandName', 'Brand name (shown to your users)', off)}</Grid>
              <Grid size={{ xs: 12, md: 6 }}>{select('industry', 'Industry', off, INDUSTRIES)}</Grid>
              <Grid size={{ xs: 12, md: 6 }}>{select('companySize', 'Company size', off, SIZES)}</Grid>
              <Grid size={{ xs: 12, md: 6 }}>{field('website', 'Website', off, { placeholder: 'https://' })}</Grid>
              <Grid size={{ xs: 12, md: 6 }}>{field('registrationNo', 'Registration number', off)}</Grid>
              <Grid size={12}>{field('addressLine', 'Address', off)}</Grid>
              <Grid size={{ xs: 12, md: 6 }}>{field('city', 'City', off)}</Grid>
              <Grid size={{ xs: 12, md: 6 }}>{field('state', 'State', off)}</Grid>
              <Grid size={{ xs: 12, md: 6 }}>{field('postalCode', 'Postal code', off)}</Grid>
              <Grid size={{ xs: 12, md: 6 }}>{select('country', 'Country', off, COUNTRIES)}</Grid>
            </Grid>
          ))}
          {sec('contact', 'Primary Contact', 'Decisions about your application are emailed to the contact. Low balance alerts go to the billing email.', <PersonOutlineOutlinedIcon />, (off) => (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>{field('contactName', 'Contact name', off)}</Grid>
              <Grid size={{ xs: 12, md: 6 }}>{field('contactDesignation', 'Job title', off)}</Grid>
              <Grid size={{ xs: 12, md: 6 }}>{field('contactEmail', 'Business email', off, { type: 'email' })}</Grid>
              <Grid size={{ xs: 12, md: 6 }}>{field('contactPhone', 'Phone number', off, { placeholder: '+91 98765 43210' })}</Grid>
              <Grid size={{ xs: 12, md: 6 }}>{field('billingEmail', 'Billing email', off, { type: 'email' })}</Grid>
            </Grid>
          ))}
        </>
      )}

      {tab === 'legal' && (
        <>
          {sec('legal', 'Legal & Tax Information', 'Financial and regulatory details for billing and compliance. Needed on invoices in India.', <GavelOutlinedIcon />, (off) => (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>{field('gstin', 'GSTIN', off, { placeholder: '29ABCDE1234F1Z5' })}</Grid>
              <Grid size={{ xs: 12, md: 6 }}>{field('pan', 'PAN', off, { placeholder: 'ABCDE1234F' })}</Grid>
            </Grid>
          ))}
          {sec('usage', 'How you will use RelayOne', 'What you plan to send and how much', null, (off) => (
            <>
              <Typography variant="caption" color="text.secondary">What will you send?</Typography>
              <FormGroup row sx={{ mb: 2 }}>{USES.map((u) => <FormControlLabel key={u} label={u} control={<Checkbox size="small" disabled={off} checked={(form.declaredUses || []).includes(u)} onChange={() => toggleUse(u)} />} />)}</FormGroup>
              <Grid container spacing={2}><Grid size={{ xs: 12, md: 6 }}>{select('expectedVolume', 'Expected monthly volume', off, VOLUMES)}</Grid></Grid>
            </>
          ))}
          <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>Compliance &amp; Security</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip size="small" color="success" label="Email verified" />
              <Chip size="small" color={ent.status === 'active' ? 'success' : ent.status === 'review' ? 'info' : 'default'} variant={ent.status === 'active' || ent.status === 'review' ? 'filled' : 'outlined'} label={ent.status === 'active' ? 'KYC approved' : ent.status === 'review' ? 'KYC in review' : 'KYC not submitted'} />
              <Chip size="small" color={verified === docs.length && docs.length ? 'success' : 'default'} variant={verified === docs.length && docs.length ? 'filled' : 'outlined'} label={`Documents verified: ${verified}/${docs.length || 5}`} />
            </Box>
          </Paper>
        </>
      )}

      {tab === 'docs' && (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>Upload every document below. The RelayOne team reviews each one and marks it Verified or Rejected with a reason. Accepted formats: PDF, JPG, PNG, max 10 MB each.</Alert>
          <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
            <Typography variant="h3" sx={{ mb: 1.5 }}>Approval pipeline</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {[['1. Upload documents', docsLeft === 0 && docs.length > 0], ['2. Submit for review', ['review', 'active'].includes(ent.status)], ['3. RelayOne verifies each document', verified === docs.length && docs.length > 0], ['4. KYC approved', ent.status === 'active']].map(([l, done]) => (
                <Chip key={l} label={l} color={done ? 'success' : 'default'} variant={done ? 'filled' : 'outlined'} size="small" />
              ))}
            </Box>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
              <Box><Typography variant="h3">Required Documents</Typography><Typography variant="caption" color="text.secondary">Upload all documents below. We review and update the verification status.</Typography></Box>
              <DocChip status={verified === docs.length && docs.length ? 'verified' : 'pending'} />
            </Box>
            {docsApi.loading && !docsApi.data ? <AppSkeletonLoader variant="card" /> : <DocumentList docs={docs} canEdit={editable} onView={view} onUpload={setUploading} />}
          </Paper>
          {canSubmit && (
            <Paper variant="outlined" sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography sx={{ fontWeight: 600 }}>Ready to submit for review?</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Your details and documents are locked while the RelayOne team reviews them. You will get an email with the decision.</Typography>
                {(missing.length > 0 || docsLeft > 0 || docsRejected > 0) && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'warning.main' }}>
                    {[missing.length ? `${missing.length} required profile field${missing.length === 1 ? '' : 's'} left` : '', docsLeft ? `${docsLeft} document${docsLeft === 1 ? '' : 's'} not uploaded` : '', docsRejected ? `${docsRejected} rejected document${docsRejected === 1 ? '' : 's'} to replace` : ''].filter(Boolean).join(' · ')}
                  </Typography>
                )}
              </Box>
              <Button variant="contained" color="secondary" startIcon={<SendOutlinedIcon />} onClick={() => setConfirm(true)} disabled={busy || !ent.canSubmit}>{ent.status === 'changes' ? 'Submit again for review' : 'Submit for review'}</Button>
            </Paper>
          )}
        </>
      )}

      <UploadDialog doc={uploading} onClose={() => setUploading(null)} onUploaded={() => { docsApi.reload(); reload(); }} />
      <DocumentViewer doc={preview?.doc} load={preview?.load} onClose={() => setPreview(null)} />
      <AppConfirmDialog open={confirm} title="Submit for review?" message="Your details and documents are locked while the RelayOne team reviews them. You will get an email with the decision." confirmLabel="Submit" busy={busy} onConfirm={submit} onClose={() => setConfirm(false)} />
    </>
  );
}
