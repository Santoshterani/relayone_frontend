import React, { useState } from 'react';
import { Alert, Box, Button, Chip, LinearProgress, Paper, Tab, Tabs, Typography } from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PriceChangeOutlinedIcon from '@mui/icons-material/PriceChangeOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import AppTextField from '../../common/AppTextField';
import Grid from '@mui/material/Grid2';
import { AppPageHeader, AppSectionCard, AppMetricCard, AppDataTable, AppConfirmDialog, AppSkeletonLoader, CustomPagination } from '../../common';
import { useApi, useAppContext, useChannelTypes, useToast } from '../../../hooks';
import { walletService, planService, paymentService } from '../../../services';
import { pay, PaymentCancelled } from '../../../utils/razorpay';
import { date, dateTime, money, money4 } from '../../../utils/format';

const QUICK = [5, 10, 25, 50];
const TYPE = { topup: ['success', 'Top-up'], charge: ['default', 'Charge'], refund: ['info', 'Refund'], adjustment: ['info', 'Credit'] };

export default function Wallet() {
  const channelTypes = useChannelTypes();
  const { can, user } = useAppContext();
  const toast = useToast();
  const topup = can('wallet.topup');
  const [tab, setTab] = useState('wallet');
  const wallet = useApi(() => walletService.getWallet(), []);
  const [page, setPage] = useState(1); const [limit, setLimit] = useState(15);
  const tx = useApi(() => walletService.listTransactions({ page, limit }), [page, limit]);
  const [amount, setAmount] = useState('10');
  const [amountError, setAmountError] = useState('');
  const [threshold, setThreshold] = useState('');
  const [busy, setBusy] = useState('');
  const plans = useApi(() => planService.mine(), []);
  const gateway = useApi(() => paymentService.getConfig(), []);
  const cfg = gateway.data || { provider: 'demo', currency: 'USD', usdRate: 1 };
  const inGateway = (usd) => (cfg.currency === 'INR' ? `₹${(Number(usd) * cfg.usdRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : money(usd));
  const [buying, setBuying] = useState(null);

  if (wallet.loading && !wallet.data) return <><AppPageHeader title="Wallet & billing" /><AppSkeletonLoader variant="card" /></>;
  if (wallet.error && !wallet.data) return <Alert severity="error">{wallet.error.message}</Alert>;
  const w = wallet.data;
  const prices = w.prices || {};

  const addMoney = async () => {
    const n = Number(amount);
    if (!(n >= cfg.topupMin && n <= cfg.topupMax)) { setAmountError(`Enter an amount between $${cfg.topupMin} and $${Number(cfg.topupMax).toLocaleString()}.`); return; }
    setBusy('topup');
    try { await pay({ kind: 'topup', amount: n }, user); toast.success(`${money(n)} added to your wallet.`); wallet.reload(); setPage(1); tx.reload(); }
    catch (e) { if (!(e instanceof PaymentCancelled)) setAmountError(e.message); }
    finally { setBusy(''); }
  };
  const buyPlan = async () => {
    setBusy('buy');
    try { await pay({ kind: 'plan', planId: buying.id }, user); toast.success(`${buying.name} plan added: ${Number(buying.messages).toLocaleString()} messages.`); plans.reload(); wallet.reload(); tx.reload(); }
    catch (e) { if (!(e instanceof PaymentCancelled)) toast.error(e.message); }
    finally { setBusy(''); setBuying(null); }
  };
  const saveThreshold = async () => {
    const n = Number(threshold);
    if (threshold === '' || !(n >= 0)) { toast.error('Enter an amount of $0 or more.'); return; }
    setBusy('threshold');
    try { await walletService.setThreshold(n); toast.success('Alert level saved.'); setThreshold(''); wallet.reload(); } catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };

  return (
    <>
      <AppPageHeader title="Wallet & billing" subtitle="Prepaid balance in US dollars, and prepaid plans. Each message is paid for when accepted, and given back if it ends up failing." />
      <Tabs value={tab} onChange={(e, value) => setTab(value)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} aria-label="Wallet and billing sections">
        <Tab value="wallet" icon={<AccountBalanceWalletOutlinedIcon />} iconPosition="start" label="Wallet" sx={{ textTransform: 'none' }} />
        <Tab value="billing" icon={<ReceiptLongOutlinedIcon />} iconPosition="start" label="Billing" sx={{ textTransform: 'none' }} />
      </Tabs>
      {tab === 'wallet' && <>
      {w.lowBalance && <Alert severity="warning" sx={{ mb: 2 }}>Your balance is below your alert level of {money(w.threshold)}. Sending from the wallet stops when the balance is below the minimum of {money(w.minimumBalance)} (messages covered by a plan still go out).</Alert>}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}><AppMetricCard label="Balance" value={money(w.balance, 4)} tone={w.lowBalance ? 'warn' : undefined} hint={`Alert below ${money(w.threshold)} · Minimum to send ${money(w.minimumBalance)}`} /></Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <AppSectionCard title="Wallet price per message" icon={<PriceChangeOutlinedIcon />} sx={{ mb: 0, height: '100%' }}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {channelTypes.types.flatMap((c) => c.priceCodes).filter((pc) => prices[pc.code] !== undefined).map((pc) => [pc.label, prices[pc.code]]).map(([l, p]) => (
                <Box key={l}><Typography variant="caption" color="text.secondary">{l}</Typography><Typography sx={{ fontSize: 18, fontWeight: 600 }}>{money4(p)}</Typography></Box>))}
            </Box>
          </AppSectionCard>
        </Grid>
      </Grid>

      {plans.data && (() => {
        const p = plans.data;
        const active = p.buckets.filter((b) => (b.status ? b.status === 'active' : !b.expired) && b.remaining > 0);
        const liveQuota = active.reduce((a, b) => a + b.quota, 0);
        const exhausted = p.buckets.length > 0 && p.remaining === 0;
        const activeRemaining = active.reduce((a, b) => a + b.remaining, 0);
        const low = activeRemaining > 0 && activeRemaining <= Math.ceil(liveQuota * 0.2);
        return (
          <>
            {exhausted && <Alert severity="warning" sx={{ mb: 2 }}>Your plan messages are used up. New messages are charged to your wallet at the normal price. Buy a plan below to get the plan rate again.</Alert>}
            {p.buckets.some((b) => b.expired && b.lost > 0) && <Alert severity="info" sx={{ mb: 2 }}>A plan expired with unused messages, and they cannot be used any more. Any queued plan activates next; otherwise, messages are charged to your wallet.</Alert>}
            {active.some((b) => b.daysLeft <= 7) && <Alert severity="warning" sx={{ mb: 2 }}>A plan expires within {Math.max(...active.filter((b) => b.daysLeft <= 7).map((b) => b.daysLeft))} days. Use its messages or buy a new plan, because unused messages are lost on expiry.</Alert>}
            {low && <Alert severity="warning" sx={{ mb: 2 }}>Only {activeRemaining.toLocaleString()} messages left in your active plan. Buy another plan so it is ready when this one ends.</Alert>}
            <AppSectionCard title="Prepaid plans" icon={<Inventory2OutlinedIcon />} subtitle="Buy messages in bulk for a lower price per message. Plans activate in purchase order: each new plan starts when the previous one is used up or expires, and its validity starts on activation. Unused messages are lost when it expires. If no plan bucket is active, messages are charged to your wallet."
              actions={<Box sx={{ textAlign: 'right' }}><Typography variant="caption" color="text.secondary">Plan messages left</Typography><Typography sx={{ fontSize: 20, fontWeight: 600 }} data-testid="plan-remaining">{p.remaining.toLocaleString()}</Typography></Box>}>
              {p.plans.length === 0 ? <Typography color="text.secondary">No plans are on sale right now.</Typography> : (
                <Grid container spacing={2}>
                  {p.plans.map((pl) => (
                    <Grid key={pl.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontWeight: 600 }}>{pl.name}</Typography>
                        {pl.description && <Typography variant="caption" color="text.secondary">{pl.description}</Typography>}
                        <Typography sx={{ fontSize: 24, fontWeight: 600, mt: 1 }}>{money(pl.price)}</Typography>
                        <Typography variant="body2">{Number(pl.messages).toLocaleString()} messages, valid for {pl.validityDays} days</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>{money4(pl.perMessage)} per message</Typography>
                        {topup && <Button variant="outlined" startIcon={<ShoppingCartOutlinedIcon />} sx={{ mt: 'auto' }} onClick={() => setBuying(pl)} aria-label={`Buy ${pl.name} plan`}>Buy plan</Button>}
                      </Paper>
                    </Grid>))}
                </Grid>)}
              {p.buckets.length > 0 && (
                <Box sx={{ mt: 2.5 }}>
                  <Typography variant="h3" sx={{ mb: 1 }}>Your plans</Typography>
                  <AppDataTable rows={p.buckets} columns={[
                    { key: 'planName', label: 'Plan', render: (b) => b.planName },
                    { key: 'purchasedAt', label: 'Bought', render: (b) => date(b.purchasedAt) },
                    { key: 'status', label: 'Status', render: (b) => {
                      const status = b.status || (b.expired ? 'expired' : b.remaining === 0 ? 'completed' : 'active');
                      const [color, label] = status === 'active' ? ['success', 'Active'] : status === 'queued' ? ['default', 'Queued'] : status === 'expired' ? ['error', 'Expired'] : ['default', 'Used up'];
                      return <Chip size="small" color={color} variant="outlined" label={label} sx={{ height: 22 }} />;
                    } },
                    { key: 'expiresAt', label: 'Valid until', render: (b) => (b.status === 'queued' ? <Typography variant="body2" color="text.secondary">After previous plan</Typography> : b.expired ? <Chip size="small" color="error" variant="outlined" label={`Expired ${date(b.expiresAt)}`} sx={{ height: 22 }} /> : <Box><Typography variant="body2">{date(b.expiresAt)}</Typography><Typography variant="caption" color={b.daysLeft <= 7 ? 'warning.main' : 'text.secondary'}>{b.daysLeft} day{b.daysLeft === 1 ? '' : 's'} left</Typography></Box>) },
                    { key: 'pricePaid', label: 'Paid', align: 'right', render: (b) => money(b.pricePaid) },
                    { key: 'usage', label: 'Used', width: 220, render: (b) => (<Box><LinearProgress variant="determinate" value={(b.used / b.quota) * 100} sx={{ height: 6, borderRadius: 3, mb: 0.5 }} /><Typography variant="caption" color="text.secondary">{b.used.toLocaleString()} of {b.quota.toLocaleString()}</Typography></Box>) },
                    { key: 'remaining', label: 'Left', align: 'right', render: (b) => (b.expired ? (b.lost > 0 ? <Chip size="small" label={`${b.lost.toLocaleString()} lost`} sx={{ height: 22 }} /> : <Chip size="small" label="Used up" sx={{ height: 22 }} />) : b.remaining === 0 ? <Chip size="small" label="Used up" sx={{ height: 22 }} /> : b.remaining.toLocaleString()) }
                  ]} />
                </Box>)}
            </AppSectionCard>
            <AppConfirmDialog open={!!buying} title={buying ? `Buy the ${buying.name} plan?` : ''} message={buying ? (cfg.provider === 'razorpay' ? `${money(buying.price)} (${inGateway(buying.price)}) for ${Number(buying.messages).toLocaleString()} messages, valid for ${buying.validityDays} days. You will pay securely with Razorpay.` : `${money(buying.price)} for ${Number(buying.messages).toLocaleString()} messages, valid for ${buying.validityDays} days. Demo mode: no card is charged.`) : ''}
              confirmLabel={busy === 'buy' ? 'Waiting for payment…' : cfg.provider === 'razorpay' ? 'Continue to payment' : 'Buy plan'} busy={busy === 'buy'} onConfirm={buyPlan} onClose={() => setBuying(null)} />
          </>);
      })()}

      {topup && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <AppSectionCard title="Add money">
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>{QUICK.map((q) => <Chip key={q} label={`$${q}`} clickable color={Number(amount) === q ? 'primary' : 'default'} variant={Number(amount) === q ? 'filled' : 'outlined'} onClick={() => { setAmount(String(q)); setAmountError(''); }} />)}</Box>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                <AppTextField label="Amount (USD)" type="number" value={amount} onChange={(e) => { setAmount(e.target.value); setAmountError(''); }} error={!!amountError} helperText={amountError} sx={{ maxWidth: 200 }} />
                <Button variant="contained" startIcon={<AddCircleOutlineOutlinedIcon />} onClick={addMoney} disabled={!!busy}>{busy === 'topup' ? 'Waiting for payment…' : cfg.provider === 'razorpay' ? 'Pay with Razorpay' : 'Add money'}</Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>{cfg.provider === 'razorpay' ? `You pay ${inGateway(amount || 0)} (${money(amount || 0)} at ₹${cfg.usdRate} per $1) by card, UPI or net banking. Payments are processed securely by Razorpay.` : 'Demo mode: no card is charged. Set PAYMENT_PROVIDER=razorpay on the server to take real payments.'}</Typography>
            </AppSectionCard>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <AppSectionCard title="Low balance alert" icon={<NotificationsActiveOutlinedIcon />} subtitle="We email your billing contact once when the balance drops below this.">
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                <AppTextField label="Alert below (USD)" type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder={String(Number(w.threshold))} sx={{ maxWidth: 180 }} />
                <Button variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={saveThreshold} disabled={!!busy}>Save</Button>
              </Box>
            </AppSectionCard>
          </Grid>
        </Grid>
      )}
      </>}

      {tab === 'billing' && <AppSectionCard title="Transactions" icon={<ReceiptLongOutlinedIcon />}>
        <AppDataTable loading={tx.loading && !tx.data} rows={tx.data} empty={{ title: 'No transactions yet' }}
          columns={[
            { key: 'createdAt', label: 'Time', render: (t) => dateTime(t.createdAt) },
            { key: 'type', label: 'Type', render: (t) => <Chip size="small" color={TYPE[t.type][0]} variant={TYPE[t.type][0] === 'default' ? 'outlined' : 'filled'} label={TYPE[t.type][1]} sx={{ height: 22 }} /> },
            { key: 'description', label: 'Description' },
            { key: 'amount', label: 'Amount', align: 'right', render: (t) => (Number(t.amount) === 0 ? money4(0) : <span style={{ color: Number(t.amount) < 0 ? undefined : '#137A4B' }}>{Number(t.amount) < 0 ? '−' : '+'}{money4(Math.abs(t.amount))}</span>) },
            { key: 'balanceAfter', label: 'Balance', align: 'right', render: (t) => money4(t.balanceAfter) }
          ]} />
        {tx.meta && tx.meta.total > 0 && <CustomPagination
          page={tx.meta.page}
          totalPages={tx.meta.pages}
          totalCount={tx.meta.total}
          pageSize={tx.meta.limit}
          pageSizeOptions={[10, 15, 20, 50]}
          onPageChange={setPage}
          onPageSizeChange={(n) => { setLimit(n); setPage(1); }}
        />}
      </AppSectionCard>}
    </>
  );
}
