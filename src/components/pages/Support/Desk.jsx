import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, MenuItem, Paper, Tab, Tabs, TextField } from '@mui/material';
import { AppPageHeader, AppDataTable, AppStatusChip, AppMetricCard, AppSectionCard, DonutChart, CustomPagination } from '../../common';
import { useApi, useAppContext } from '../../../hooks';
import { supportService } from '../../../services';
import TicketTrend from './TicketTrend';
import { PriorityChip, DueChip, LevelChip, CATEGORIES, PRIORITIES, categoryLabel, ago, minutes } from './ticketUi';

const TABS = [['', 'All'], ['open', 'Open'], ['in_progress', 'In progress'], ['escalated', 'Escalated'], ['resolved', 'Resolved'], ['closed', 'Closed']];
const COUNT_KEY = { open: 'open', in_progress: 'inProgress', escalated: 'escalated', resolved: 'resolved', closed: 'closed' };

/** Support desk for staff and the Super Admin: how many tickets, what is pending, resolved or escalated, and every ticket's details. */
export default function Desk() {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [tab, setTab] = useState(''); const [page, setPage] = useState(1);
  const [level, setLevel] = useState(''); const [priority, setPriority] = useState(''); const [category, setCategory] = useState(''); const [assignee, setAssignee] = useState(''); const [q, setQ] = useState('');
  const sum = useApi(() => supportService.summary(), []);
  const agents = useApi(() => supportService.agents(), []);
  const list = useApi(() => supportService.list({ page, limit: 20, ...(tab ? { status: tab } : {}), ...(level === 'breached' ? { breached: true } : level ? { level } : {}), ...(priority ? { priority } : {}), ...(category ? { category } : {}), ...(assignee === 'none' ? { unassigned: true } : assignee ? { assigneeId: assignee } : {}), ...(q.trim() ? { q: q.trim() } : {}) }), [tab, page, level, priority, category, assignee, q]);
  const s = sum.data; const c = s ? s.counts : {};
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1); };

  return (
    <>
      <AppPageHeader title="Support desk" subtitle={s ? `${c.total} ticket${c.total === 1 ? "" : "s"} in all. ${c.pending} pending${c.escalated ? `, ${c.escalated} escalated` : ''}${c.unassigned ? `, ${c.unassigned} unassigned` : ''}.` : ' '} />
      {sum.error && <Alert severity="error" sx={{ mb: 2 }}>{sum.error.message}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 1.5 }}>
        <AppMetricCard label="Raised (all time)" value={c.total ?? '–'} />
        <AppMetricCard label="Pending" value={c.pending ?? '–'} hint="Open or in progress" tone={c.pending ? 'warn' : undefined} />
        <AppMetricCard label="Escalated" value={c.escalated ?? '–'} tone={c.escalated ? 'bad' : undefined} />
        <AppMetricCard label="Resolved" value={c.resolved ?? '–'} hint={c.closed ? `${c.closed} closed` : undefined} tone="good" />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 1.5, mb: 2.5 }}>
        <AppMetricCard label="Past deadline" value={c.breached ?? '–'} hint="Not resolved in time" tone={c.breached ? 'bad' : undefined} />
        <AppMetricCard label="Senior queue (L2)" value={c.senior ?? '–'} hint="Escalated, critical" tone={c.senior ? 'bad' : undefined} />
        <AppMetricCard label="Unassigned" value={c.unassigned ?? '–'} tone={c.unassigned ? 'warn' : undefined} />
        <AppMetricCard label="Avg first response" value={s ? minutes(s.avgFirstResponseMinutes) : '–'} />
        <AppMetricCard label="Avg time to resolve" value={s ? minutes(s.avgResolutionMinutes) : '–'} />
      </Box>
      {s && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, gap: 2, mb: 2 }}>
          <Paper variant="outlined" sx={{ p: 2.5 }}><TicketTrend series={s.series} /></Paper>
          <Paper variant="outlined" sx={{ p: 2.5 }}><DonutChart title="Live tickets by priority" centerLabel="live" data={PRIORITIES.map(([v, l]) => ({ label: l, value: s.byPriority[v] || 0, color: { low: '#7C8DB5', medium: '#12285E', high: '#F59E0B', critical: '#C42B3A' }[v] }))} emptyText="No live tickets" /></Paper>
        </Box>
      )}
      <AppSectionCard title="All tickets" sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(e, v) => { setTab(v); setPage(1); }} variant="scrollable" scrollButtons="auto" sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          {TABS.map(([v, l]) => <Tab key={v} value={v} sx={{ textTransform: 'none', minHeight: 42 }} label={v && c[COUNT_KEY[v]] ? `${l} (${c[COUNT_KEY[v]]})` : l} />)}
        </Tabs>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>
          <TextField placeholder="Search subject or ticket #" value={q} onChange={reset(setQ)} sx={{ flex: '1 1 220px', maxWidth: 320 }} inputProps={{ 'aria-label': 'Search tickets' }} />
          <TextField select value={level} onChange={reset(setLevel)} sx={{ width: 170 }} SelectProps={{ displayEmpty: true }} inputProps={{ 'aria-label': 'Filter by level' }}><MenuItem value="">All levels</MenuItem><MenuItem value="1">Level 1 (agents)</MenuItem><MenuItem value="2">Level 2 (senior)</MenuItem><MenuItem value="breached">Past deadline</MenuItem></TextField>
          <TextField select value={priority} onChange={reset(setPriority)} sx={{ width: 150 }} SelectProps={{ displayEmpty: true }} inputProps={{ 'aria-label': 'Filter by priority' }}><MenuItem value="">All priorities</MenuItem>{PRIORITIES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}</TextField>
          <TextField select value={category} onChange={reset(setCategory)} sx={{ width: 190 }} SelectProps={{ displayEmpty: true }} inputProps={{ 'aria-label': 'Filter by category' }}><MenuItem value="">All categories</MenuItem>{CATEGORIES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}</TextField>
          <TextField select value={assignee} onChange={reset(setAssignee)} sx={{ width: 170 }} SelectProps={{ displayEmpty: true }} inputProps={{ 'aria-label': 'Filter by assignee' }}><MenuItem value="">Anyone</MenuItem><MenuItem value="none">Unassigned</MenuItem>{(agents.data || []).map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}</TextField>
        </Box>
        {list.error && <Alert severity="error" sx={{ mb: 2 }}>{list.error.message}</Alert>}
        <AppDataTable loading={list.loading && !list.data} rows={list.data} onRowClick={(t) => navigate(`/desk/${t.id}`)} empty={{ title: 'No tickets match', message: 'Change the filters or wait for new tickets.' }}
          columns={[
            { key: 'id', label: '#', width: 56, render: (t) => `#${t.id}` },
            { key: 'subject', label: 'Ticket', render: (t) => <Box><b>{t.subject}</b> <LevelChip ticket={t} /><Box component="span" sx={{ display: 'block', fontSize: 12, color: 'text.secondary' }}>{t.enterpriseName} · {categoryLabel(t.category)}</Box></Box> },
            { key: 'priority', label: 'Priority', render: (t) => <PriorityChip priority={t.priority} /> },
            { key: 'status', label: 'Status', render: (t) => <AppStatusChip status={t.status} /> },
            { key: 'assignee', label: 'Assigned to', render: (t) => (t.assignee ? (t.assignee.name + (user && t.assignee.id === user.id ? ' (you)' : '')) : 'Unassigned') },
            { key: 'dueAt', label: 'Resolve by', render: (t) => <DueChip ticket={t} /> },
            { key: 'lastActivityAt', label: 'Last update', render: (t) => ago(t.lastActivityAt) }
          ]} />
        <CustomPagination meta={list.meta} onPage={setPage} />
      </AppSectionCard>
    </>
  );
}
