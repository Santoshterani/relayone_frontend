import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, AppBar, Toolbar, IconButton, Menu, MenuItem, Avatar, useMediaQuery, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { NAV } from './nav';
import { LogoutIcon } from '../icons';
import AppStatusChip from '../common/AppStatusChip';
import ErrorBoundary from '../ErrorBoundary';
import { useAppContext } from '../../hooks';
import { getCurrentUserRole } from '../../config/session';
import { APP_NAME } from '../../config';

const WIDTH = 232;

export default function AppShell() {
  const { user, logout, can } = useAppContext();
  const location = useLocation();
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const items = NAV.filter((n) => can(n.permission));
  const currentPage = NAV.find((n) => location.pathname === n.path || (n.path !== '/' && location.pathname.startsWith(`${n.path}/`)));
  const headerTitle = currentPage?.label || (user.isSuperAdmin ? 'RelayOne platform' : 'RelayOne support');

  const menu = (
    <Box sx={{ width: WIDTH, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2 }}><Typography sx={{ fontWeight: 600, fontSize: 18, color: 'primary.main', lineHeight: 1.15 }}>{APP_NAME}</Typography><Typography sx={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'text.secondary' }}>CPaaS Portal</Typography></Box>
      <List dense sx={{ px: 1, flex: 1 }}>
        {items.map((n) => (
          <ListItemButton key={n.path} component={NavLink} to={n.path} end={n.end} onClick={() => setOpen(false)}
            sx={{ borderRadius: 2, mb: 0.25, '&.active': { bgcolor: 'primary.main', color: '#fff', '& .MuiListItemIcon-root': { color: '#fff' } } }}>
            <ListItemIcon sx={{ minWidth: 34, color: 'text.secondary' }}><n.icon /></ListItemIcon>
            <ListItemText primary={n.label} primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Developed by Santosh Terani</Typography>
        <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>RelayOne © {new Date().getFullYear()}. All rights reserved.</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100%' }}>
      {wide
        ? <Drawer variant="permanent" sx={{ width: WIDTH, '& .MuiDrawer-paper': { width: WIDTH, borderRight: '1px solid', borderColor: 'divider' } }}>{menu}</Drawer>
        : <Drawer open={open} onClose={() => setOpen(false)}>{menu}</Drawer>}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar variant="dense" sx={{ gap: 1.5 }}>
            {!wide && <IconButton onClick={() => setOpen(true)} aria-label="Open menu" size="small">☰</IconButton>}
            <Typography sx={{ fontWeight: 600, flex: 1 }} noWrap>{headerTitle}</Typography>
            {user.enterprise && <AppStatusChip status={user.enterprise.status} />}
            <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account menu" size="small"><Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: 'primary.main' }}>{user.name.slice(0, 1).toUpperCase()}</Avatar></IconButton>
            <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
              <Box sx={{ px: 2, py: 1 }}><Typography sx={{ fontWeight: 600 }}>{user.name}</Typography><Typography variant="caption" color="text.secondary">{user.email} · {getCurrentUserRole(user)}</Typography></Box>
              <Divider />
              <MenuItem onClick={() => { setAnchor(null); logout(); }}><LogoutIcon sx={{ mr: 1 }} /> Sign out</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ p: { xs: 2, md: 3 }, pt: { xs: 1, md: 1.5 }, maxWidth: 1180, width: '100%' }}>
          <ErrorBoundary name="page"><Outlet /></ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}
