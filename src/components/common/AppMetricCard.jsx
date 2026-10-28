import React from 'react';
import { Paper, Typography } from '@mui/material';

export default function AppMetricCard({ label, value, hint, tone, icon, accent, component = 'div', onClick, selected = false, ariaLabel }) {
  const color = { good: 'success.main', bad: 'error.main', warn: 'warning.main' }[tone] || 'text.primary';
  const accentColor = accent || { good: '#137A4B', bad: '#C42B3A', warn: '#F59E0B' }[tone] || '#315FE8';

  return (
    <Paper variant="outlined" component={component} onClick={onClick} aria-label={ariaLabel} sx={{
      position: 'relative', overflow: 'hidden', p: 2.25, width: '100%', height: '100%', minHeight: 128,
      borderRadius: 2, borderColor: selected ? 'primary.main' : '#e3e7f1',
      boxShadow: selected ? '0 0 0 1px #12285e' : '0 2px 8px rgba(18, 40, 94, 0.04)',
      cursor: onClick ? 'pointer' : undefined, textAlign: 'left', font: 'inherit',
      transition: 'box-shadow 160ms ease, transform 160ms ease',
      '&:hover': { boxShadow: '0 5px 16px rgba(18, 40, 94, 0.09)', transform: 'translateY(-1px)' },
      '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: accentColor }
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Typography sx={{ minWidth: 0, fontSize: 10, fontWeight: 700, letterSpacing: '.08em', lineHeight: 1.4, textTransform: 'uppercase', color: 'text.secondary' }}>{label}</Typography>
        {icon && <span style={{
          display: 'inline-flex', flex: '0 0 36px', width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
          borderRadius: 10, color: accentColor, backgroundColor: `${accentColor}14`
        }}>{icon}</span>}
      </div>
      <Typography sx={{ mt: 1, fontSize: { xs: 22, sm: 25 }, fontWeight: 700, color, lineHeight: 1.2, overflowWrap: 'anywhere' }}>{value}</Typography>
      {hint && <Typography sx={{ mt: 0.5, fontSize: 11.5, lineHeight: 1.45, color: 'text.secondary' }}>{hint}</Typography>}
    </Paper>
  );
}
