import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, IconButton, Tab, Tabs, Typography } from '@mui/material';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import AppTextField from '../../common/AppTextField';
import Grid from '@mui/material/Grid2';
import { AppMetricCard, AppSkeletonLoader, AppStatusChip, AppConfirmDialog } from '../../common';
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
            <AppTextField label={decision === 'approve' ? 'Note (optional)' : 'Note to the enterprise'} multiline minRows={3} autoFocus value={note} onChange={(e) => { setNote(e.target.value); setError(''); }} error={!!error} helperText={error} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={close} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" color={d.color} startIcon={<EditNoteOutlinedIcon />} disabled={busy}>{d.button}</Button></DialogActions>
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
            <AppTextField label={target.decision === 'verified' ? 'Note (optional)' : 'Reason shown to the enterprise'} multiline minRows={3} autoFocus value={note} onChange={(e) => { setNote(e.target.value); setError(''); }} error={!!error} helperText={error} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={close} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" color={target.decision === 'verified' ? 'success' : 'error'} startIcon={target.decision === 'verified' ? <TaskAltOutlinedIcon /> : <HighlightOffOutlinedIcon />} disabled={busy}>{target.decision === 'verified' ? 'Verify' : 'Reject'}</Button></DialogActions>
        </Box>
      )}
    </Dialog>
  );
}

const TABS = [['overview', 'Overview'], ['company', 'Company'], ['contacts', 'Contacts & tax'], ['documents', 'Documents']];
const GROUPS = { company: ['Company', 'Address'], contacts: ['Contacts', 'Tax and usage'] };

function Facts({ title, rows, value }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>{title}</Typography>
      <Grid container spacing={2}>
        {rows.map(([k, label]) => (
          <Grid key={k} size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography sx={{ wordBreak: 'break-word' }}>{value(k) || <Box component="span" sx={{ color: 'text.disabled' }}>Not given</Box>}</Typography>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

/** Super Admin: one enterprise in a drawer from the right, with tabs, and the buttons that move it through approval. */
export default function EnterpriseDrawer({ id, onClose, onChanged }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => (id ? platformService.getEnterprise(id) : Promise.resolve(null)), [id]);
  const [tab, setTab] = useState('overview');
  const [decision, setDecision] = useState(null);
  const [confirm, setConfirm] = useState(null); // 'suspend' | 'reactivate'
  const [busy, setBusy] = useState(false);
  const [docReview, setDocReview] = useState(null);
  useEffect(() => { setTab('overview'); }, [id]);

  const changed = () => { reload(); if (onChanged) onChanged(); };
  const run = async () => {
    setBusy(true);
    try { await (confirm === 'suspend' ? platformService.suspend(id) : platformService.reactivate(id)); toast.success(confirm === 'suspend' ? 'Suspended. Sending stops at once.' : 'Reactivated.'); setConfirm(null); changed(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const e = data && data.enterprise; const profile = (data && data.profile) || {};
  const docs = (data && data.documents) || [];
  const verified = docs.filter((d) => d.status === 'verified').length;
  const allVerified = docs.length > 0 && verified === docs.length;
  const value = (k) => { const v = profile[k]; return Array.isArray(v) ? v.join(', ') : v; };

  return (
    <Drawer anchor="right" open={!!id} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 760 }, maxWidth: '100%', display: 'flex', flexDirection: 'column' }, role: 'dialog', 'aria-label': e ? `Enterprise ${e.name}` : 'Enterprise' }}>
      {loading && !data && <Box sx={{ p: 3 }}><AppSkeletonLoader variant="card" /></Box>}
      {error && !data && <Box sx={{ p: 3 }}><Alert severity="error" action={<Button color="inherit" startIcon={<RefreshOutlinedIcon />} onClick={onClose}>Close</Button>}>{error.message}</Alert></Box>}
      {e && (
        <>
          <Box sx={{ px: 3, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h2" noWrap>{e.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                <AppStatusChip status={e.status} />
                <Typography variant="caption" color="text.secondary">{e.submittedAt ? `Submitted ${date(e.submittedAt)}` : 'Not submitted yet'}</Typography>
              </Box>
            </Box>
            {e.status === 'suspended' ? <Button size="small" variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={() => setConfirm('reactivate')}>Reactivate</Button> : <Button size="small" color="error" startIcon={<BlockOutlinedIcon />} onClick={() => setConfirm('suspend')}>Suspend</Button>}
            <IconButton aria-label="Close" onClick={onClose} edge="end">✕</IconButton>
          </Box>
          <Tabs value={tab} onChange={(ev, v) => setTab(v)} variant="scrollable" sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }} aria-label="Enterprise sections">
            {TABS.map(([v, label]) => <Tab key={v} value={v} label={v === 'documents' ? `Documents (${verified}/${docs.length || 5})` : label} />)}
          </Tabs>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            {tab === 'overview' && (
              <>
                {e.status === 'review' && <Alert severity="info" sx={{ mb: 2 }}>Waiting for your decision. {allVerified ? 'All KYC documents are verified.' : `Verify every KYC document first (${verified}/${docs.length} verified).`}</Alert>}
                {e.reviewNote && ['changes', 'rejected'].includes(e.status) && <Alert severity={e.status === 'rejected' ? 'error' : 'warning'} sx={{ mb: 2 }}><b>Your last note:</b> {e.reviewNote}</Alert>}
                {e.status === 'sandbox' && <Alert severity="info" sx={{ mb: 2 }}>This enterprise has not submitted its profile yet.</Alert>}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 6 }}><AppMetricCard label="Members" value={data.members} /></Grid>
                  <Grid size={{ xs: 6 }}><AppMetricCard label="Messages" value={data.messages} /></Grid>
                  <Grid size={{ xs: 6 }}><AppMetricCard label="Wallet" value={money(data.balance)} /></Grid>
                  <Grid size={{ xs: 6 }}><AppMetricCard label="Sandbox messages used" value={`${e.sandboxSent} / ${e.sandboxLimit}`} /></Grid>
                </Grid>
                <Facts title="At a glance" value={value} rows={[['industry', 'Industry'], ['companySize', 'Size'], ['country', 'Country'], ['contactName', 'Contact'], ['contactEmail', 'Contact email'], ['declaredUses', 'Will send']]} />
              </>
            )}
            {tab === 'company' && FIELDS.filter(([t]) => GROUPS.company.includes(t)).map(([t, rows]) => <Facts key={t} title={t} rows={rows} value={value} />)}
            {tab === 'contacts' && FIELDS.filter(([t]) => GROUPS.contacts.includes(t)).map(([t, rows]) => <Facts key={t} title={t} rows={rows} value={value} />)}
            {tab === 'documents' && (
              <>
                <Typography color="text.secondary" sx={{ mb: 2 }}>Open each file, then verify it or reject it with a reason. Approval needs all five verified.</Typography>
                {docs.length ? <DocumentList docs={docs} admin onView={(d) => openBlob(() => platformService.documentFile(id, d.type)).catch((err) => toast.error(err.message || 'Could not open the file.'))} onReview={(doc, decision) => setDocReview({ doc, decision })} /> : <Typography color="text.secondary">No documents.</Typography>}
              </>
            )}
          </Box>

          {e.status === 'review' && (
            <Box sx={{ px: 3, py: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap', bgcolor: 'background.paper' }}>
              <Button color="error" variant="outlined" startIcon={<HighlightOffOutlinedIcon />} onClick={() => setDecision('reject')}>Reject</Button>
              <Button color="warning" variant="outlined" startIcon={<EditNoteOutlinedIcon />} onClick={() => setDecision('request_changes')}>Request changes</Button>
              <Button color="success" variant="contained" startIcon={<CheckCircleOutlineOutlinedIcon />} disabled={!allVerified} onClick={() => setDecision('approve')}>Approve</Button>
            </Box>
          )}
          <DocDialog id={id} target={docReview} onClose={() => setDocReview(null)} onDone={changed} />
          <DecisionDialog id={id} decision={decision} onClose={() => setDecision(null)} onDone={changed} />
          <AppConfirmDialog open={!!confirm} danger={confirm === 'suspend'} busy={busy} title={confirm === 'suspend' ? `Suspend ${e.name}?` : `Reactivate ${e.name}?`}
            confirmLabel={confirm === 'suspend' ? 'Suspend' : 'Reactivate'}
            message={confirm === 'suspend' ? 'API calls are blocked and queued mail is held until you reactivate. Their data is kept.' : 'They go back to the status they had before the suspension.'} onConfirm={run} onClose={() => setConfirm(null)} />
        </>
      )}
    </Drawer>
  );
}
