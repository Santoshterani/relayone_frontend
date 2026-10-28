import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Chip, InputAdornment } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import AppTextField from '../../common/AppTextField';
import { AppPageHeader, AppDataTable, AppStatusChip, AppMetricCard, AppCircularLoader, CustomPagination } from '../../common';
import { useApi } from '../../../hooks';
import { platformService } from '../../../services';
import { date, money } from '../../../utils/format';
import debounce from '../../../utils/debounce';
import EnterpriseDrawer from './EnterpriseReview';

const PILLS = [['', 'All'], ['review', 'Awaiting review'], ['sandbox', 'Sandbox'], ['changes', 'Changes needed'], ['active', 'Active'], ['suspended', 'Suspended'], ['rejected', 'Rejected']];
const CARDS = [
  ['', 'Total enterprises', (c, total) => total, BusinessOutlinedIcon, '#315FE8'],
  ['review', 'Awaiting review', (c) => c.review || 0, FactCheckOutlinedIcon, '#F59E0B'],
  ['changes', 'Changes needed', (c) => c.changes || 0, EditNoteOutlinedIcon, '#8B5CF6'],
  ['active', 'Active', (c) => c.active || 0, CheckCircleOutlineOutlinedIcon, '#10B981'],
  ['rejected', 'Rejected', (c) => c.rejected || 0, HighlightOffOutlinedIcon, '#EF4444']
];

/** Super Admin: every enterprise on the platform. Review requests come first. */
export default function Platform() {
  const navigate = useNavigate();
  const splat = useParams()['*'] || '';
  const openId = /^\d+$/.test(splat) ? splat : null;
  const [status, setStatus] = useState('review');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const applySearch = useMemo(() => debounce((value) => { setQ(value); setPage(1); }, 350), []);
  useEffect(() => () => applySearch.cancel(), [applySearch]);
  const overview = useApi(() => platformService.overview(), []);
  const list = useApi(() => platformService.listEnterprises({ page, limit, ...(status ? { status } : {}), ...(q.trim() ? { q: q.trim() } : {}) }), [status, page, limit, q]);
  const counts = (overview.data && overview.data.counts) || {};
  const total = overview.data ? overview.data.total : 0;
  const initialLoading = (overview.loading && !overview.data) || (list.loading && !list.data);
  const pick = (v) => { setStatus(v); setPage(1); };

  return (
    <>
      <AppPageHeader title="Enterprise Management" subtitle={overview.data ? `${total} enterprises on the platform. ${overview.data.awaitingReview} waiting for your review.` : ' '} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' }, gap: 2, mb: 2.5 }}>
        {CARDS.map(([v, label, val, Icon, color]) => (
          <AppMetricCard key={label} label={label} value={overview.data ? val(counts, total) : '–'}
            tone={v === 'active' ? 'good' : v === 'rejected' ? 'bad' : undefined}
            icon={<Icon fontSize="small" />} accent={color} component="button" onClick={() => pick(v)}
            selected={status === v} ariaLabel={`${label}: show`} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        <AppTextField placeholder="Search enterprise, contact…" value={search} onChange={(e) => { setSearch(e.target.value); applySearch(e.target.value); }} sx={{ width: { xs: '100%', sm: 300 } }} inputProps={{ 'aria-label': 'Search enterprises' }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> }} />
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {PILLS.map(([v, label]) => <Chip key={v} label={label} clickable onClick={() => pick(v)} color={status === v ? 'primary' : 'default'} variant={status === v ? 'filled' : 'outlined'} size="small" sx={{ fontWeight: 500 }} />)}
        </Box>
      </Box>
      {overview.error && <Alert severity="error" sx={{ mb: 2 }}>{overview.error.message}</Alert>}
      {list.error && <Alert severity="error" sx={{ mb: 2 }}>{list.error.message}</Alert>}
      {initialLoading && <AppCircularLoader overlay />}
      <AppDataTable loading={list.loading && !list.data} rows={list.data} onRowClick={(e) => navigate(`/platform/${e.id}`)} selectedId={openId ? Number(openId) : undefined}
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
      {list.meta && list.meta.total > 0 && <CustomPagination
        page={list.meta.page}
        totalPages={list.meta.pages}
        totalCount={list.meta.total}
        pageSize={list.meta.limit}
        onPageChange={setPage}
        onPageSizeChange={(n) => { setLimit(n); setPage(1); }}
      />}
      <EnterpriseDrawer id={openId} onClose={() => navigate('/platform')} onChanged={() => { list.reload(); overview.reload(); }} />
    </>
  );
}
