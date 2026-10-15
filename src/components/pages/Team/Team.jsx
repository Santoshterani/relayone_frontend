import React, { useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { AppPageHeader } from '../../common';
import { useAppContext } from '../../../hooks';
import UsersPanel from './UsersPanel';
import RolesPanel from './RolesPanel';

/** One screen for people and what they can do: Users | Roles toggle. */
export default function Team() {
  const { can } = useAppContext();
  const canRoles = can('roles.manage');
  const [view, setView] = useState('users');
  const tab = canRoles ? view : 'users';
  return (
    <>
      <AppPageHeader title="Users & Roles" subtitle="People who can sign in to this account, and what each role lets them see and do." />
      <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
        {canRoles && (
          <ToggleButtonGroup exclusive fullWidth value={tab} onChange={(_, v) => v && setView(v)} aria-label="Users or Roles" sx={{ mb: 2.5, bgcolor: 'action.hover', p: 0.5, borderRadius: 2, '& .MuiToggleButton-root': { border: 0, borderRadius: 1.5, textTransform: 'none', fontWeight: 600, py: 0.75 }, '& .Mui-selected': { bgcolor: 'background.paper !important', boxShadow: 1 } }}>
            <ToggleButton value="users">Users</ToggleButton>
            <ToggleButton value="roles">Roles</ToggleButton>
          </ToggleButtonGroup>
        )}
        {tab === 'users' ? <UsersPanel /> : <RolesPanel />}
      </Box>
    </>
  );
}
