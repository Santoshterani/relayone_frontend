import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Chip, InputAdornment, Paper, TextField, Typography } from '@mui/material';
import { AppPageHeader, AppDataTable, AppStatusChip, CustomPagination } from '../../common';
import { useApi } from '../../../hooks';
import { platformService } from '../../../services';
import { date, money } from '../../../utils/format';

const PILLS = [['', 'All'], ['review', 'Awaiting review'], ['sandbox', 'Sandbox'], ['changes', 'Changes needed'], ['active', 'Active'], ['suspended', 'Suspended'], ['rejected', 'Rejected']];
const CARDS = [
  ['', 'Total enterprises', (c, total) => total, undefined],
  ['review', 'Awaiting review', (c) => c.review || 0, 'warning.main'],
  ['changes', 'Changes needed', (c) => c.changes || 0, 'info.main'],
  ['active', 'Active', (c) => c.active || 0, 'success.main'],
  ['rejected', 'Rejected', (c) => c.rejected || 0, 'error.main']
];

/** Super Admin: every enterprise on the platform. Review requests come first. */
export default function Platform() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('review');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const overview = useApi(() => platformService.overview(), []);
  const list = useApi(() => platformService.listEnterprises({ page, limit: 20, ...(status ? { status } : {}), ...(q.trim() ? { q: q.trim() } : {}) }), [status, page, q]);
  const counts = (overview.data && overview.data.counts) || {};
  const total = overview.data ? overview.data.total : 0;
  const pick = (v) => { setStatus(v); setPage(1); };

  return (
    <>
      <AppPageHeader title="Enterprise Management" subtitle={overview.data ? `${total} enterprises on the platform. ${overview.data.awaitingReview} waiting for your review.` : ' '} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 1.5, mb: 2.5 }}>
        {CARDS.map(([v, label, val, color]) => (
          <Paper key={label} variant="outlined" component="button" onClick={() => pick(v)} aria-label={`${label}: show`} sx={{ p: 1.75, textAlign: 'left', cursor: 'pointer', font: 'inherit', bgcolor: 'background.paper', borderColor: status === v ? 'primary.main' : 'divider', boxShadow: status === v ? 1 : 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 600, color: color && val(counts, total) ? color : 'text.primary', lineHeight: 1.3 }}>{overview.data ? val(counts, total) : '–'}</Typography>
          </Paper>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        <TextField placeholder="Search enterprise, contact…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} sx={{ width: { xs: '100%', sm: 300 } }} inputProps={{ 'aria-label': 'Search enterprises' }}
          InputProps={{ startAdornment: <InputAdornment position="start">🔍</InputAdornment> }} />
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {PILLS.map(([v, label]) => <Chip key={v} label={label} clickable onClick={() => pick(v)} color={status === v ? 'primary' : 'default'} variant={status === v ? 'filled' : 'outlined'} size="small" sx={{ fontWeight: 500 }} />)}
        </Box>
      </Box>
      {list.error && <Alert severity="error" sx={{ mb: 2 }}>{list.error.message}</Alert>}
      <AppDataTable loading={list.loading && !list.data} rows={list.data} onRowClick={(e) => navigate(`/platform/${e.id}`)}
        empty={{ title: q ? 'No enterprise matches your search' : status === 'review' ? 'Nothing waiting for review' : 'No enterprises here', message: !q && status === 'review' ? 'New applications appear here when an enterprise submits its profile.' : undefined }}
        columns={[
          { key: 'name', label: 'Enterprise', render: (e) => <Box><b>{e.name}</b><Box component="span" sx={{ display: 'block', fontSize: 12, color: 'text.secondary' }}>{e.contactName ? `${e.contactName} · ${e.contactEmail}` : '–'}</Box></Box> },
          { key: 'status', label: 'Status', render: (e) => <AppStatusChip status={e.status} /> },
          { key: 'documents', label: 'KYC documents', render: (e) => <Chip size="small" variant={e.documents.verified === 5 ? 'filled' : 'outlined'} color={e.documents.rejected ? 'error' : e.documents.verified === 5 ? 'success' : e.documents.uploaded === 5 ? 'info' : 'default'} label={`${e.documents.verified}/5 verified · ${e.documents.uploaded}/5 uploaded`} /> },
          { key: 'industry', label: 'Industry', render: (e) => e.industry || '–' },
          { key: 'members', label: 'Members', align: 'right' },
          { key: 'messages', label: 'Messages', align: 'right' },
          { key: 'balance', label: 'Balance', align: 'right', render: (e) => money(e.balance) },
          { key: 'submittedAt', label: 'Submitted', render: (e) => (e.submittedAt ? date(e.submittedAt) : '–') }
        ]} />
      <CustomPagination meta={list.meta} onPage={setPage} />
    </>
  );
}
