import React from 'react';
import { Box, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { NAV } from '../layout/nav';

export default function AppPageHeader({ title, subtitle, actions }) {
  const { pathname } = useLocation();
  const currentPage = NAV.find((item) => pathname === item.path || (item.path !== '/' && pathname.startsWith(`${item.path}/`)));
  const showTitle = title !== currentPage?.label;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
      <Box sx={{ flex: '1 1 0', minWidth: 0 }}>{showTitle && <Typography variant="h1">{title}</Typography>}{subtitle && <Typography color="text.secondary" sx={{ mt: showTitle ? 0.25 : 0 }}>{subtitle}</Typography>}</Box>
      {actions && <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>{actions}</Box>}
    </Box>
  );
}
