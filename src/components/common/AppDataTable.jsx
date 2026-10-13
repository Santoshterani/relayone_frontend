import React from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper } from '@mui/material';
import AppSkeletonLoader from './AppSkeletonLoader';
import AppEmptyState from './AppEmptyState';

/** columns = [{ key, label, render?(row), align?, width? }]. */
export default function AppDataTable({ columns, rows, loading, rowKey = 'id', onRowClick, empty }) {
  if (loading) return <AppSkeletonLoader variant="table" />;
  if (!rows || !rows.length) return <AppEmptyState title={(empty && empty.title) || 'Nothing here yet'} message={empty && empty.message} action={empty && empty.action} />;
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead><TableRow>{columns.map((c) => <TableCell key={c.key} align={c.align} sx={{ width: c.width }}>{c.label}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r[rowKey]} hover={!!onRowClick} onClick={onRowClick ? () => onRowClick(r) : undefined} sx={{ cursor: onRowClick ? 'pointer' : 'default' }}>
              {columns.map((c) => <TableCell key={c.key} align={c.align}>{c.render ? c.render(r) : r[c.key]}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
