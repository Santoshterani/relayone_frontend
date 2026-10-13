import React from 'react';
import { Box, Typography } from '@mui/material';
import { CHART_COLORS } from './DonutChart';

/** Horizontal bars: data = [{ label, value, color? }]. `format` turns a value into text. Bars start at zero and share one scale. */
export default function BarChart({ title, subtitle, data, format = (v) => v.toLocaleString(), emptyText = 'Nothing to show yet', color = CHART_COLORS[0] }) {
  const max = Math.max(...data.map((d) => d.value), 0);
  return (
    <Box>
      {title && <Typography variant="h3">{title}</Typography>}
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      <Box sx={{ mt: 1.5 }} role="img" aria-label={`${title || 'Chart'}: ${data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}`}>
        {(data.length === 0 || max === 0) && <Typography color="text.secondary">{emptyText}</Typography>}
        {max > 0 && data.map((d) => (
          <Box key={d.label} sx={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 200px) 1fr 80px', alignItems: 'center', gap: 1.5, py: 0.6 }}>
            <Typography noWrap title={d.label}>{d.label}</Typography>
            <Box sx={{ height: 12, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Box sx={{ height: '100%', width: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%`, bgcolor: d.color || color, borderRadius: 1, transition: 'width .3s' }} />
            </Box>
            <Typography sx={{ fontWeight: 600, textAlign: 'right' }}>{format(d.value)}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
