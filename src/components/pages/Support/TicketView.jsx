import React, { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Link, MenuItem, Paper, Switch, TextField, Typography } from '@mui/material';
import { AppStatusChip, AppSectionCard, AppCircularLoader, AppConfirmDialog } from '../../common';
import { useApi, useAppContext, useToast } from '../../../hooks';
import { supportService } from '../../../services';
import { PriorityChip, categoryLabel } from './ticketUi';
import { dateTime } from '../../../utils/format';

function Bubble({ m }) {
  if (m.kind === 'event') return <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', my: 1 }}>{m.body} · {dateTime(m.createdAt)}</Typography>;
  const staff = m.side === 'staff'; const note = m.kind === 'note';
  return (
    <Box sx={{ display: 'flex', justifyContent: staff ? 'flex-end' : 'flex-start', my: 1 }}>
      <Paper variant="outlined" sx={{ maxWidth: '82%', p: 1.5, bgcolor: note ? '#FFF8E6' : staff ? 'primary.main' : 'background.paper', color: staff && !note ? '#fff' : 'text.primary', borderColor: note ? 'warning.light' : undefined }}>
        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 0.25 }}>{m.authorName}{note ? ' · internal note' : ''} · {dateTime(m.createdAt)}</Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</Typography>
      </Paper>
    </Box>
  );
}

function EscalateDialog({ open, onClose, onSubmit }) {
  const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const go = async () => { if (reason.trim().length < 3) { setErr('Give a reason so the next agent knows why.'); return; } setBusy(true); try { await onSubmit(reason.trim()); setReason(''); } finally { setBusy(false); } };
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 16 }}>Escalate this ticket</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <TextField label="Reason (internal, the enterprise does not see it)" multiline minRows={3} autoFocus value={reason} onChange={(e) => { setReason(e.target.value); setErr(''); }} error={!!err} helperText={err} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" color="error" onClick={go} disabled={busy}>Escalate</Button></DialogActions>
    </Dialog>
  );
}

/** One ticket and its conversation. `staff` shows the support tools and internal notes. */
export default function TicketView({ staff }) {
  const { id } = useParams();
  const { can } = useAppContext();
  const toast = useToast();
  const t = useApi(() => (staff ? supportService.getOne(id) : supportService.getMine(id)), [id, staff]);
  const agents = useApi(() => (staff && can('support.assign') ? supportService.agents() : Promise.resolve({ data: [] })), [staff]);
  const [text, setText] = useState(''); const [internal, setInternal] = useState(false); const [busy, setBusy] = useState(false);
  const [escalating, setEscalating] = useState(false); const [resolving, setResolving] = useState(false);
  const back = staff ? '/desk' : '/support';
  const tk = t.data;

  const run = async (fn, ok) => { setBusy(true); try { await fn(); if (ok) toast.success(ok); await t.reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  const send = () => run(async () => { await (staff ? supportService.reply(id, text.trim(), internal) : supportService.replyMine(id, text.trim())); setText(''); }, internal ? 'Note added.' : 'Reply sent.');

  if (t.loading && !tk) return <AppCircularLoader />;
  if (t.error && !tk) return <Alert severity="error">{t.error.message} <Link component={RouterLink} to={back}>Back to tickets</Link></Alert>;
  const closed = tk.status === 'closed'; const live = ['open', 'in_progress', 'escalated'].includes(tk.status);

  return (
    <>
      <Link component={RouterLink} to={back} underline="hover" sx={{ fontSize: 13 }}>← {staff ? 'Support desk' : 'Support'}</Link>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', my: 1.5 }}>
        <Typography variant="h1">#{tk.id} {tk.subject}</Typography>
        <AppStatusChip status={tk.status} /><PriorityChip priority={tk.priority} />
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {categoryLabel(tk.category)}{staff && ` · ${tk.enterpriseName}`} · raised {dateTime(tk.createdAt)}{tk.createdBy ? ` by ${tk.createdBy.name}` : ''}{tk.assignee ? ` · handled by ${tk.assignee.name}` : ''}
      </Typography>
      {tk.status === 'resolved' && <Alert severity="success" sx={{ mb: 2 }}>{staff ? 'Marked resolved. The enterprise can reply to reopen it.' : 'Marked resolved. Reply below if the problem is not fixed, or close the ticket.'}</Alert>}
      {staff && tk.status === 'escalated' && <Alert severity="error" sx={{ mb: 2 }}>Escalated {dateTime(tk.escalatedAt)}: {tk.escalationReason}</Alert>}

      {staff && (
        <AppSectionCard title="Actions">
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {can('support.assign') && !closed && (
              <TextField select size="small" label="Assigned to" value={tk.assignee ? tk.assignee.id : ''} sx={{ minWidth: 200, width: 200 }} disabled={busy}
                onChange={(e) => run(() => supportService.assign(id, e.target.value || null), 'Assignment saved.')}>
                <MenuItem value="">Unassigned</MenuItem>
                {(agents.data || []).map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </TextField>
            )}
            {can('support.escalate') && ['open', 'in_progress'].includes(tk.status) && <Button color="error" variant="outlined" disabled={busy} onClick={() => setEscalating(true)}>Escalate</Button>}
            {can('support.resolve') && live && <Button variant="contained" color="success" disabled={busy} onClick={() => setResolving(true)}>Resolve</Button>}
            {can('support.resolve') && tk.status === 'resolved' && <><Button variant="outlined" disabled={busy} onClick={() => run(() => supportService.reopen(id), 'Ticket reopened.')}>Reopen</Button><Button variant="outlined" disabled={busy} onClick={() => run(() => supportService.close(id), 'Ticket closed.')}>Close ticket</Button></>}
            {!can('support.resolve') && !can('support.escalate') && !can('support.assign') && <Chip size="small" label="You can view and reply on this ticket" />}
          </Box>
        </AppSectionCard>
      )}

      <AppSectionCard title="Conversation">
        <Box sx={{ maxHeight: 460, overflowY: 'auto', pr: 0.5 }}>{tk.messages.map((m) => <Bubble key={m.id} m={m} />)}</Box>
        {closed ? <Alert severity="info" sx={{ mt: 2 }}>This ticket is closed. Raise a new one if the problem comes back.</Alert> : (!staff || can('support.reply')) && (
          <Box sx={{ mt: 2 }}>
            <TextField multiline minRows={3} placeholder={internal ? 'Internal note (the enterprise cannot see this)' : 'Write a reply…'} value={text} onChange={(e) => setText(e.target.value)} inputProps={{ 'aria-label': 'Reply' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, gap: 1, flexWrap: 'wrap' }}>
              <Box>{staff && <FormControlLabel control={<Switch checked={internal} onChange={(e) => setInternal(e.target.checked)} />} label="Internal note" />}</Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {!staff && tk.status === 'resolved' && <Button disabled={busy} onClick={() => run(() => supportService.closeMine(id), 'Ticket closed.')}>Close ticket</Button>}
                <Button variant="contained" disabled={busy || text.trim().length < 2} onClick={send}>{internal ? 'Add note' : 'Send reply'}</Button>
              </Box>
            </Box>
          </Box>
        )}
      </AppSectionCard>

      <EscalateDialog open={escalating} onClose={() => setEscalating(false)} onSubmit={(reason) => run(() => supportService.escalate(id, reason), 'Ticket escalated.').then(() => setEscalating(false))} />
      <AppConfirmDialog open={resolving} busy={busy} title="Mark as resolved?" confirmLabel="Resolve" message="The enterprise is emailed and can reply to reopen the ticket." onClose={() => setResolving(false)} onConfirm={() => run(() => supportService.resolve(id, ''), 'Ticket resolved.').then(() => setResolving(false))} />
    </>
  );
}
