import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, MenuItem, Paper, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { templateService } from '../../../services';
import BlockEditor from './BlockEditor';
import { DEFAULT_THEME, FONTS, emptyDesign } from './designUi';

const COLORS = [['pageBg', 'Page background'], ['cardBg', 'Email background'], ['text', 'Text colour'], ['accent', 'Accent (buttons, brand)']];

/** Email layout: plain text, visual builder, or custom HTML. `value` = { mode, design, html }. */
export default function EmailDesigner({ value, onChange, disabled, subject, body, sampleValues, catalog, onSample }) {
  const [preview, setPreview] = useState({ html: '', loading: false, error: '' });
  const mode = value.mode;
  const design = value.design || emptyDesign();
  const set = (patch) => onChange({ ...value, ...patch });
  const theme = { ...DEFAULT_THEME, ...design.theme };
  const starters = catalog ? catalog.starters : [];

  const draft = useMemo(() => JSON.stringify({ mode, design: mode === 'builder' ? design : null, html: mode === 'html' ? value.html : '', subject, body, sampleValues }), [mode, design, value.html, subject, body, sampleValues]);
  useEffect(() => {
    if (mode === 'plain') { setPreview({ html: '', loading: false, error: '' }); return undefined; }
    if (mode === 'html' && !String(value.html || '').trim()) { setPreview({ html: '', loading: false, error: '' }); return undefined; }
    setPreview((p) => ({ ...p, loading: true }));
    const h = setTimeout(() => {
      const d = JSON.parse(draft);
      templateService.renderDraft({ subject: d.subject || '', body: d.body || '', email: { mode: d.mode, ...(d.design ? { design: d.design } : {}), ...(d.mode === 'html' ? { html: d.html } : {}) }, values: d.sampleValues || {} })
        .then(({ data }) => setPreview({ html: data.html || '', loading: false, error: '' }))
        .catch((e) => setPreview({ html: '', loading: false, error: e.message }));
    }, 450);
    return () => clearTimeout(h);
  }, [draft, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickStarter = (id) => {
    const s = starters.find((x) => x.id === id); if (!s) return;
    onChange({ ...value, mode: 'builder', design: JSON.parse(JSON.stringify(s.design)) });
    onSample({ subject: s.subject, samples: s.samples });
  };

  return (
    <Box>
      <ToggleButtonGroup exclusive size="small" value={mode} onChange={(e, v) => v && set({ mode: v, design: v === 'builder' ? design : value.design })} disabled={disabled} aria-label="Email layout" sx={{ mb: 2 }}>
        <ToggleButton value="plain" sx={{ px: 2 }}>Plain text</ToggleButton>
        <ToggleButton value="builder" sx={{ px: 2 }}>Visual builder</ToggleButton>
        <ToggleButton value="html" sx={{ px: 2 }}>Custom HTML</ToggleButton>
      </ToggleButtonGroup>

      {mode === 'plain' && <Alert severity="info">The email is sent as plain text, exactly as written on the Message tab. Choose <b>Visual builder</b> for colours, buttons and layout, or <b>Custom HTML</b> to paste your own design.</Alert>}

      {mode !== 'plain' && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, xl: 6 }}>
            {mode === 'builder' && (
              <>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Start from a ready layout</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {starters.map((s) => <Chip key={s.id} clickable disabled={disabled} label={`${s.industry}: ${s.name}`} onClick={() => pickStarter(s.id)} variant="outlined" />)}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Picking one replaces the blocks below. You can then change every text, colour and block.</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Colours and style</Typography>
                  <Grid container spacing={1.5}>
                    {COLORS.map(([k, label]) => (
                      <Grid key={k} size={{ xs: 6, sm: 3 }}>
                        <TextField size="small" type="color" label={label} value={theme[k]} onChange={(e) => set({ design: { ...design, theme: { ...theme, [k]: e.target.value } } })} disabled={disabled} slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                    ))}
                    <Grid size={{ xs: 12, sm: 6 }}><TextField select size="small" label="Font" value={theme.font} onChange={(e) => set({ design: { ...design, theme: { ...theme, font: e.target.value } } })} disabled={disabled}>{Object.entries(FONTS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}</TextField></Grid>
                    <Grid size={{ xs: 6, sm: 3 }}><TextField size="small" type="number" label="Width (px)" value={theme.width} onChange={(e) => set({ design: { ...design, theme: { ...theme, width: Number(e.target.value) } } })} disabled={disabled} slotProps={{ htmlInput: { min: 320, max: 720, step: 20 } }} /></Grid>
                    <Grid size={{ xs: 6, sm: 3 }}><TextField size="small" type="number" label="Corner radius" value={theme.radius} onChange={(e) => set({ design: { ...design, theme: { ...theme, radius: Number(e.target.value) } } })} disabled={disabled} slotProps={{ htmlInput: { min: 0, max: 24 } }} /></Grid>
                  </Grid>
                </Paper>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Blocks</Typography>
                <BlockEditor blocks={design.blocks} onChange={(blocks) => set({ design: { ...design, theme, blocks } })} disabled={disabled} />
              </>
            )}
            {mode === 'html' && (
              <>
                <Alert severity="info" sx={{ mb: 1.5 }}>Paste email HTML (tables and inline styles work best in every mail app). Use <code>{'{name}'}</code> style placeholders. For safety, scripts, forms, iframes, event handlers and non-https images are removed when you save and when the email is sent.</Alert>
                <TextField label="HTML" multiline minRows={16} value={value.html || ''} onChange={(e) => set({ html: e.target.value })} disabled={disabled}
                  slotProps={{ htmlInput: { className: 'mono', style: { fontSize: 12.5 }, spellCheck: false } }} helperText="The Message tab text is sent as the plain-text part for mail apps that cannot show HTML." />
              </>
            )}
          </Grid>
          <Grid size={{ xs: 12, xl: 6 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Live preview {preview.loading && <Typography component="span" variant="caption" color="text.secondary">updating…</Typography>}</Typography>
            {preview.error && <Alert severity="error" sx={{ mb: 1 }}>{preview.error}</Alert>}
            <Paper variant="outlined" sx={{ overflow: 'hidden', bgcolor: '#e5e7eb' }}>
              {preview.html
                ? <iframe title="Email preview" sandbox="" srcDoc={preview.html} style={{ width: '100%', height: 620, border: 0, display: 'block', background: '#fff' }} />
                : <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">{mode === 'html' ? 'Paste some HTML to see it here.' : 'Add blocks to see the preview.'}</Typography></Box>}
            </Paper>
            <Typography variant="caption" color="text.secondary">Uses the sample values from the Placeholders section.</Typography>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
