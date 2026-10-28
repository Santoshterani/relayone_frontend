import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, MenuItem } from '@mui/material';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import AppTextField from '../../common/AppTextField';
import { AppPageHeader, AppDataTable, AppStatusChip, CustomPagination } from '../../common';
import MessageDrawer from './MessageDrawer';
import SendTestDialog from './SendTestDialog';
import { useApi, useAppContext, useChannelTypes } from '../../../hooks';
import { messageService } from '../../../services';
import debounce from '../../../utils/debounce';
import { dateTime, money4 } from '../../../utils/format';

export default function Messages() {
  const channelTypes = useChannelTypes();
  const { can } = useAppContext();
  const [filters, setFilters] = useState({ status: '', channel: '', q: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [open, setOpen] = useState(null);
  const [sending, setSending] = useState(false);

  const params = useMemo(() => ({ page, limit, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }), [page, limit, filters]);
  const { data, meta, loading, error, reload } = useApi(() => messageService.listMessages(params), [params]);

  const applySearch = useMemo(() => debounce((q) => { setFilters((f) => ({ ...f, q })); setPage(1); }, 350), []);
  useEffect(() => () => applySearch.cancel(), [applySearch]);
  const setFilter = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.value })); setPage(1); };

  // keep the list fresh while messages are still moving through the queue
  const waiting = !!data && data.some((m) => m.status === 'queued' || m.status === 'sent');
  useEffect(() => { if (!waiting) return undefined; const t = setInterval(reload, 4000); return () => clearInterval(t); }, [waiting, reload]);

  return (
    <>
      <AppPageHeader title="Message logs" subtitle="Every message sent through your API keys or this portal."
        actions={<><Button onClick={reload} startIcon={<RefreshOutlinedIcon />}>Refresh</Button>{can('messages.send') && <Button variant="contained" onClick={() => setSending(true)} startIcon={<SendOutlinedIcon />}>Send test message</Button>}</>} />
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <AppTextField label="Search recipient, id or subject" value={search} onChange={(e) => { setSearch(e.target.value); applySearch(e.target.value); }} sx={{ maxWidth: 320 }} />
        <AppTextField select label="Status" value={filters.status} onChange={setFilter('status')} SelectProps={{ displayEmpty: true }} sx={{ width: 150 }}>
          <MenuItem value="">All</MenuItem>{['queued', 'sent', 'delivered', 'failed'].map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}</AppTextField>
        <AppTextField select label="Channel" value={filters.channel} onChange={setFilter('channel')} SelectProps={{ displayEmpty: true }} sx={{ width: 150 }}><MenuItem value="">All</MenuItem>{channelTypes.types.map((c) => <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>)}</AppTextField>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
      <AppDataTable loading={loading && !data} rows={data} onRowClick={(m) => setOpen(m.id)}
        empty={{ title: 'No messages found', message: Object.values(filters).some(Boolean) ? 'Try clearing the filters.' : 'Messages appear here as soon as you send one with POST /v1/messages.' }}
        columns={[
          { key: 'createdAt', label: 'Time', render: (m) => dateTime(m.createdAt) },
          { key: 'to', label: 'To', render: (m) => <b>{m.to}</b> },
          { key: 'channel', label: 'Channel', render: (m) => channelTypes.labelOf(m.channel) },
          { key: 'subject', label: 'Subject', render: (m) => m.subject || '–' },
          { key: 'status', label: 'Status', render: (m) => <AppStatusChip status={m.status} /> },
          { key: 'attempts', label: 'Tries', align: 'right', render: (m) => (m.attempts > 1 || m.nextRetryAt ? <span title={m.nextRetryAt ? `Next retry ${dateTime(m.nextRetryAt)}` : undefined}>{m.attempts}{m.nextRetryAt ? ' · retrying' : ''}</span> : m.attempts) },
          { key: 'cost', label: 'Cost', align: 'right', render: (m) => money4(m.cost) }
        ]} />
      {meta && meta.total > 0 && <CustomPagination
        page={meta.page}
        totalPages={meta.pages}
        totalCount={meta.total}
        pageSize={meta.limit}
        onPageChange={setPage}
        onPageSizeChange={(n) => { setLimit(n); setPage(1); }}
      />}
      <MessageDrawer id={open} onClose={() => setOpen(null)} />
      <SendTestDialog open={sending} onClose={() => setSending(false)} onSent={reload} />
    </>
  );
}
