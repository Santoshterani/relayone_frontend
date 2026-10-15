import React from 'react';
import { Box, Typography } from '@mui/material';
import { APP_NAME } from '../../../config';
import { colors } from '../../../config/theme';

const POINTS = [
  'Bring your own email sender, so mail comes from your domain',
  'Queue, automatic retries and signed webhooks',
  'Prepaid wallet: pay only for what you send'
];

function Brand({ light }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: colors.cta, color: colors.ctaInk, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, flex: 'none' }}>RO</Box>
      <Box>
        <Typography component="b" sx={{ display: 'block', fontSize: 14, lineHeight: 1.15, fontWeight: 600, color: light ? '#fff' : 'text.primary' }}>{APP_NAME}</Typography>
        {light && <Typography component="small" sx={{ display: 'block', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.72)' }}>CPaaS Portal</Typography>}
      </Box>
    </Box>
  );
}

/** Split layout used by every sign-in / sign-up style page: navy pitch panel on the left, form on the right. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 5fr) minmax(0, 6fr)' }, bgcolor: 'background.paper' }}>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'center', gap: 3, bgcolor: colors.navy, color: '#fff', p: 'clamp(24px, 5vw, 64px)' }}>
        <Brand light />
        <Typography component="h2" sx={{ fontSize: 'clamp(22px, 2.6vw, 30px)', lineHeight: 1.2, fontWeight: 600, maxWidth: '18ch' }}>One API for email and in-app notifications</Typography>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.25, maxWidth: '38ch', color: 'rgba(255,255,255,.86)' }}>
          {POINTS.map((t) => (
            <Box component="li" key={t} sx={{ display: 'flex', gap: 1.25 }}>
              <Box component="span" aria-hidden sx={{ color: colors.cta, fontWeight: 700 }}>✓</Box><span>{t}</span>
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ display: 'grid', placeItems: 'start center', p: 'clamp(24px, 6vh, 64px) 16px' }}>
        <Box sx={{ width: 'min(420px, 100%)', display: 'flex', flexDirection: 'column', gap: 1.75 }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, mb: 1 }}><Brand /></Box>
          <Typography variant="h1" sx={{ fontSize: 22 }}>{title}</Typography>
          {subtitle && <Typography color="text.secondary" sx={{ mt: -1 }}>{subtitle}</Typography>}
          {children}
          {footer && <Typography color="text.secondary" sx={{ fontSize: 12.5, mt: 1 }}>{footer}</Typography>}
        </Box>
      </Box>
    </Box>
  );
}
