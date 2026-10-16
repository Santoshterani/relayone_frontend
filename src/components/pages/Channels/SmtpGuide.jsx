import React from 'react';
import { Box, Button, Typography } from '@mui/material';

export default function SmtpGuide({ guide }) {
  if (!guide) return null;
  return (
    <Box role="region" aria-label="Setup guide" sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'action.hover' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{guide.title}</Typography>
      <Box component="ol" sx={{ m: 0, pl: 2.5, '& li': { mb: 0.75, fontSize: 14 } }}>
        {guide.steps.map((s) => <li key={s}>{s}</li>)}
      </Box>
      {guide.notes.length > 0 && (
        <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5, color: 'text.secondary', '& li': { fontSize: 13, mb: 0.5 } }}>
          {guide.notes.map((n) => <li key={n}>{n}</li>)}
        </Box>
      )}
      {guide.link && <Button size="small" variant="outlined" sx={{ mt: 1.5 }} component="a" href={guide.link.url} target="_blank" rel="noopener noreferrer">{guide.link.label}</Button>}
    </Box>
  );
}
