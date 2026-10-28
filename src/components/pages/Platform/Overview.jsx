import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Button } from '@mui/material';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import Grid from '@mui/material/Grid2';
import { AppPageHeader, AppSectionCard, AppMetricCard, AppCircularLoader, DonutChart, BarChart } from '../../common';
import DailyChart from '../Dashboard/DailyChart';
import { useApi } from '../../../hooks';
import { platformService } from '../../../services';
import { money } from '../../../utils/format';

const STATUS = [['active', 'Active', '#137A4B'], ['review', 'In review', '#F59E0B'], ['sandbox', 'Sandbox', '#7C8DB5'], ['changes', 'Changes needed', '#8B5CF6'], ['suspended', 'Suspended', '#C42B3A'], ['rejected', 'Rejected', '#667391']];

/** Super Admin overview: enterprises, traffic across the platform, and money. */
export default function Overview() {
  const { data, loading, error, reload } = useApi(() => platformService.dashboard(), []);
  if (loading && !data) return <AppCircularLoader overlay />;
  if (error && !data) return <><AppPageHeader title="Overview" /><Alert severity="error" action={<Button color="inherit" startIcon={<RefreshOutlinedIcon />} onClick={reload}>Retry</Button>}>{error.message}</Alert></>;
  const { enterprises: e, messages: m, revenue: r, topEnterprises } = data;
  const earned = Number(r.plans) + Number(r.topups);

  return (
    <>
      <AppPageHeader title="Dashboard" subtitle="How the platform is doing."
        actions={e.awaitingReview > 0 && <Button component={RouterLink} to="/platform" variant="contained" color="secondary" startIcon={<FactCheckOutlinedIcon />}>{e.awaitingReview} awaiting review</Button>} />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}><AppMetricCard label="Enterprises" value={e.total} hint={`${e.byStatus.active || 0} active`} icon={<BusinessOutlinedIcon fontSize="small" />} accent="#10B981" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><AppMetricCard label="Messages, all time" value={m.total.toLocaleString()} hint={`${m.byStatus.queued} in queue now`} icon={<MailOutlineIcon fontSize="small" />} accent="#315FE8" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><AppMetricCard label="Delivery rate" value={m.deliveryRate == null ? '–' : `${m.deliveryRate}%`} tone={m.deliveryRate != null && m.deliveryRate < 90 ? 'bad' : undefined} hint={`${m.byStatus.failed} failed`} icon={<CheckCircleOutlineOutlinedIcon fontSize="small" />} accent="#8B5CF6" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><AppMetricCard label="Money in, last 30 days" value={money(Number(r.plans30) + Number(r.topups30))} hint={`${money(earned)} all time`} icon={<AccountBalanceWalletOutlinedIcon fontSize="small" />} accent="#F59E0B" /></Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 7 }}><AppSectionCard sx={{ mb: 0, height: '100%' }}><DailyChart series={m.series} /></AppSectionCard></Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <AppSectionCard sx={{ mb: 0, height: '100%' }}>
            <DonutChart title="Enterprises by status" centerLabel="enterprises" emptyText="No enterprises yet."
              data={STATUS.map(([k, label, color]) => ({ label, color, value: e.byStatus[k] || 0 }))} />
          </AppSectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <AppSectionCard sx={{ mb: 0, height: '100%' }}>
            <BarChart title="Busiest enterprises" subtitle="Messages in the last 30 days" emptyText="No messages yet." data={topEnterprises.map((t) => ({ label: t.name, value: t.messages }))} />
          </AppSectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <AppSectionCard sx={{ mb: 0, height: '100%' }}>
            <BarChart title="Plan sales" subtitle={`${r.planPurchases} bought, ${money(r.plans)} in total`} emptyText="No plans bought yet." color="#F59E0B" format={(v) => `${v} sold`} data={r.byPlan.map((p) => ({ label: p.plan, value: p.purchases }))} />
          </AppSectionCard>
        </Grid>
      </Grid>
    </>
  );
}
