import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, MenuItem, Paper, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AppTextField from '../../common/AppTextField';
import Grid from '@mui/material/Grid2';
import { templateService } from '../../../services';
import { AppConfirmDialog } from '../../common';
import BlockEditor from './BlockEditor';
import { DEFAULT_THEME, FONTS, emptyDesign } from './designUi';

const COLORS = [['pageBg', 'Page background'], ['cardBg', 'Email background'], ['text', 'Text colour'], ['accent', 'Accent (buttons, brand)']];

/** Email layout: plain text, visual builder, or custom HTML. `value` = { mode, design, html }. */
export default function EmailDesigner({ value, onChange, disabled, catalog, onSample }) {
  const [confirming, setConfirming] = useState(false);
  const [genError, setGenError] = useState('');
  const valueRef = useRef(value); valueRef.current = value;
  const mode = value.mode;
  const design = value.design || emptyDesign();
  const set = (patch) => onChange({ ...value, ...patch });
  const theme = { ...DEFAULT_THEME, ...design.theme };
  const starters = catalog ? catalog.starters : [];

  // The visual builder and the Custom HTML tab share one email. Every change in the builder is turned into HTML (placeholders kept as {name})
  // and shown in the Custom HTML tab, unless that HTML was edited by hand (then only "Reset from builder" overwrites it).
  const designKey = JSON.stringify(design);
  const generate = () => templateService.renderDraft({ subject: '', body: '', email: { mode: 'builder', design }, values: {} }).then(({ data }) => data.html || '');
  useEffect(() => {
    if (mode === 'plain' || !value.design || value.htmlDirty) return undefined;
    if (!design.blocks.length) { if (value.html) onChange({ ...valueRef.current, html: '' }); return undefined; }
    let live = true;
    const h = setTimeout(() => {
      generate().then((html) => { if (live && !valueRef.current.htmlDirty && html !== valueRef.current.html) onChange({ ...valueRef.current, html }); setGenError(''); })
        .catch((e) => { if (live) setGenError(e.message); });
    }, 400);
    return () => { live = false; clearTimeout(h); };
  }, [designKey, mode, value.htmlDirty]); // eslint-disable-line react-hooks/exhaustive-deps
  const resetFromBuilder = async () => {
    setConfirming(false);
    try { const html = await generate(); onChange({ ...valueRef.current, html, htmlDirty: false }); setGenError(''); } catch (e) { setGenError(e.message); }
  };

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

      {mode === 'plain' && <Alert severity="info">The email is sent as plain text, exactly as written on the Basics tab. Choose <b>Visual builder</b> for colours, buttons and layout, or <b>Custom HTML</b> to paste your own design.</Alert>}

      {mode !== 'plain' && (
        <Box>
          <Box>
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
                        <AppTextField size="small" type="color" label={label} value={theme[k]} onChange={(e) => set({ design: { ...design, theme: { ...theme, [k]: e.target.value } } })} disabled={disabled} slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                    ))}
                    <Grid size={{ xs: 12, sm: 6 }}><AppTextField select size="small" label="Font" value={theme.font} onChange={(e) => set({ design: { ...design, theme: { ...theme, font: e.target.value } } })} disabled={disabled}>{Object.entries(FONTS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}</AppTextField></Grid>
                    <Grid size={{ xs: 6, sm: 3 }}><AppTextField size="small" type="number" label="Width (px)" value={theme.width} onChange={(e) => set({ design: { ...design, theme: { ...theme, width: Number(e.target.value) } } })} disabled={disabled} slotProps={{ htmlInput: { min: 320, max: 720, step: 20 } }} /></Grid>
                    <Grid size={{ xs: 6, sm: 3 }}><AppTextField size="small" type="number" label="Corner radius" value={theme.radius} onChange={(e) => set({ design: { ...design, theme: { ...theme, radius: Number(e.target.value) } } })} disabled={disabled} slotProps={{ htmlInput: { min: 0, max: 24 } }} /></Grid>
                  </Grid>
                </Paper>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Blocks</Typography>
                <BlockEditor blocks={design.blocks} onChange={(blocks) => set({ design: { ...design, theme, blocks } })} disabled={disabled} />
              </>
            )}
            {mode === 'html' && (
              <>
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  {value.design
                    ? <>This is the HTML of your visual design, with <code>{'{placeholders}'}</code> kept. It updates by itself while you use the builder. Once you edit it here it is yours: the builder no longer changes it, and when you save, this HTML is what is sent and the builder design is dropped.</>
                    : <>Paste email HTML (tables and inline styles work best in every mail app). Use <code>{'{name}'}</code> style placeholders. For safety, scripts, forms, iframes, event handlers and non-https images are removed when you save and when the email is sent.</>}
                </Alert>
                {genError && <Alert severity="error" sx={{ mb: 1.5 }}>{genError}</Alert>}
                {value.design && !disabled && (
                  <Box sx={{ mb: 1.5, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button size="small" variant="outlined" onClick={() => (value.htmlDirty ? setConfirming(true) : resetFromBuilder())}>Reset from builder</Button>
                    <Typography variant="caption" color="text.secondary">{value.htmlDirty ? 'You edited this HTML by hand. The builder no longer updates it.' : 'In sync with the visual builder.'}</Typography>
                  </Box>
                )}
                <AppTextField label="HTML" multiline minRows={16} value={value.html || ''} onChange={(e) => set({ html: e.target.value, htmlDirty: true })} disabled={disabled}
                  slotProps={{ htmlInput: { className: 'mono', style: { fontSize: 12.5 }, spellCheck: false } }} helperText="The Basics tab text is sent as the plain-text part for mail apps that cannot show HTML." />
                <AppConfirmDialog open={confirming} title="Replace your HTML?" confirmLabel="Replace with builder HTML" danger
                  message="This overwrites the HTML you edited by hand with the HTML made from the visual builder. This cannot be undone." onConfirm={resetFromBuilder} onClose={() => setConfirming(false)} />
              </>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
