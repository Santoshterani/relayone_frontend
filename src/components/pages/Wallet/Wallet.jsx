import React, { useState } from 'react';
import { Alert, Box, Button, Chip, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AppPageHeader, AppSectionCard, AppMetricCard, AppDataTable, AppSkeletonLoader, CustomPagination } from '../../common';
import { useApi, useAppContext, useToast } from '../../../hooks';
import { walletService } from '../../../services';
import { dateTime, money, money4 } from '../../../utils/format';

const QUICK = [5, 10, 25, 50];
const TYPE = { topup: ['success', 'Top-up'], charge: ['default', 'Charge'], refund: ['info', 'Refund'], adjustment: ['info', 'Credit'] };

export default function Wallet() {
  const { can } = useAppContext();
  const toast = useToast();
  const topup = can('wallet.topup');
  const wallet = useApi(() => walletService.getWallet(), []);
  const [page, setPage] = useState(1);
  const tx = useApi(() => walletService.listTransactions({ page, limit: 15 }), [page]);
  const [amount, setAmount] = useState('10');
  const [amountError, setAmountError] = useState('');
  const [threshold, setThreshold] = useState('');
  const [busy, setBusy] = useState('');

  if (wallet.loading && !wallet.data) return <><AppPageHeader title="Wallet & billing" /><AppSkeletonLoader variant="card" /></>;
  if (wallet.error && !wallet.data) return <Alert severity="error">{wallet.error.message}</Alert>;
  const w = wallet.data;
  const prices = w.prices || {};

  const pay = async () => {
    const n = Number(amount);
    if (!(n >= 1 && n <= 1000)) { setAmountError('Enter an amount between $1 and $1,000.'); return; }
    setBusy('topup');
    try { await walletService.topUp(n); toast.success(`${money(n)} added to your wallet.`); wallet.reload(); setPage(1); tx.reload(); } catch (e) { setAmountError(e.message); } finally { setBusy(''); }
  };
  const saveThreshold = async () => {
    const n = Number(threshold);
    if (threshold === '' || !(n >= 0)) { toast.error('Enter an amount of $0 or more.'); return; }
    setBusy('threshold');
    try { await walletService.setThreshold(n); toast.success('Alert level saved.'); setThreshold(''); wallet.reload(); } catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };

  return (
    <>
      <AppPageHeader title="Wallet & billing" subtitle="Prepaid balance in US dollars. Each message is charged when accepted, and refunded if it ends up failing." />
      {w.lowBalance && <Alert severity="warning" sx={{ mb: 2 }}>Your balance is below your alert level of {money(w.threshold)}. Sending stops when it reaches $0.</Alert>}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}><AppMetricCard label="Balance" value={money(w.balance, 4)} tone={w.lowBalance ? 'warn' : undefined} hint={`Alert below ${money(w.threshold)}`} /></Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <AppSectionCard title="Price per message" sx={{ mb: 0, height: '100%' }}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {[['Email, your own SMTP', prices.email_own], ['Email, shared sender', prices.email_shared], ['In-app', prices.inapp]].map(([l, p]) => (
                <Box key={l}><Typography variant="caption" color="text.secondary">{l}</Typography><Typography sx={{ fontSize: 18, fontWeight: 600 }}>{money4(p)}</Typography></Box>))}
            </Box>
          </AppSectionCard>
        </Grid>
      </Grid>

      {topup && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <AppSectionCard title="Add money">
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>{QUICK.map((q) => <Chip key={q} label={`$${q}`} clickable color={Number(amount) === q ? 'primary' : 'default'} variant={Number(amount) === q ? 'filled' : 'outlined'} onClick={() => { setAmount(String(q)); setAmountError(''); }} />)}</Box>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <TextField label="Amount (USD)" type="number" value={amount} onChange={(e) => { setAmount(e.target.value); setAmountError(''); }} error={!!amountError} helperText={amountError} sx={{ maxWidth: 200 }} />
                <Button variant="contained" onClick={pay} disabled={!!busy} sx={{ mt: 0.25 }}>{busy === 'topup' ? 'Adding…' : 'Add money'}</Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>Demo mode: no card is charged. A payment provider connects here later.</Typography>
            </AppSectionCard>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <AppSectionCard title="Low balance alert" subtitle="We email your billing contact once when the balance drops below this.">
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <TextField label="Alert below (USD)" type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder={String(Number(w.threshold))} sx={{ maxWidth: 180 }} />
                <Button variant="outlined" onClick={saveThreshold} disabled={!!busy} sx={{ mt: 0.25 }}>Save</Button>
              </Box>
            </AppSectionCard>
          </Grid>
        </Grid>
      )}

      <AppSectionCard title="Transactions" sx={{ mt: 1 }}>
        <AppDataTable loading={tx.loading && !tx.data} rows={tx.data} empty={{ title: 'No transactions yet' }}
          columns={[
            { key: 'createdAt', label: 'Time', render: (t) => dateTime(t.createdAt) },
            { key: 'type', label: 'Type', render: (t) => <Chip size="small" color={TYPE[t.type][0]} variant={TYPE[t.type][0] === 'default' ? 'outlined' : 'filled'} label={TYPE[t.type][1]} sx={{ height: 22 }} /> },
            { key: 'description', label: 'Description' },
            { key: 'amount', label: 'Amount', align: 'right', render: (t) => <span style={{ color: Number(t.amount) < 0 ? undefined : '#137A4B' }}>{Number(t.amount) < 0 ? '−' : '+'}{money4(Math.abs(t.amount))}</span> },
            { key: 'balanceAfter', label: 'Balance', align: 'right', render: (t) => money4(t.balanceAfter) }
          ]} />
        <CustomPagination meta={tx.meta} onPage={setPage} />
      </AppSectionCard>
    </>
  );
}
