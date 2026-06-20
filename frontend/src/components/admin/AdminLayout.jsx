import { useNavigate, useLocation } from 'react-router';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, IconButton
} from '@mui/material';
import {
  Dashboard, PhotoLibrary, People, Settings, Logout, LightMode, DarkMode
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

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
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
              selected={isActive(item.path)}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton onClick={toggleMode} size="small">
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1 }}>
            <ListItemIcon sx={{ minWidth: 36 }}><Logout /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
