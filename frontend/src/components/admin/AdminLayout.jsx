import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, IconButton, AppBar, Toolbar, useMediaQuery
} from '@mui/material';
import {
  Dashboard, PhotoLibrary, People, Settings, Logout, LightMode, DarkMode, Menu
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../App';

const DRAWER_WIDTH = 220;

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin', icon: <Dashboard /> },
  { label: 'Galleries', path: '/admin/galleries', icon: <PhotoLibrary /> },
  { label: 'Users', path: '/admin/users', icon: <People /> },
  { label: 'Settings', path: '/admin/settings', icon: <Settings /> },
];

const isActivePath = (pathname, path) => {
  if (path === '/admin') return pathname === '/admin';
  return pathname.startsWith(path);
};

const DrawerContents = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const goTo = (path) => {
    navigate(path);
    onNavigate();
  };

  return (
    <>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" noWrap>Admin</Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {user?.username}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.path}
            selected={isActivePath(location.pathname, item.path)}
            onClick={() => goTo(item.path)}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton onClick={toggleMode} size="small" aria-label="Toggle theme">
          {mode === 'dark' ? <LightMode /> : <DarkMode />}
        </IconButton>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1 }}>
          <ListItemIcon sx={{ minWidth: 36 }}><Logout /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </>
  );
};

const drawerPaperSx = {
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
};

const AdminLayout = ({ children }) => {
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'), { noSsr: true });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentLabel = NAV_ITEMS.find((item) => isActivePath(location.pathname, item.path))?.label || 'Admin';

  return (
    <Box sx={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', minHeight: '100vh' }}>
      {isDesktop ? (
        <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, flexShrink: 0, ...drawerPaperSx }}>
          <DrawerContents onNavigate={() => {}} />
        </Drawer>
      ) : (
        <>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={drawerPaperSx}
          >
            <DrawerContents onNavigate={() => setMobileOpen(false)} />
          </Drawer>
          <AppBar position="sticky">
            <Toolbar variant="dense">
              <IconButton edge="start" color="inherit" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu />
              </IconButton>
              <Typography variant="subtitle1" noWrap sx={{ ml: 1 }}>{currentLabel}</Typography>
            </Toolbar>
          </AppBar>
        </>
      )}
      {/* clip (not auto) so main isn't a scroll container, which would break position: sticky */}
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, overflowX: 'clip' }}>
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
