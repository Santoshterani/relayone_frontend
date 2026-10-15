import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, MenuItem, TextField, Typography, FormGroup, FormControlLabel, Checkbox, Chip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AppPageHeader, AppSectionCard, AppSkeletonLoader, AppStatusChip, AppConfirmDialog } from '../../common';
import { useApi, useAppContext, useToast } from '../../../hooks';
import { enterpriseService } from '../../../services';
import { INDUSTRIES, SIZES, COUNTRIES, USES, VOLUMES } from '../../../constants';
import { date } from '../../../utils/format';

const REQUIRED = ['legalName', 'industry', 'companySize', 'addressLine', 'city', 'state', 'postalCode', 'country', 'contactName', 'contactEmail', 'contactPhone', 'billingEmail'];
const FIELDS = ['legalName', 'brandName', 'industry', 'companySize', 'website', 'registrationNo', 'addressLine', 'city', 'state', 'postalCode', 'country', 'contactName', 'contactDesignation', 'contactEmail', 'contactPhone', 'billingEmail', 'gstin', 'pan', 'declaredUses', 'expectedVolume'];

const STATUS_TEXT = {
  sandbox: 'Fill in your details, then submit them for approval. Until approved you can send a few test messages.',
  review: 'The RelayOne team is reviewing your details, so editing is locked for now.',
  changes: 'The RelayOne team asked for changes. Update the details and submit again.',
  rejected: 'This application was not approved.',
  active: 'Approved. You can send live messages. You can still keep these details up to date.',
  suspended: 'This account is suspended.'
};

export default function EnterpriseProfile() {
  const { can, refresh } = useAppContext();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => enterpriseService.getEnterprise(), []);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => { if (data) { setForm(data.profile); setErrors({}); } }, [data]);
  const ent = data && data.enterprise;
  const editable = !!ent && ent.canEdit && can('enterprise.update');
  const dirty = useMemo(() => !!form && !!data && FIELDS.some((k) => JSON.stringify(form[k]) !== JSON.stringify(data.profile[k])), [form, data]);

  if (loading || !form) return <><AppPageHeader title="Enterprise" /><AppSkeletonLoader variant="card" /></>;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((s) => ({ ...s, [k]: undefined })); };
  const text = (k, label, props = {}) => (
    <TextField label={label} required={REQUIRED.includes(k)} value={form[k] || ''} onChange={set(k)} disabled={!editable} error={!!errors[k]} helperText={errors[k]} {...props} />
  );
  const select = (k, label, options) => text(k, label, { select: true, children: options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>) });

  const payload = () => Object.fromEntries(FIELDS.map((k) => [k, form[k] ?? (k === 'declaredUses' ? [] : '')]));
  const save = async () => {
    setBusy(true);
    try { await enterpriseService.saveProfile(payload()); toast.success('Profile saved.'); await reload(); return true; } catch (err) {
      const fe = err.fieldErrors();
      if (Object.keys(fe).length) setErrors(fe); else toast.error(err.message);
      return false;
    } finally { setBusy(false); }
  };
  const submit = async () => {
    setConfirm(false);
    if (dirty && !(await save())) return;
    setBusy(true);
    try { await enterpriseService.submitForReview(); toast.success('Submitted for review.'); await reload(); await refresh(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  const toggleUse = (u) => setForm((f) => ({ ...f, declaredUses: f.declaredUses.includes(u) ? f.declaredUses.filter((x) => x !== u) : [...f.declaredUses, u] }));
  const canSubmit = can('enterprise.update') && ['sandbox', 'changes'].includes(ent.status);
  const missing = REQUIRED.filter((k) => !String(form[k] || '').trim());

  return (
    <>
      <AppPageHeader title="Enterprise" subtitle="Your business details. The RelayOne team checks these before you can send live messages."
        actions={<AppStatusChip status={ent.status} />} />
      <Alert severity={{ review: 'info', active: 'success', changes: 'warning', rejected: 'error', suspended: 'error' }[ent.status] || 'warning'} sx={{ mb: 2 }}>
        {STATUS_TEXT[ent.status]}{ent.submittedAt && ent.status === 'review' ? ` Submitted ${date(ent.submittedAt)}.` : ''}
        {ent.reviewNote && ['changes', 'rejected'].includes(ent.status) && <Box sx={{ mt: 0.5 }}><b>Note from RelayOne:</b> {ent.reviewNote}</Box>}
      </Alert>

      <AppSectionCard title="Company">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>{text('legalName', 'Legal company name')}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{text('brandName', 'Brand name (shown to your users)')}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{select('industry', 'Industry', INDUSTRIES)}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{select('companySize', 'Company size', SIZES)}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{text('website', 'Website', { placeholder: 'https://' })}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{text('registrationNo', 'Registration number')}</Grid>
        </Grid>
      </AppSectionCard>

      <AppSectionCard title="Address">
        <Grid container spacing={2}>
          <Grid size={12}>{text('addressLine', 'Address')}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{text('city', 'City')}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{text('state', 'State')}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{text('postalCode', 'Postal code')}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{select('country', 'Country', COUNTRIES)}</Grid>
        </Grid>
      </AppSectionCard>

      <AppSectionCard title="Contacts" subtitle="Decisions about your application are emailed to the contact. Low balance alerts go to the billing email.">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>{text('contactName', 'Contact name')}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{text('contactDesignation', 'Designation')}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{text('contactEmail', 'Contact email', { type: 'email' })}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{text('contactPhone', 'Phone', { placeholder: '+91 98765 43210' })}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{text('billingEmail', 'Billing email', { type: 'email' })}</Grid>
        </Grid>
      </AppSectionCard>

      <AppSectionCard title="Tax details" subtitle="Optional. Needed on invoices in India.">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>{text('gstin', 'GSTIN', { placeholder: '29ABCDE1234F1Z5' })}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{text('pan', 'PAN', { placeholder: 'ABCDE1234F' })}</Grid>
        </Grid>
      </AppSectionCard>

      <AppSectionCard title="How you will use RelayOne">
        <Typography variant="caption" color="text.secondary">What will you send?</Typography>
        <FormGroup row sx={{ mb: 2 }}>
          {USES.map((u) => <FormControlLabel key={u} label={u} control={<Checkbox size="small" disabled={!editable} checked={(form.declaredUses || []).includes(u)} onChange={() => toggleUse(u)} />} />)}
        </FormGroup>
        <Grid container spacing={2}><Grid size={{ xs: 12, md: 6 }}>{select('expectedVolume', 'Expected monthly volume', VOLUMES)}</Grid></Grid>
      </AppSectionCard>

      {editable && (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={save} disabled={busy || !dirty}>Save draft</Button>
          {canSubmit && <Button variant="contained" color="secondary" onClick={() => setConfirm(true)} disabled={busy || missing.length > 0}>
            {ent.status === 'changes' ? 'Submit again for review' : 'Submit for review'}</Button>}
          {canSubmit && missing.length > 0 && <Chip size="small" variant="outlined" color="warning" label={`${missing.length} required field${missing.length === 1 ? '' : 's'} left`} />}
        </Box>
      )}
      <AppConfirmDialog open={confirm} title="Submit for review?" message="Your details are locked while the RelayOne team reviews them. You will get an email with the decision." confirmLabel="Submit" busy={busy} onConfirm={submit} onClose={() => setConfirm(false)} />
    </>
  );
}
