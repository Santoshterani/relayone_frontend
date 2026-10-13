import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { colors } from '../../config/theme';

export const CHART_COLORS = ['#12285E', '#F59E0B', '#1F9D8B', '#7C8DB5', '#C42B3A', '#8B5CF6'];
const R = 52; const C = 2 * Math.PI * R; const GAP = 2;

/** Doughnut: data = [{ label, value, color? }]. The centre shows the total (or `centerLabel`). The legend carries every number, so colour is never the only cue. */
export default function DonutChart({ title, data, centerLabel = 'Total', emptyText = 'Nothing to show yet' }) {
  const [hover, setHover] = useState(null);
  const rows = data.map((d, i) => ({ ...d, color: d.color || CHART_COLORS[i % CHART_COLORS.length] }));
  const total = rows.reduce((a, d) => a + d.value, 0);
  let offset = 0;
  return (
    <Box>
      {title && <Typography variant="h3" sx={{ mb: 1.5 }}>{title}</Typography>}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ position: 'relative', width: 150, height: 150, flex: '0 0 auto' }}>
          <svg viewBox="0 0 150 150" width="150" height="150" role="img" aria-label={`${title || 'Chart'}: ${rows.map((d) => `${d.label} ${d.value}`).join(', ')}`}>
            <g transform="translate(75 75) rotate(-90)">
              <circle r={R} fill="none" stroke={colors.line} strokeWidth="18" />
              {total > 0 && rows.filter((d) => d.value > 0).map((d) => {
                const len = Math.max((d.value / total) * C - (rows.filter((x) => x.value > 0).length > 1 ? GAP : 0), 0.5);
                const el = <circle key={d.label} r={R} fill="none" stroke={d.color} strokeWidth={hover === d.label ? 22 : 18} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}
                  onMouseEnter={() => setHover(d.label)} onMouseLeave={() => setHover(null)} style={{ transition: 'stroke-width .12s' }}><title>{`${d.label}: ${d.value} (${Math.round((d.value / total) * 100)}%)`}</title></circle>;
                offset += (d.value / total) * C;
                return el;
              })}
            </g>
          </svg>
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <Typography sx={{ fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>{total.toLocaleString()}</Typography>
            <Typography variant="caption" color="text.secondary">{centerLabel}</Typography>
          </Box>
        </Box>
        <Box sx={{ flex: 1, minWidth: 150 }}>
          {total === 0 && <Typography color="text.secondary">{emptyText}</Typography>}
          {total > 0 && rows.map((d) => (
            <Box key={d.label} onMouseEnter={() => setHover(d.label)} onMouseLeave={() => setHover(null)} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, opacity: hover && hover !== d.label ? 0.55 : 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: d.color, flex: '0 0 auto' }} />
              <Typography sx={{ flex: 1 }}>{d.label}</Typography>
              <Typography sx={{ fontWeight: 600 }}>{d.value.toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ width: 38, textAlign: 'right' }}>{Math.round((d.value / total) * 100)}%</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
