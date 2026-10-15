import React, { useState } from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { colors } from '../../../config/theme';

const W = 640; const H = 190; const PAD = { l: 30, r: 8, t: 10, b: 24 };
const niceMax = (n) => (n <= 4 ? 4 : Math.ceil(n / 4) * 4);
const short = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** Tickets raised and resolved per day (two series, grouped bars). Table view one click away. */
export default function TicketTrend({ series }) {
  const [view, setView] = useState('chart');
  const max = niceMax(Math.max(...series.flatMap((d) => [d.created, d.resolved]), 0));
  const iw = W - PAD.l - PAD.r; const ih = H - PAD.t - PAD.b; const slot = iw / series.length; const bw = Math.min(12, slot * 0.34);
  const y = (v) => PAD.t + ih - (v / max) * ih;
  const total = (k) => series.reduce((a, d) => a + d[k], 0);
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h3">Tickets, last 14 days</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[['Raised', colors.navy], ['Resolved', '#1F9D8B']].map(([l, c]) => <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: c }} /><Typography variant="caption">{l}</Typography></Box>)}
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(e, v) => v && setView(v)} aria-label="Chart or table">
            <ToggleButton value="chart" sx={{ py: 0.25, px: 1.25 }}>Chart</ToggleButton><ToggleButton value="table" sx={{ py: 0.25, px: 1.25 }}>Table</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      {view === 'table' ? (
        <Table size="small"><TableHead><TableRow><TableCell>Day</TableCell><TableCell align="right">Raised</TableCell><TableCell align="right">Resolved</TableCell></TableRow></TableHead>
          <TableBody>{series.map((d) => <TableRow key={d.date}><TableCell>{short(d.date)}</TableCell><TableCell align="right">{d.created}</TableCell><TableCell align="right">{d.resolved}</TableCell></TableRow>)}</TableBody></Table>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Tickets per day. ${total('created')} raised and ${total('resolved')} resolved in 14 days.`}>
          {[0, max / 2, max].map((tk) => (
            <g key={tk}><line x1={PAD.l} x2={W - PAD.r} y1={y(tk)} y2={y(tk)} stroke={colors.line} /><text x={PAD.l - 6} y={y(tk) + 4} textAnchor="end" fontSize="10" fill={colors.muted}>{Math.round(tk)}</text></g>
          ))}
          {series.map((d, i) => {
            const cx = PAD.l + slot * i + slot / 2;
            return (
              <g key={d.date}>
                <rect x={cx - bw - 1} y={y(d.created)} width={bw} height={Math.max(PAD.t + ih - y(d.created), d.created ? 1 : 0)} rx="2" fill={colors.navy}><title>{`${short(d.date)}: ${d.created} raised`}</title></rect>
                <rect x={cx + 1} y={y(d.resolved)} width={bw} height={Math.max(PAD.t + ih - y(d.resolved), d.resolved ? 1 : 0)} rx="2" fill="#1F9D8B"><title>{`${short(d.date)}: ${d.resolved} resolved`}</title></rect>
                {i % 2 === 0 && <text x={cx} y={H - 6} textAnchor="middle" fontSize="10" fill={colors.muted}>{short(d.date)}</text>}
              </g>
            );
          })}
        </svg>
      )}
    </Box>
  );
}
