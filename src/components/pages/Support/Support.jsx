import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Tab, Tabs } from '@mui/material';
import { AppPageHeader, AppDataTable, AppStatusChip, AppMetricCard, CustomPagination } from '../../common';
import { useApi, useAppContext } from '../../../hooks';
import { supportService } from '../../../services';
import NewTicketDialog from './NewTicketDialog';
import { PriorityChip, categoryLabel, ago } from './ticketUi';

const TABS = [['', 'All'], ['pending', 'Pending'], ['resolved', 'Resolved'], ['closed', 'Closed']];

/** Enterprise side: raise a ticket when something is wrong and follow it. */
export default function Support() {
  const navigate = useNavigate();
  const { can } = useAppContext();
  const [tab, setTab] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const sum = useApi(() => supportService.summaryMine(), []);
  const list = useApi(() => supportService.listMine({ page, limit: 20, ...(tab === 'pending' ? { group: 'pending' } : tab ? { status: tab } : {}) }), [tab, page]);
  const s = sum.data || {};

  return (
    <>
      <AppPageHeader title="Support" subtitle="Server down, messages not arriving, billing question? Raise a ticket and the RelayOne support team will reply here."
        actions={can('tickets.write') && <Button variant="contained" onClick={() => setOpen(true)}>Raise ticket</Button>} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2.5 }}>
        <AppMetricCard label="Pending" value={s.pending ?? '–'} hint="Open, in progress or escalated" tone={s.pending ? 'warn' : undefined} />
        <AppMetricCard label="In progress" value={s.inProgress ?? '–'} />
        <AppMetricCard label="Resolved" value={s.resolved ?? '–'} tone="good" />
        <AppMetricCard label="Closed" value={s.closed ?? '–'} />
      </Box>
      <Tabs value={tab} onChange={(e, v) => { setTab(v); setPage(1); }} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map(([v, l]) => <Tab key={v} value={v} label={l} sx={{ textTransform: 'none', minHeight: 42 }} />)}
      </Tabs>
      {list.error && <Alert severity="error" sx={{ mb: 2 }}>{list.error.message}</Alert>}
      <AppDataTable loading={list.loading && !list.data} rows={list.data} onRowClick={(t) => navigate(`/support/${t.id}`)}
        empty={{ title: 'No tickets here', message: 'When something goes wrong, raise a ticket and follow the answer on this page.' }}
        columns={[
          { key: 'id', label: '#', width: 64, render: (t) => `#${t.id}` },
          { key: 'subject', label: 'Subject', render: (t) => <b>{t.subject}</b> },
          { key: 'category', label: 'Category', render: (t) => categoryLabel(t.category) },
          { key: 'priority', label: 'Priority', render: (t) => <PriorityChip priority={t.priority} /> },
          { key: 'status', label: 'Status', render: (t) => <AppStatusChip status={t.status} /> },
          { key: 'lastActivityAt', label: 'Last update', render: (t) => ago(t.lastActivityAt) }
        ]} />
      <CustomPagination meta={list.meta} onPage={setPage} />
      <NewTicketDialog open={open} onClose={() => setOpen(false)} onCreated={(t) => navigate(`/support/${t.id}`)} />
    </>
  );
}
