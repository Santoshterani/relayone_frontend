import React from 'react';
import { Skeleton, Stack, Paper } from '@mui/material';

/** variant: table | card | text */
export default function AppSkeletonLoader({ variant = 'text', rows = 5 }) {
  if (variant === 'card') return <Paper variant="outlined" sx={{ p: 2 }}><Skeleton width="40%" /><Skeleton variant="rounded" height={60} sx={{ mt: 1 }} /></Paper>;
  if (variant === 'table') return <Stack spacing={1}>{Array.from({ length: rows }, (_, i) => <Skeleton key={i} variant="rounded" height={34} />)}</Stack>;
  return <Stack spacing={0.5}>{Array.from({ length: rows }, (_, i) => <Skeleton key={i} width={`${90 - i * 8}%`} />)}</Stack>;
}
