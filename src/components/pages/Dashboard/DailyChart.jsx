import React, { useState } from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { colors } from '../../../config/theme';

const W = 640; const H = 190; const PAD = { l: 34, r: 8, t: 10, b: 24 };
const niceMax = (n) => { if (n <= 4) return 4; const p = 10 ** Math.floor(Math.log10(n)); return Math.ceil(n / p) * p; };
const day = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' });
const full = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** One series: messages created per day. Hover a bar for the day's delivered/failed split. A table view is one click away. */
export default function DailyChart({ series }) {
  const [view, setView] = useState('chart');
  const [hover, setHover] = useState(null);
  const max = niceMax(Math.max(...series.map((d) => d.total), 0));
  const iw = W - PAD.l - PAD.r; const ih = H - PAD.t - PAD.b; const slot = iw / series.length; const bw = Math.min(26, slot * 0.5);
  const y = (v) => PAD.t + ih - (v / max) * ih;
  const ticks = [0, max / 2, max];
  const none = series.every((d) => d.total === 0);
  const h = hover != null ? series[hover] : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h3">Messages, last 7 days</Typography>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(e, v) => v && setView(v)} aria-label="Chart or table">
          <ToggleButton value="chart" sx={{ py: 0.25, px: 1.25 }}>Chart</ToggleButton><ToggleButton value="table" sx={{ py: 0.25, px: 1.25 }}>Table</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {view === 'table' ? (
        <Table size="small"><TableHead><TableRow><TableCell>Day</TableCell><TableCell align="right">Messages</TableCell><TableCell align="right">Delivered</TableCell><TableCell align="right">Failed</TableCell></TableRow></TableHead>
          <TableBody>{series.map((d) => <TableRow key={d.date}><TableCell>{full(d.date)}</TableCell><TableCell align="right">{d.total}</TableCell><TableCell align="right">{d.delivered}</TableCell><TableCell align="right">{d.failed}</TableCell></TableRow>)}</TableBody></Table>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Messages per day. Total ${series.reduce((a, d) => a + d.total, 0)} in 7 days.`} onMouseLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={colors.line} strokeWidth="1" />
                <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill={colors.muted}>{Math.round(t)}</text>
              </g>
            ))}
            {series.map((d, i) => {
              const cx = PAD.l + slot * i + slot / 2; const top = y(d.total); const bh = Math.max(d.total ? 2 : 0, PAD.t + ih - top);
              return (
                <g key={d.date} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${full(d.date)}: ${d.total} messages`}>
                  <rect x={PAD.l + slot * i} y={PAD.t} width={slot} height={ih} fill="transparent" />
                  {d.total > 0 && <path d={`M${cx - bw / 2},${PAD.t + ih} v${-Math.max(bh - 4, 0)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${Math.max(bh - 4, 0)} z`} fill={colors.navy} opacity={hover == null || hover === i ? 1 : 0.45} />}
                  <text x={cx} y={H - 7} textAnchor="middle" fontSize="10.5" fill={hover === i ? '#17203A' : colors.muted}>{day(d.date)}</text>
                </g>
              );
            })}
          </svg>
          {none && <Typography color="text.secondary" sx={{ position: 'absolute', top: '38%', left: 0, right: 0, textAlign: 'center' }}>No messages yet this week</Typography>}
          {h && (
            <Box sx={{ position: 'absolute', top: 0, left: `${((PAD.l + slot * hover + slot / 2) / W) * 100}%`, transform: 'translate(-50%, -4px)', bgcolor: '#101729', color: '#fff', px: 1.25, py: 0.75, borderRadius: 1.5, fontSize: 12, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 1 }}>
              <b>{full(h.date)}</b>: {h.total} message{h.total === 1 ? '' : 's'}<br />{h.delivered} delivered, {h.failed} failed
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
