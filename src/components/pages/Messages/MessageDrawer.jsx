import React from 'react';
import { Alert, Box, Drawer, IconButton, Typography, Divider } from '@mui/material';
import { AppStatusChip, AppSkeletonLoader } from '../../common';
import { useApi } from '../../../hooks';
import { messageService } from '../../../services';
import { dateTime, money4 } from '../../../utils/format';

const SENDER = { own_smtp: 'Your SMTP server', shared: 'Shared RelayLite sender', inapp: 'In-app (live socket)' };
const Row = ({ label, children }) => (<Box sx={{ display: 'flex', py: 0.6, gap: 2 }}><Typography color="text.secondary" sx={{ width: 110, flexShrink: 0 }}>{label}</Typography><Box sx={{ minWidth: 0, wordBreak: 'break-word' }}>{children}</Box></Box>);

/** Details of one message and its status history. */
export default function MessageDrawer({ id, onClose }) {
  const { data: m, loading, error } = useApi(() => (id ? messageService.getMessage(id) : Promise.resolve({ data: null })), [id]);
  return (
    <Drawer anchor="right" open={!!id} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 2.5 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="h2">Message</Typography><IconButton onClick={onClose} aria-label="Close">✕</IconButton>
      </Box>
      {loading && <AppSkeletonLoader rows={8} />}
      {error && <Alert severity="error">{error.message}</Alert>}
      {m && (
        <>
          <Box sx={{ mb: 1 }}><AppStatusChip status={m.status} />{m.isTest && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>Sandbox test message</Typography>}</Box>
          <Typography className="mono" variant="caption" color="text.secondary">{m.id}</Typography>
          <Divider sx={{ my: 1.5 }} />
          <Row label="To">{m.to}</Row>
          <Row label="Channel">{m.channel === 'email' ? 'Email' : 'In-app'}</Row>
          <Row label="Sent from">{SENDER[m.senderMode]}{m.from ? ` (${m.from})` : ''}</Row>
          {m.templateName && <Row label="Template">{m.templateName}</Row>}
          <Row label="Cost">{money4(m.cost)}{m.status === 'failed' ? ' (refunded)' : ''}</Row>
          <Row label="Attempts">{m.attempts}</Row>
          {m.error && <Row label="Last error"><Typography color="error">{m.error}</Typography></Row>}
          <Divider sx={{ my: 1.5 }} />
          {m.subject && <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{m.subject}</Typography>}
          <Box sx={{ whiteSpace: 'pre-wrap', bgcolor: 'background.default', p: 1.5, borderRadius: 1.5, mb: 2 }}>{m.body}</Box>
          <Typography variant="h3" sx={{ mb: 1 }}>History</Typography>
          <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, borderLeft: '2px solid', borderColor: 'divider', ml: 0.75 }}>
            {m.events.map((e, i) => (
              <Box component="li" key={i} sx={{ pl: 2, pb: 1.5, position: 'relative', '&::before': { content: '""', position: 'absolute', left: -6, top: 5, width: 10, height: 10, borderRadius: '50%', bgcolor: e.status === 'failed' ? 'error.main' : e.status === 'delivered' ? 'success.main' : 'primary.main' } }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><AppStatusChip status={e.status} /><Typography variant="caption" className="mono" color="text.secondary">{dateTime(e.at)}</Typography></Box>
                {e.detail && <Typography color="text.secondary" sx={{ mt: 0.25 }}>{e.detail}</Typography>}
              </Box>
            ))}
          </Box>
        </>
      )}
    </Drawer>
  );
}
