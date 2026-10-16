import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AppPageHeader, AppSectionCard, AppMetricCard, AppSkeletonLoader, AppStatusChip, AppConfirmDialog } from '../../common';
import { useApi, useToast } from '../../../hooks';
import { platformService } from '../../../services';
import { date, money } from '../../../utils/format';
import { openBlob } from '../../../utils/openFile';
import DocumentList from '../Enterprise/DocumentList';

const FIELDS = [
  ['Company', [['legalName', 'Legal name'], ['brandName', 'Brand name'], ['industry', 'Industry'], ['companySize', 'Size'], ['website', 'Website'], ['registrationNo', 'Registration no.']]],
  ['Address', [['addressLine', 'Address'], ['city', 'City'], ['state', 'State'], ['postalCode', 'Postal code'], ['country', 'Country']]],
  ['Contacts', [['contactName', 'Contact'], ['contactDesignation', 'Designation'], ['contactEmail', 'Email'], ['contactPhone', 'Phone'], ['billingEmail', 'Billing email']]],
  ['Tax and usage', [['gstin', 'GSTIN'], ['pan', 'PAN'], ['declaredUses', 'Will send'], ['expectedVolume', 'Expected volume']]]
];
const DECISION = {
  approve: { title: 'Approve this enterprise?', button: 'Approve', color: 'success', hint: 'They can send live messages straight away. An email tells them.' },
  request_changes: { title: 'Ask for changes', button: 'Request changes', color: 'warning', hint: 'They can edit and submit again. Say exactly what to fix.' },
  reject: { title: 'Reject this application', button: 'Reject', color: 'error', hint: 'They stay in the sandbox and cannot send live messages. Say why.' }
};

function DecisionDialog({ id, decision, onClose, onDone }) {
  const toast = useToast();
  const [note, setNote] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const d = decision && DECISION[decision];
  const close = () => { setNote(''); setError(''); onClose(); };
  const submit = async (e) => {
    e.preventDefault();
    if (decision !== 'approve' && note.trim().length < 5) { setError('Write a note the enterprise can act on.'); return; }
    setBusy(true);
    try { await platformService.review(id, decision, note.trim()); toast.success('Decision recorded and emailed.'); close(); onDone(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <Dialog open={!!decision} onClose={busy ? undefined : close} maxWidth="xs" fullWidth>
      {d && (
        <Box component="form" onSubmit={submit} noValidate>
          <DialogTitle sx={{ fontSize: 16 }}>{d.title}</DialogTitle>
          <DialogContent sx={{ pt: '8px !important' }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>{d.hint}</Typography>
            <TextField label={decision === 'approve' ? 'Note (optional)' : 'Note to the enterprise'} multiline minRows={3} autoFocus value={note} onChange={(e) => { setNote(e.target.value); setError(''); }} error={!!error} helperText={error} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={close} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" color={d.color} disabled={busy}>{d.button}</Button></DialogActions>
        </Box>
      )}
    </Dialog>
  );
}

function DocDialog({ id, target, onClose, onDone }) {
  const toast = useToast();
  const [note, setNote] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const close = () => { setNote(''); setError(''); onClose(); };
  const submit = async (e) => {
    e.preventDefault();
    if (target.decision === 'rejected' && note.trim().length < 3) { setError('Say what is wrong so the enterprise can upload a better one.'); return; }
    setBusy(true);
    try { await platformService.reviewDocument(id, target.doc.type, target.decision, note.trim()); toast.success(target.decision === 'verified' ? 'Document verified.' : 'Document rejected.'); close(); onDone(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <Dialog open={!!target} onClose={busy ? undefined : close} maxWidth="xs" fullWidth>
      {target && (
        <Box component="form" onSubmit={submit} noValidate>
          <DialogTitle sx={{ fontSize: 16 }}>{target.decision === 'verified' ? 'Verify' : 'Reject'}: {target.doc.title}</DialogTitle>
          <DialogContent sx={{ pt: '8px !important' }}>
            <TextField label={target.decision === 'verified' ? 'Note (optional)' : 'Reason shown to the enterprise'} multiline minRows={3} autoFocus value={note} onChange={(e) => { setNote(e.target.value); setError(''); }} error={!!error} helperText={error} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={close} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" color={target.decision === 'verified' ? 'success' : 'error'} disabled={busy}>{target.decision === 'verified' ? 'Verify' : 'Reject'}</Button></DialogActions>
        </Box>
      )}
    </Dialog>
  );
}

/** Super Admin: one enterprise, read-only profile, and the buttons that move it through approval. */
export default function EnterpriseReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => platformService.getEnterprise(id), [id]);
  const [decision, setDecision] = useState(null);
  const [confirm, setConfirm] = useState(null); // 'suspend' | 'reactivate'
  const [busy, setBusy] = useState(false);
  const [docReview, setDocReview] = useState(null);

  if (loading && !data) return <><AppPageHeader title="Enterprise" /><AppSkeletonLoader variant="card" /></>;
  if (error && !data) return <Alert severity="error" action={<Button color="inherit" onClick={() => navigate('/platform')}>Back</Button>}>{error.message}</Alert>;
  const { enterprise: e, profile } = data;

  const run = async () => {
    setBusy(true);
    try { await (confirm === 'suspend' ? platformService.suspend(id) : platformService.reactivate(id)); toast.success(confirm === 'suspend' ? 'Suspended. Sending stops at once.' : 'Reactivated.'); setConfirm(null); reload(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  const docs = data.documents || [];
  const allVerified = docs.length > 0 && docs.every((d) => d.status === 'verified');
  const value = (k) => { const v = profile[k]; return Array.isArray(v) ? v.join(', ') : v; };

  return (
    <>
      <AppPageHeader title={e.name} subtitle={e.submittedAt ? `Submitted ${date(e.submittedAt)}` : 'Not submitted yet'}
        actions={<><Button onClick={() => navigate('/platform')}>Back</Button>
          {e.status === 'suspended' ? <Button variant="outlined" onClick={() => setConfirm('reactivate')}>Reactivate</Button> : <Button color="error" onClick={() => setConfirm('suspend')}>Suspend</Button>}</>} />
      <Box sx={{ mb: 2 }}><AppStatusChip status={e.status} /></Box>

      {e.status === 'review' && (
        <Alert severity="info" sx={{ mb: 2 }} action={<Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" color="success" variant="contained" disabled={!allVerified} onClick={() => setDecision('approve')}>Approve</Button>
          <Button size="small" color="warning" variant="outlined" onClick={() => setDecision('request_changes')}>Request changes</Button>
          <Button size="small" color="error" variant="outlined" onClick={() => setDecision('reject')}>Reject</Button></Box>}>
          Waiting for your decision. {allVerified ? 'All KYC documents are verified.' : `Verify every KYC document below before approving (${docs.filter((d) => d.status === 'verified').length}/${docs.length} verified).`}
        </Alert>
      )}
      {e.reviewNote && ['changes', 'rejected'].includes(e.status) && <Alert severity={e.status === 'rejected' ? 'error' : 'warning'} sx={{ mb: 2 }}><b>Your last note:</b> {e.reviewNote}</Alert>}
      {e.status === 'sandbox' && <Alert severity="info" sx={{ mb: 2 }}>This enterprise has not submitted its profile yet.</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}><AppMetricCard label="Members" value={data.members} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><AppMetricCard label="Messages" value={data.messages} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><AppMetricCard label="Wallet" value={money(data.balance)} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><AppMetricCard label="Sandbox messages used" value={`${e.sandboxSent} / ${e.sandboxLimit}`} /></Grid>
      </Grid>

      {FIELDS.map(([title, rows]) => (
        <AppSectionCard key={title} title={title}>
          <Grid container spacing={1.5}>
            {rows.map(([k, label]) => (
              <Grid key={k} size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography sx={{ wordBreak: 'break-word' }}>{value(k) || <Box component="span" sx={{ color: 'text.disabled' }}>Not given</Box>}</Typography>
              </Grid>
            ))}
          </Grid>
        </AppSectionCard>
      ))}

      <AppSectionCard title="KYC documents" subtitle="Open each file, then verify it or reject it with a reason. Approval needs all five verified.">
        {docs.length ? <DocumentList docs={docs} admin onView={(d) => openBlob(() => platformService.documentFile(id, d.type)).catch((err) => toast.error(err.message || 'Could not open the file.'))} onReview={(doc, decision) => setDocReview({ doc, decision })} /> : <Typography color="text.secondary">No documents.</Typography>}
      </AppSectionCard>
      <DocDialog id={id} target={docReview} onClose={() => setDocReview(null)} onDone={reload} />
      <DecisionDialog id={id} decision={decision} onClose={() => setDecision(null)} onDone={reload} />
      <AppConfirmDialog open={!!confirm} danger={confirm === 'suspend'} busy={busy} title={confirm === 'suspend' ? `Suspend ${e.name}?` : `Reactivate ${e.name}?`}
        confirmLabel={confirm === 'suspend' ? 'Suspend' : 'Reactivate'}
        message={confirm === 'suspend' ? 'API calls are blocked and queued mail is held until you reactivate. Their data is kept.' : 'They go back to the status they had before the suspension.'} onConfirm={run} onClose={() => setConfirm(null)} />
    </>
  );
}
