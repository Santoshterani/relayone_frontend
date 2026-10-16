import React from 'react';
import { Alert, Box, Chip, TextField, Typography } from '@mui/material';
import { render } from '../../../utils/placeholders';

/** Text for a channel that is stored with the template but not connected for sending yet (WhatsApp, Telegram). */
export default function ChannelText({ label, value, onChange, max, disabled, sampleValues, bubbleColor }) {
  const shown = render(value, sampleValues);
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        <b>{label} sending is not connected yet.</b> You can already write the {label} version here, with the same {'{placeholders}'}. It is saved with this template and will be used as soon as {label} is switched on, with no change to the template or the API.
      </Alert>
      <TextField label={`${label} message`} multiline minRows={6} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        slotProps={{ htmlInput: { maxLength: max } }} helperText={`${value.length} of ${max} characters. Leave empty if this template is not used on ${label}.`} />
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">Preview <Chip size="small" label="not sendable yet" sx={{ ml: 1 }} /></Typography>
        <Box sx={{ mt: 1, p: 2, bgcolor: '#e9edef', borderRadius: 2 }}>
          <Box sx={{ display: 'inline-block', maxWidth: '85%', p: 1.25, bgcolor: bubbleColor, borderRadius: '10px 10px 10px 2px', whiteSpace: 'pre-wrap', boxShadow: '0 1px 1px rgba(0,0,0,.12)' }}>{shown || '–'}</Box>
        </Box>
      </Box>
    </Box>
  );
}
