import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Tab, Tabs } from '@mui/material';
import { AppPageHeader, AppDataTable, AppStatusChip, CustomPagination } from '../../common';
import { useApi } from '../../../hooks';
import { platformService } from '../../../services';
import { date, money } from '../../../utils/format';

const TABS = [['', 'All'], ['review', 'Awaiting review'], ['sandbox', 'Sandbox'], ['changes', 'Changes needed'], ['active', 'Active'], ['suspended', 'Suspended'], ['rejected', 'Rejected']];

/** Super Admin: every enterprise on the platform. Review requests come first. */
export default function Platform() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('review');
  const [page, setPage] = useState(1);
  const overview = useApi(() => platformService.overview(), []);
  const list = useApi(() => platformService.listEnterprises({ page, limit: 20, ...(status ? { status } : {}) }), [status, page]);
  const counts = (overview.data && overview.data.counts) || {};

  return (
    <>
      <AppPageHeader title="Enterprises" subtitle={overview.data ? `${overview.data.total} enterprises on the platform. ${overview.data.awaitingReview} waiting for your review.` : ' '} />
      <Tabs value={status} onChange={(e, v) => { setStatus(v); setPage(1); }} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map(([v, label]) => (
          <Tab key={v} value={v} sx={{ textTransform: 'none', minHeight: 42 }}
            label={v && counts[v] ? <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>{label}<Box component="span" sx={{ minWidth: 20, px: 0.75, borderRadius: 10, fontSize: 12, lineHeight: '20px', fontWeight: 600, textAlign: 'center', bgcolor: v === 'review' ? 'warning.main' : 'action.selected', color: v === 'review' ? 'warning.contrastText' : 'text.secondary' }}>{counts[v]}</Box></Box> : label} />
        ))}
      </Tabs>
      {list.error && <Alert severity="error" sx={{ mb: 2 }}>{list.error.message}</Alert>}
      <AppDataTable loading={list.loading && !list.data} rows={list.data} onRowClick={(e) => navigate(`/platform/${e.id}`)}
        empty={{ title: status === 'review' ? 'Nothing waiting for review' : 'No enterprises here', message: status === 'review' ? 'New applications appear here when an enterprise submits its profile.' : undefined }}
        columns={[
          { key: 'name', label: 'Enterprise', render: (e) => <Box><b>{e.name}</b><Box component="span" sx={{ display: 'block', fontSize: 12, color: 'text.secondary' }}>{e.contactName ? `${e.contactName} · ${e.contactEmail}` : '–'}</Box></Box> },
          { key: 'status', label: 'Status', render: (e) => <AppStatusChip status={e.status} /> },
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
