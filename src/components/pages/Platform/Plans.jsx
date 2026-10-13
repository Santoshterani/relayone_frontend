import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, TextField, Typography } from '@mui/material';
import { AppPageHeader, AppSectionCard, AppDataTable, AppSkeletonLoader } from '../../common';
import { useApi, useToast } from '../../../hooks';
import { planService, walletService } from '../../../services';
import { money, money4 } from '../../../utils/format';
import PlanDialog from './PlanDialog';

const PRICES = [['email_own', 'Email, enterprise\'s own SMTP', 'We only run the queue, retries and tracking.'], ['email_shared', 'Email, shared RelayLite sender', 'Includes the sending itself.'], ['inapp', 'In-app notification', 'Delivered over the live connection or the inbox.']];

/** Super Admin: the wallet price per message, and the prepaid plans (message buckets) enterprises can buy. */
export default function Plans() {
  const toast = useToast();
  const prices = useApi(() => walletService.getPrices(), []);
  const plans = useApi(() => planService.listAll(), []);
  const [draft, setDraft] = useState({}); const [errors, setErrors] = useState({}); const [saving, setSaving] = useState('');
  const [dialog, setDialog] = useState({ open: false, plan: null });
  useEffect(() => { if (prices.data) setDraft(Object.fromEntries(Object.entries(prices.data).map(([k, v]) => [k, String(Number(v))]))); }, [prices.data]);

  const save = async (code) => {
    const n = Number(draft[code]);
    if (draft[code] === '' || !(n >= 0 && n <= 10)) { setErrors({ [code]: 'Enter a price between $0 and $10.' }); return; }
    setSaving(code);
    try { await walletService.setPrice(code, n); toast.success('Price saved. It applies to new messages.'); prices.reload(); } catch (e) { setErrors({ [code]: e.message }); } finally { setSaving(''); }
  };
  const changed = (code) => prices.data && Number(draft[code]) !== Number(prices.data[code]);

  return (
    <>
      <AppPageHeader title="Plans & pricing" subtitle="Set what a message costs from the wallet, and the prepaid plans that make it cheaper." actions={<Button variant="contained" onClick={() => setDialog({ open: true, plan: null })}>New plan</Button>} />

      <AppSectionCard title="Wallet price per message" subtitle="Charged when an enterprise has no plan messages left. Changes apply to messages accepted from now on.">
        {prices.loading && !prices.data ? <AppSkeletonLoader variant="card" /> : prices.error && !prices.data ? <Alert severity="error">{prices.error.message}</Alert> : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {PRICES.map(([code, label, hint]) => (
              <Box key={code} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <Box sx={{ width: 280 }}><Typography sx={{ fontWeight: 500 }}>{label}</Typography><Typography variant="caption" color="text.secondary">{hint}</Typography></Box>
                <TextField size="small" label="USD" type="number" value={draft[code] ?? ''} onChange={(e) => { setDraft({ ...draft, [code]: e.target.value }); setErrors({}); }} error={!!errors[code]} helperText={errors[code]} inputProps={{ step: '0.0001', min: 0, 'aria-label': `Price: ${label}` }} sx={{ width: 150 }} />
                <Button variant="outlined" disabled={!changed(code) || !!saving} onClick={() => save(code)} aria-label={`Save price: ${label}`} sx={{ mt: 0.25 }}>{saving === code ? 'Saving…' : 'Save'}</Button>
              </Box>
            ))}
          </Box>
        )}
      </AppSectionCard>

      <AppSectionCard title="Prepaid plans" subtitle="An enterprise buys a plan and gets a bucket of messages. We email its billing contact when the bucket runs low, and when it is empty sending carries on at the wallet price.">
        {plans.error && !plans.data ? <Alert severity="error">{plans.error.message}</Alert> : (
          <AppDataTable loading={plans.loading && !plans.data} rows={plans.data} empty={{ title: 'No plans yet', message: 'Create a plan so enterprises can buy messages in bulk.' }}
            columns={[
              { key: 'name', label: 'Plan', render: (p) => <Box><Typography sx={{ fontWeight: 600 }}>{p.name}</Typography>{p.description && <Typography variant="caption" color="text.secondary">{p.description}</Typography>}</Box> },
              { key: 'price', label: 'Price', align: 'right', render: (p) => money(p.price) },
              { key: 'messages', label: 'Messages', align: 'right', render: (p) => Number(p.messages).toLocaleString() },
              { key: 'perMessage', label: 'Per message', align: 'right', render: (p) => money4(p.perMessage) },
              { key: 'purchases', label: 'Bought', align: 'right', render: (p) => p.purchases },
              { key: 'status', label: 'Status', render: (p) => <Chip size="small" color={p.isActive ? 'success' : 'default'} variant={p.isActive ? 'filled' : 'outlined'} label={p.isActive ? 'On sale' : 'Hidden'} sx={{ height: 22 }} /> },
              { key: 'a', label: '', align: 'right', render: (p) => <Button size="small" onClick={() => setDialog({ open: true, plan: p })} aria-label={`Edit plan ${p.name}`}>Edit</Button> }
            ]} />
        )}
      </AppSectionCard>

      <PlanDialog open={dialog.open} plan={dialog.plan} onClose={() => setDialog({ open: false, plan: null })} onSaved={() => { setDialog({ open: false, plan: null }); plans.reload(); }} />
    </>
  );
}
