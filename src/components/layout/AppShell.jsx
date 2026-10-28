import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, AppBar, Toolbar, IconButton, Menu, MenuItem, Avatar, useMediaQuery, Divider, InputBase, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import { NAV } from './nav';
import { LogoutIcon } from '../icons';
import AppStatusChip from '../common/AppStatusChip';
import ErrorBoundary from '../ErrorBoundary';
import { useAppContext } from '../../hooks';
import { getCurrentUserRole } from '../../config/session';
import { APP_NAME } from '../../config';

const WIDTH = 232;
const COLLAPSED_WIDTH = 68;

export default function AppShell() {
  const { user, logout, can } = useAppContext();
  const location = useLocation();
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [anchor, setAnchor] = useState(null);
  const items = NAV.filter((n) => can(n.permission));
  const visibleItems = items.filter((n) => n.label.toLowerCase().includes(menuSearch.trim().toLowerCase()));
  const isCollapsed = wide && collapsed;
  const sidebarWidth = isCollapsed ? COLLAPSED_WIDTH : WIDTH;
  const currentPage = NAV.find((n) => location.pathname === n.path || (n.path !== '/' && location.pathname.startsWith(`${n.path}/`)));
  const headerTitle = currentPage?.label || (user.isSuperAdmin ? 'RelayOne platform' : 'RelayOne support');

  const menu = (
    <Box sx={{ width: sidebarWidth, display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper', transition: 'width 180ms ease' }}>
      <Box sx={{ px: isCollapsed ? 0 : 2.5, py: 2.25, borderBottom: '1px solid', borderColor: 'divider', textAlign: isCollapsed ? 'center' : 'left' }}>
        <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <Typography sx={{ fontWeight: 700, fontSize: isCollapsed ? 11 : 18, color: 'primary.main', lineHeight: 1.2 }}>{APP_NAME}</Typography>
          {!isCollapsed && <Typography sx={{ mt: 0.35, fontSize: 9.5, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'text.secondary' }}>CPaaS Portal</Typography>}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: isCollapsed ? 1 : 1.25, pt: 1.25 }}>
        {!isCollapsed && <Box sx={{
          display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, height: 34, px: 1,
          border: '1px solid', borderColor: 'divider', borderRadius: 1.25, bgcolor: '#fafbfe',
          '&:focus-within': { borderColor: 'primary.main', bgcolor: 'background.paper' }
        }}>
          <InputBase value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} placeholder="Search menu items"
            inputProps={{ 'aria-label': 'Search menu items' }} sx={{ flex: 1, minWidth: 0, fontSize: 11.5 }} />
          <SearchOutlinedIcon sx={{ color: 'text.secondary', fontSize: 17 }} />
        </Box>}
        {wide && <Tooltip title={collapsed ? 'Show sidebar' : 'Hide sidebar'} placement="right">
          <IconButton size="small" aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
            onClick={() => setCollapsed((value) => !value)}
            sx={{ width: 30, height: 30, flex: '0 0 auto', color: 'text.secondary', borderRadius: 1, '&:hover': { bgcolor: 'action.hover', color: 'primary.main' } }}>
            {collapsed ? <ChevronRightOutlinedIcon fontSize="small" /> : <ChevronLeftOutlinedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>}
      </Box>
      <List dense sx={{ px: collapsed ? 1 : 1.25, py: 1, flex: 1, overflowY: 'auto' }}>
        {visibleItems.map((n) => (
          <ListItemButton key={n.path} component={NavLink} to={n.path} end={n.end} onClick={() => setOpen(false)}
            sx={{
              position: 'relative', minHeight: 40, px: isCollapsed ? 1.5 : 1.25, mb: 0.5, borderRadius: 1.5,
              justifyContent: isCollapsed ? 'center' : undefined,
              color: 'text.primary', transition: 'background-color 140ms ease, color 140ms ease',
              '&:hover': { bgcolor: 'action.hover' },
              '&.active': {
                bgcolor: 'rgba(18, 40, 94, 0.07)', color: 'primary.main',
                '&::before': { content: '""', position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 3, bgcolor: 'primary.main' },
                '& .MuiListItemIcon-root': { color: 'primary.main' }
              }
            }}>
            <ListItemIcon sx={{ minWidth: isCollapsed ? 0 : 34, color: 'text.secondary', '& svg': { fontSize: 19 } }}>
              {isCollapsed ? <Tooltip title={n.label} placement="right"><n.icon /></Tooltip> : <n.icon />}
            </ListItemIcon>
            {!isCollapsed && <ListItemText primary={n.label} primaryTypographyProps={{ fontSize: 12.5, fontWeight: 500 }} />}
          </ListItemButton>
        ))}
        {!visibleItems.length && !isCollapsed && <Typography sx={{ px: 1, py: 1.5, fontSize: 11, color: 'text.secondary' }}>No menu items found</Typography>}
      </List>
      <Box sx={{ px: isCollapsed ? 1 : 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#fafbfe', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {!isCollapsed && <>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Developed by Santosh Terani</Typography>
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>RelayOne © {new Date().getFullYear()}. All rights reserved.</Typography>
        </>}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100%' }}>
      {wide
        ? <Drawer variant="permanent" sx={{ width: sidebarWidth, flexShrink: 0, transition: 'width 180ms ease', '& .MuiDrawer-paper': { width: sidebarWidth, overflowX: 'hidden', borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', transition: 'width 180ms ease' } }}>{menu}</Drawer>
        : <Drawer open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: WIDTH, borderRight: '1px solid', borderColor: 'divider' } }}>{menu}</Drawer>}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Toolbar variant="dense" sx={{ minHeight: 52, gap: 1.5 }}>
            {!wide && <IconButton onClick={() => setOpen(true)} aria-label="Open menu" size="small">☰</IconButton>}
            <Typography sx={{ fontWeight: 600, fontSize: 13.5, flex: 1 }} noWrap>{headerTitle}</Typography>
            {user.enterprise && <AppStatusChip status={user.enterprise.status} />}
            <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account menu" size="small"><Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: 'primary.main' }}>{user.name.slice(0, 1).toUpperCase()}</Avatar></IconButton>
            <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
              <Box sx={{ px: 2, py: 1 }}><Typography sx={{ fontWeight: 600 }}>{user.name}</Typography><Typography variant="caption" color="text.secondary">{user.email} · {getCurrentUserRole(user)}</Typography></Box>
              <Divider />
              <MenuItem onClick={() => { setAnchor(null); logout(); }}><LogoutIcon sx={{ mr: 1 }} /> Sign out</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 3 }, pt: { xs: 1, md: 1.5 }, width: '100%' }}>
          <ErrorBoundary name="page"><Outlet /></ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}
