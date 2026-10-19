import React from 'react';
import { Box, Button, IconButton, MenuItem, Paper, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AppTextField from '../../common/AppTextField';
import { BLOCKS } from './designUi';

const Align = ({ value, onChange, disabled }) => (
  <ToggleButtonGroup size="small" exclusive value={value || 'left'} onChange={(e, v) => v && onChange(v)} disabled={disabled} aria-label="Alignment">
    {['left', 'center', 'right'].map((a) => <ToggleButton key={a} value={a} sx={{ px: 1.25, textTransform: 'capitalize' }}>{a}</ToggleButton>)}
  </ToggleButtonGroup>
);

function Fields({ b, set, disabled }) {
  const f = (k, label, extra = {}) => <AppTextField size="small" label={label} value={b[k] ?? ''} onChange={(e) => set({ [k]: e.target.value })} disabled={disabled} {...extra} />;
  switch (b.type) {
    case 'header': return <Box sx={{ display: 'grid', gap: 1.25 }}>{f('brand', 'Brand name')}{f('logoUrl', 'Logo image link (https://…)')}<Align value={b.align} onChange={(align) => set({ align })} disabled={disabled} /></Box>;
    case 'heading': case 'text': return <Box sx={{ display: 'grid', gap: 1.25 }}>{f('text', b.type === 'heading' ? 'Heading' : 'Text', { multiline: true, minRows: b.type === 'text' ? 3 : 1 })}<Align value={b.align} onChange={(align) => set({ align })} disabled={disabled} /></Box>;
    case 'button': return <Box sx={{ display: 'grid', gap: 1.25 }}>{f('label', 'Button text')}{f('url', 'Link (https://… or a {placeholder})')}<Align value={b.align} onChange={(align) => set({ align })} disabled={disabled} /></Box>;
    case 'image': return <Box sx={{ display: 'grid', gap: 1.25 }}>{f('url', 'Image link (https://…)')}{f('alt', 'Description (for screen readers)')}</Box>;
    case 'footer': return f('text', 'Footer text', { multiline: true, minRows: 2 });
    case 'spacer': return f('height', 'Height (px)', { type: 'number', slotProps: { htmlInput: { min: 4, max: 80 } } });
    case 'details': return (
      <Box sx={{ display: 'grid', gap: 1 }}>
        {f('title', 'Table title')}
        {(b.rows || []).map((r, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1 }}>
            <AppTextField size="small" label="Label" value={r.label} disabled={disabled} onChange={(e) => set({ rows: b.rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
            <AppTextField size="small" label="Value" value={r.value} disabled={disabled} onChange={(e) => set({ rows: b.rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
            <Button size="small" color="error" disabled={disabled || b.rows.length < 2} onClick={() => set({ rows: b.rows.filter((x, j) => j !== i) })} aria-label={`Remove row ${i + 1}`}>×</Button>
          </Box>
        ))}
        <Box><Button size="small" disabled={disabled || (b.rows || []).length >= 20} onClick={() => set({ rows: [...(b.rows || []), { label: '', value: '' }] })}>Add row</Button></Box>
      </Box>
    );
    default: return <Typography variant="caption" color="text.secondary">No settings.</Typography>;
  }
}

/** The list of blocks: edit, move, delete, add. */
export default function BlockEditor({ blocks, onChange, disabled }) {
  const update = (i, patch) => onChange(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const move = (i, d) => { const n = [...blocks]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); onChange(n); };
  return (
    <Box>
      {blocks.map((b, i) => (
        <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2">{BLOCKS[b.type] ? BLOCKS[b.type].label : b.type}</Typography>
            <Box>
              <IconButton size="small" disabled={disabled || i === 0} onClick={() => move(i, -1)} aria-label={`Move block ${i + 1} up`}>↑</IconButton>
              <IconButton size="small" disabled={disabled || i === blocks.length - 1} onClick={() => move(i, 1)} aria-label={`Move block ${i + 1} down`}>↓</IconButton>
              <IconButton size="small" color="error" disabled={disabled} onClick={() => onChange(blocks.filter((x, j) => j !== i))} aria-label={`Delete block ${i + 1}`}>✕</IconButton>
            </Box>
          </Box>
          <Fields b={b} set={(patch) => update(i, patch)} disabled={disabled} />
        </Paper>
      ))}
      <AppTextField select size="small" label="Add a block" value="" onChange={(e) => onChange([...blocks, BLOCKS[e.target.value].make()])} disabled={disabled || blocks.length >= 40} sx={{ minWidth: 220 }}>
        {Object.entries(BLOCKS).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
      </AppTextField>
    </Box>
  );
}
