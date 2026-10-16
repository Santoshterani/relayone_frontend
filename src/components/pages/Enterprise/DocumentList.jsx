import React from 'react';
import { Alert, Box, Button, Paper, Typography } from '@mui/material';
import { DocChip, fileSize } from './documentUi';
import { dateTime } from '../../../utils/format';

const BORDER = { verified: '#BBF7D0', pending: '#BAE6FD', rejected: '#FECACA', not_submitted: undefined };
const BG = { verified: '#F0FDF4', pending: '#F0F9FF', rejected: '#FEF2F2', not_submitted: undefined };

/**
 * The five KYC documents. Enterprise mode: View, Upload / Replace. Admin mode: View, Verify, Reject.
 * onView(doc), onUpload(doc), onReview(doc, 'verified' | 'rejected').
 */
export default function DocumentList({ docs, admin, canEdit, onView, onUpload, onReview }) {
  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      {docs.map((d) => (
        <Paper key={d.type} variant="outlined" sx={{ p: 2, borderColor: BORDER[d.status], bgcolor: BG[d.status], display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 280px', minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.25 }}>
              <Typography sx={{ fontWeight: 600 }}>{d.title} <Box component="span" sx={{ color: 'error.main' }} aria-label="required">*</Box></Typography>
              <DocChip status={d.status} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{d.description}</Typography>
            {d.fileName && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.75 }}>
                {d.fileName} · {fileSize(d.sizeBytes)} · uploaded {dateTime(d.uploadedAt)}{d.expiryDate ? ` · expires ${d.expiryDate}` : ''}
                {d.status === 'verified' && d.reviewedBy ? ` · verified ${dateTime(d.reviewedAt)}` : ''}
              </Typography>
            )}
            {d.notes && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{admin ? 'Enterprise note' : 'Your note'}: {d.notes}</Typography>}
            {d.status === 'rejected' && d.reviewNote && <Alert severity="error" sx={{ mt: 1, py: 0 }}><b>{admin ? 'Your note' : 'Reviewer'}:</b> {d.reviewNote}</Alert>}
            {!admin && d.status === 'not_submitted' && <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: 'warning.main' }}>Required for KYC. Please upload to continue.</Typography>}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {d.fileName && <Button size="small" variant="outlined" onClick={() => onView(d)} aria-label={`View ${d.title}`}>View</Button>}
            {!admin && canEdit && <Button size="small" variant={d.status === 'not_submitted' || d.status === 'rejected' ? 'contained' : 'outlined'} onClick={() => onUpload(d)} aria-label={`${d.status === 'not_submitted' ? 'Upload' : 'Replace'} ${d.title}`}>{d.status === 'not_submitted' ? 'Upload' : 'Replace'}</Button>}
            {admin && d.fileName && d.status !== 'verified' && <Button size="small" color="success" variant="contained" onClick={() => onReview(d, 'verified')} aria-label={`Verify ${d.title}`}>Verify</Button>}
            {admin && d.fileName && d.status !== 'rejected' && <Button size="small" color="error" variant="outlined" onClick={() => onReview(d, 'rejected')} aria-label={`Reject ${d.title}`}>Reject</Button>}
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
