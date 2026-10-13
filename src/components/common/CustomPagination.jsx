import React from 'react';
import { Box, Pagination, Select, MenuItem, Typography } from '@mui/material';
import { PAGE_SIZES } from '../../config';

/** meta = { page, limit, total, pages } from the API. */
export default function CustomPagination({ meta, onPage, onLimit }) {
  if (!meta || !meta.total) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, flexWrap: 'wrap', gap: 1 }}>
      <Typography variant="caption" color="text.secondary">{meta.total} total</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {onLimit && <Select size="small" value={meta.limit} onChange={(e) => onLimit(e.target.value)} sx={{ fontSize: 12 }}>{PAGE_SIZES.map((n) => <MenuItem key={n} value={n}>{n} / page</MenuItem>)}</Select>}
        <Pagination size="small" count={meta.pages} page={meta.page} onChange={(e, p) => onPage(p)} color="primary" />
      </Box>
    </Box>
  );
}
