import React from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { Alert, Box, Button, Typography, Chip, Link, LinearProgress } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AppPageHeader, AppSectionCard, AppMetricCard, AppDataTable, AppStatusChip, AppSkeletonLoader, AppEmptyState } from '../../common';
import DailyChart from './DailyChart';
import { useApi, useAppContext } from '../../../hooks';
import { dashboardService } from '../../../services';
import { money, money4, dateTime } from '../../../utils/format';

/** The sentence that tells the enterprise where it stands in onboarding. */
function AccountBanner({ account, can }) {
  const link = (to, label) => <Button component={RouterLink} to={to} size="small" color="inherit" sx={{ fontWeight: 600 }}>{label}</Button>;
  const left = Math.max(account.sandboxLimit - account.sandboxSent, 0);
  switch (account.status) {
    case 'sandbox': return <Alert severity="warning" sx={{ mb: 2 }} action={can('enterprise.read') && link('/profile', account.profileComplete ? 'Submit for review' : 'Complete profile')}>
      Sandbox: {left} of {account.sandboxLimit} test messages left. Complete the profile and submit it for approval to send live messages.</Alert>;
    case 'review': return <Alert severity="info" sx={{ mb: 2 }}>Your profile is with the RelayLite team for review. You can keep using the sandbox meanwhile ({left} test messages left).</Alert>;
    case 'changes': return <Alert severity="warning" sx={{ mb: 2 }} action={can('enterprise.read') && link('/profile', 'Update profile')}><b>Changes needed.</b> {account.reviewNote}</Alert>;
    case 'rejected': return <Alert severity="error" sx={{ mb: 2 }}><b>Not approved.</b> {account.reviewNote} Contact support if you think this is a mistake.</Alert>;
    case 'suspended': return <Alert severity="error" sx={{ mb: 2 }}>This account is suspended, so sending is stopped. Contact RelayLite support.</Alert>;
    default: return null;
  }
}

export default function Dashboard() {
  const { user, can } = useAppContext();
  const { data, loading, error, reload } = useApi(() => dashboardService.getDashboard(), []);
  if (user.isSuperAdmin) return <Navigate to="/platform" replace />;
  if (loading) return <><AppPageHeader title="Dashboard" /><AppSkeletonLoader variant="card" /></>;
  if (error) return <><AppPageHeader title="Dashboard" /><Alert severity="error" action={<Button color="inherit" onClick={reload}>Retry</Button>}>{error.message}</Alert></>;

  const { account, wallet, stats, setup } = data;
  const doneCount = setup.steps.filter((s) => s.done).length;

  return (
    <>
      <AppPageHeader title="Dashboard" subtitle={account.name} />
      <AccountBanner account={account} can={can} />
      {wallet && wallet.lowBalance && <Alert severity="warning" sx={{ mb: 2 }} action={can('wallet.topup') && <Button component={RouterLink} to="/wallet" size="small" color="inherit" sx={{ fontWeight: 600 }}>Top up</Button>}>Wallet balance {money(wallet.balance)} is below your alert level of {money(wallet.threshold)}.</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {wallet && <Grid size={{ xs: 6, md: 3 }}><AppMetricCard label="Wallet balance" value={money(wallet.balance)} tone={wallet.lowBalance ? 'warn' : undefined} hint={`Alert below ${money(wallet.threshold)}`} /></Grid>}
        {stats && <>
          <Grid size={{ xs: 6, md: 3 }}><AppMetricCard label="Messages sent" value={stats.total} hint="All time" /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><AppMetricCard label="Delivery rate" value={stats.deliveryRate == null ? '–' : `${stats.deliveryRate}%`} tone={stats.deliveryRate != null && stats.deliveryRate < 90 ? 'bad' : undefined} hint="Delivered of delivered + failed" /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><AppMetricCard label="Failed" value={stats.byStatus.failed} tone={stats.byStatus.failed ? 'bad' : undefined} hint={`${stats.byStatus.queued} waiting in queue`} /></Grid>
        </>}
      </Grid>

      {stats && <AppSectionCard><DailyChart series={stats.series} /></AppSectionCard>}

      {!setup.complete && (
        <AppSectionCard title="Get set up" subtitle={`${doneCount} of ${setup.steps.length} steps done`}>
          <LinearProgress variant="determinate" value={(doneCount / setup.steps.length) * 100} sx={{ mb: 1.5, height: 6, borderRadius: 3 }} />
          {setup.steps.map((s) => (
            <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
              <Chip size="small" label={s.done ? 'Done' : s.optional ? 'Optional' : 'To do'} color={s.done ? 'success' : 'default'} variant={s.done ? 'filled' : 'outlined'} sx={{ width: 74, height: 22 }} />
              <Typography sx={{ textDecoration: s.done ? 'line-through' : 'none', color: s.done ? 'text.secondary' : 'text.primary' }}>{s.label}</Typography>
            </Box>
          ))}
        </AppSectionCard>
      )}

      {stats && (
        <AppSectionCard title="Recent messages" actions={can('messages.read') && <Link component={RouterLink} to="/messages">View all</Link>}>
          <AppDataTable rows={stats.recent} empty={{ title: 'No messages yet', message: 'Create an API key and send your first message with POST /v1/messages.' }}
            columns={[
              { key: 'to', label: 'To' }, { key: 'channel', label: 'Channel' },
              { key: 'status', label: 'Status', render: (m) => <AppStatusChip status={m.status} /> },
              { key: 'cost', label: 'Cost', align: 'right', render: (m) => money4(m.cost) },
              { key: 'createdAt', label: 'Time', render: (m) => dateTime(m.createdAt) }
            ]} />
        </AppSectionCard>
      )}
      {!wallet && !stats && <AppEmptyState title="Welcome" message="Your role does not include any dashboard figures. Use the menu to open the pages you can access." />}
    </>
  );
}
