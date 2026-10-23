import React, { useState } from 'react';
import { Alert, Box, Button, Collapse, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { AppSectionCard } from '../../common';

const cell = { py: 0.5, px: 1, verticalAlign: 'middle' };
const input = (label, value, onChange, disabled, placeholder, width) => (
  <TextField size="small" hiddenLabel value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder}
    slotProps={{ htmlInput: { 'aria-label': label, style: { padding: '5px 8px', fontSize: 13 }, title: value || undefined } }} sx={{ width }} />
);

/** Compact placeholder list: one row each (key, Required, Default, Sample, short description). Collapsible. */
export default function PlaceholderTable({ keys, meta, setMeta, disabled }) {
  const [open, setOpen] = useState(true);
  const m = (k) => meta(k);
  const required = keys.filter((k) => m(k).isRequired).length;
  return (
    <AppSectionCard title="Placeholders" subtitle={keys.length ? `${keys.length} placeholder${keys.length === 1 ? '' : 's'} · ${required} required` : 'Found automatically from the text, design and channel texts.'}
      actions={keys.length > 0 && <Button size="small" onClick={() => setOpen((o) => !o)} endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />} aria-expanded={open} aria-label={open ? 'Hide placeholders' : 'Show placeholders'}>{open ? 'Hide' : 'Show'}</Button>}>
      {keys.length === 0 ? <Typography color="text.secondary">No placeholders yet. Type <code>{'{name}'}</code> in the text above.</Typography> : (
        <Collapse in={open} unmountOnExit>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" aria-label="Placeholders" data-testid="placeholder-table">
              <TableHead><TableRow>
                <TableCell sx={cell}>Placeholder</TableCell><TableCell sx={cell} align="center">Required</TableCell><TableCell sx={cell}>Default</TableCell><TableCell sx={cell}>Sample (preview)</TableCell><TableCell sx={cell}>Description</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k} hover>
                    <TableCell sx={cell}><span className="mono" style={{ fontWeight: 500 }}>{`{${k}}`}</span></TableCell>
                    <TableCell sx={cell} align="center"><Switch size="small" checked={m(k).isRequired} onChange={(e) => setMeta(k, { isRequired: e.target.checked })} disabled={disabled} inputProps={{ 'aria-label': `${k} required` }} /></TableCell>
                    <TableCell sx={cell}>{input(`Default of ${k}`, m(k).defaultValue, (v) => setMeta(k, { defaultValue: v }), disabled, 'none', 130)}</TableCell>
                    <TableCell sx={cell}>{input(`Sample of ${k}`, m(k).sampleValue, (v) => setMeta(k, { sampleValue: v }), disabled, 'e.g. Asha', 130)}</TableCell>
                    <TableCell sx={cell}><Tooltip title={m(k).description || ''} placement="top-start">{input(`Description of ${k}`, m(k).description, (v) => setMeta(k, { description: v }), disabled, 'What goes here?', '100%')}</Tooltip></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          <Alert severity="info" icon={false} sx={{ mt: 1.5, py: 0 }}>At send time the value from the API call is used. If it is missing, the default is used. A required placeholder with no default is rejected with <code>422 missing_template_variables</code>.</Alert>
        </Collapse>
      )}
    </AppSectionCard>
  );
}
