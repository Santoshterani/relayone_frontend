import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardActions, CardContent, Chip, Tab, Tabs, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import PriceChangeOutlinedIcon from '@mui/icons-material/PriceChangeOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import Grid from '@mui/material/Grid2';
import AppTextField from '../../common/AppTextField';
import { AppPageHeader, AppSectionCard, AppEmptyState, AppSkeletonLoader } from '../../common';
import { useApi, useToast } from '../../../hooks';
import { planService, walletService } from '../../../services';
import { money, money4 } from '../../../utils/format';
import PlanDialog from './PlanDialog';

const PRICES = [['email_own', 'Email, enterprise\'s own SMTP', 'We only run the queue, retries and tracking.'], ['email_shared', 'Email, shared RelayOne sender', 'Includes the sending itself.'], ['inapp', 'In-app notification', 'Delivered over the live connection or the inbox.']];

/** Super Admin: the wallet price per message, and the prepaid plans (message buckets) enterprises can buy. */
export default function Plans() {
  const toast = useToast();
  const prices = useApi(() => walletService.getPrices(), []);
  const plans = useApi(() => planService.listAll(), []);
  const [draft, setDraft] = useState({}); const [errors, setErrors] = useState({}); const [saving, setSaving] = useState('');
  const [dialog, setDialog] = useState({ open: false, plan: null });
  const [tab, setTab] = useState('plans');
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
      <AppPageHeader title="Plans & pricing" subtitle="Manage prepaid message plans and wallet prices."
        actions={tab === 'plans' && <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => setDialog({ open: true, plan: null })}>New plan</Button>} />
      <Tabs value={tab} onChange={(e, value) => setTab(value)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} aria-label="Plans and pricing sections">
        <Tab value="plans" icon={<SellOutlinedIcon />} iconPosition="start" label="Plans" sx={{ textTransform: 'none' }} />
        <Tab value="pricing" icon={<PriceChangeOutlinedIcon />} iconPosition="start" label="Pricing" sx={{ textTransform: 'none' }} />
      </Tabs>

      {tab === 'pricing' && <AppSectionCard title="Wallet price per message" subtitle="Charged when an enterprise has no plan messages left. Changes apply to messages accepted from now on.">
        {prices.loading && !prices.data ? <AppSkeletonLoader variant="card" /> : prices.error && !prices.data ? <Alert severity="error">{prices.error.message}</Alert> : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {PRICES.map(([code, label, hint]) => (
              <Box key={code} sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Box sx={{ width: 280 }}><Typography sx={{ fontWeight: 500 }}>{label}</Typography><Typography variant="caption" color="text.secondary">{hint}</Typography></Box>
                <AppTextField size="small" label="USD" type="number" value={draft[code] ?? ''} onChange={(e) => { setDraft({ ...draft, [code]: e.target.value }); setErrors({}); }} error={!!errors[code]} helperText={errors[code]} inputProps={{ step: '0.0001', min: 0, 'aria-label': `Price: ${label}` }} sx={{ width: 150 }} />
                <Button variant="outlined" startIcon={<SaveOutlinedIcon />} disabled={!changed(code) || !!saving} onClick={() => save(code)} aria-label={`Save price: ${label}`} sx={{ mb: '2px' }}>{saving === code ? 'Saving…' : 'Save'}</Button>
              </Box>
            ))}
          </Box>
        )}
      </AppSectionCard>}

      {tab === 'plans' && (
        <AppSectionCard title="Prepaid message plans" icon={<Inventory2OutlinedIcon />} subtitle="Each purchase adds a message bucket to the enterprise. When the bucket runs out, sending continues at the wallet price.">
          {plans.error && !plans.data ? <Alert severity="error">{plans.error.message}</Alert> : plans.loading && !plans.data ? <AppSkeletonLoader variant="card" /> : !plans.data?.length ? (
            <AppEmptyState title="No plans yet" message="Create a plan so enterprises can buy messages in bulk." action={<Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => setDialog({ open: true, plan: null })}>New plan</Button>} />
          ) : (
            <Grid container spacing={2}>
              {plans.data.map((plan) => (
                <Grid key={plan.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <Typography variant="h3">{plan.name}</Typography>
                        <Chip size="small" color={plan.isActive ? 'success' : 'default'} variant={plan.isActive ? 'filled' : 'outlined'} label={plan.isActive ? 'On sale' : 'Hidden'} sx={{ height: 22 }} />
                      </Box>
                      {plan.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{plan.description}</Typography>}
                      <Typography sx={{ fontSize: 24, fontWeight: 600 }}>{money(plan.price)}</Typography>
                      <Typography variant="body2">{Number(plan.messages).toLocaleString()} messages</Typography>
                      <Typography variant="caption" color="text.secondary">{money4(plan.perMessage)} per message</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>Purchased {plan.purchases} times</Typography>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 1.5, justifyContent: 'flex-end' }}>
                      <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setDialog({ open: true, plan })} aria-label={`Edit plan ${plan.name}`}>Edit plan</Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </AppSectionCard>
      )}

      <PlanDialog open={dialog.open} plan={dialog.plan} onClose={() => setDialog({ open: false, plan: null })} onSaved={() => { setDialog({ open: false, plan: null }); plans.reload(); }} />
    </>
  );
}
