import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Paper, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import DesktopWindowsOutlinedIcon from '@mui/icons-material/DesktopWindowsOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import { templateService } from '../../../services';
import { render } from '../../../utils/placeholders';

/**
 * One live preview for the whole template. It updates (after a short pause) whenever the design, the HTML, the subject,
 * the text or a sample value changes. Email layouts are rendered by the server, so the preview is exactly what is sent.
 * `values` = placeholder key -> sample value (empty ones stay as {key}).
 */
export default function LivePreview({ inapp, label: labelOverride, email, subject, body, values }) {
  const [device, setDevice] = useState('desktop');
  const [state, setState] = useState({ html: '', loading: false, error: '' });
  const designed = !inapp && email.mode !== 'plain';
  const draft = useMemo(() => JSON.stringify({
    mode: email.mode, design: email.mode === 'builder' ? email.design : null, html: email.mode === 'html' ? email.html : '', subject, body, values
  }), [email.mode, email.design, email.html, subject, body, values]);

  useEffect(() => {
    if (!designed) { setState({ html: '', loading: false, error: '' }); return undefined; }
    const d = JSON.parse(draft);
    if ((d.mode === 'html' && !String(d.html || '').trim()) || (d.mode === 'builder' && !(d.design && d.design.blocks && d.design.blocks.length))) { setState({ html: '', loading: false, error: '' }); return undefined; }
    setState((p) => ({ ...p, loading: true }));
    let live = true;
    const h = setTimeout(() => {
      templateService.renderDraft({ subject: d.subject || '', body: d.body || '', email: { mode: d.mode, ...(d.design ? { design: d.design } : {}), ...(d.mode === 'html' ? { html: d.html } : {}) }, values: d.values || {} })
        .then(({ data }) => { if (live) setState({ html: data.html || '', loading: false, error: '' }); })
        .catch((e) => { if (live) setState({ html: '', loading: false, error: e.message }); });
    }, 400);
    return () => { live = false; clearTimeout(h); };
  }, [draft, designed]);

  const shownSubject = render(subject, values); const shownBody = render(body, values);
  const label = labelOverride || (inapp ? 'Notification' : 'Email');
  return (
    <Paper variant="outlined" sx={{ p: 2, position: { lg: 'sticky' }, top: { lg: 16 }, mb: 2 }} data-testid="live-preview">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
        <Typography variant="h3">Live preview{state.loading && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>updating…</Typography>}</Typography>
        {designed && (
          <ToggleButtonGroup exclusive size="small" value={device} onChange={(e, v) => v && setDevice(v)} aria-label="Preview width">
            <ToggleButton value="desktop" aria-label="Desktop width"><DesktopWindowsOutlinedIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="mobile" aria-label="Mobile width"><PhoneIphoneOutlinedIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>Updates as you type. Uses the sample value, else the default, else the {'{placeholder}'}.</Typography>
      {state.error && <Alert severity="error" sx={{ mb: 1 }}>{state.error}</Alert>}
      <Typography variant="caption" color="text.secondary">{inapp ? 'Title' : 'Subject'}</Typography>
      <Typography sx={{ fontWeight: 600, mb: 1.5 }} data-testid="preview-subject">{shownSubject || '–'}</Typography>
      {designed ? (
        <Box sx={{ bgcolor: '#e5e7eb', borderRadius: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
          {state.html
            ? <iframe title="Email preview" data-testid="preview-frame" data-device={device} sandbox="" srcDoc={state.html} style={{ width: device === 'mobile' ? 375 : '100%', maxWidth: '100%', height: 560, border: 0, display: 'block', background: '#fff', transition: 'width .2s' }} />
            : <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">{email.mode === 'html' ? 'Paste some HTML to see it here.' : 'Add blocks to see the preview.'}</Typography></Box>}
        </Box>
      ) : (
        <>
          <Typography variant="caption" color="text.secondary">{inapp ? 'Text' : 'Body'}</Typography>
          <Box sx={{ whiteSpace: 'pre-wrap', bgcolor: 'background.default', p: 1.5, borderRadius: 1.5, maxWidth: device === 'mobile' ? 375 : 'none' }} data-testid="preview-body">{shownBody || '–'}</Box>
        </>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>{label} preview</Typography>
    </Paper>
  );
}
