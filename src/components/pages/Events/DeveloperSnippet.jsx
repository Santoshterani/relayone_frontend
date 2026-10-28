import React from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { BASE_URL } from '../../../config';
import useCopy from '../../../utils/useCopy';

const Block = ({ n, title, note, code }) => {
  const copy = useCopy();
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600 }}>{n}</Box>
        <Typography sx={{ fontWeight: 600, flex: 1 }}>{title}</Typography>
        <Button size="small" startIcon={<ContentCopyOutlinedIcon />} onClick={() => copy(code, 'Snippet')}>Copy</Button>
      </Box>
      {note && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>{note}</Typography>}
      <Box component="pre" className="rl-code mono" sx={{ m: 0, overflow: 'auto', fontSize: 12.5, lineHeight: 1.6 }}>{code}</Box>
    </Box>
  );
};

/** What the developer pastes into the website. Built from the event, so the key and the data fields are already filled in. */
export default function DeveloperSnippet({ event, open, onClose }) {
  if (!event) return null;
  const sample = Object.fromEntries((event.fields || []).filter((f) => !f.source || f.source === 'sent').map((f) => [f.fixedValue || f.key, f.sample || '…']));
  const dataJson = JSON.stringify(sample, null, 2).replace(/\n/g, '\n  ');
  const choose = event.mode === 'choose';
  const server = choose
    ? `POST ${BASE_URL}/v1/ui-sessions\nAuthorization: Bearer ro_live_••••••••\n\n{\n  "event": "${event.key}",\n  "to": "customer@example.com",\n  "data": ${dataJson}\n}\n\n→ { "data": { "id": "ses_…", "url": "…", "expiresIn": 600 } }`
    : `POST ${BASE_URL}/v1/events\nAuthorization: Bearer ro_live_••••••••\n\n{\n  "event": "${event.key}",\n  "to": "customer@example.com",\n  "data": ${dataJson}\n}\n\n→ 202 Accepted. The default template is sent right away.`;
  const page = `<script src="${BASE_URL}/widget/relayone-ui.js"></script>\n<script>\n  // sessionId comes from the call above, made on your server\n  RelayOne.open({\n    session: sessionId,\n    onSuccess: function (result) {\n      // result.messageId, result.templateName. Confirm it on your server:\n      // GET ${BASE_URL}/v1/ui-sessions/{sessionId}\n    }\n  });\n</script>`;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontSize: 16 }}>Connect “{event.name}” to your website</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" sx={{ mb: 2 }}>Give this to whoever builds your website. They paste it once. Afterwards you can change templates here and nothing in the code changes.</Typography>
        <Block n={1} title="On your server" note="Use your API key here. Never put it in the web page." code={server} />
        {choose
          ? <Block n={2} title="On your page: open the popup" code={page} />
          : <Alert severity="info">This event sends automatically, so there is nothing to add to the page. To let a person choose the template in a popup, change “Who decides” on the event.</Alert>}
        <Alert severity="success" sx={{ mt: 1 }}>Not sure it works? Use “Send a test” on the event. It runs these same steps with your sample data.</Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button variant="contained" onClick={onClose}>Done</Button></DialogActions>
    </Dialog>
  );
}
