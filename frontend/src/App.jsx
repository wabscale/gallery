import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { SiteSettingsProvider, useSiteSettings } from './hooks/useSiteSettings';
import { darkTheme, lightTheme } from './theme';
import GalleryList from './components/gallery/GalleryList';
import GalleryGrid from './components/gallery/GalleryGrid';
import Login from './components/admin/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import GalleryManager from './components/admin/GalleryManager';
import GalleryDetails from './components/admin/GalleryDetails';
import SiteSettings from './components/admin/SiteSettings';
import UserManager from './components/admin/UserManager';
import AdminLayout from './components/admin/AdminLayout';

const ThemeContext = createContext(null);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeContext');
  }
  return context;
};

const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

const ThemeToggleButton = () => {
  const { mode, toggleMode } = useThemeMode();
  return (
    <IconButton color="inherit" onClick={toggleMode} aria-label="Toggle theme">
      {mode === 'dark' ? <LightMode /> : <DarkMode />}
    </IconButton>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <Typography>Loading...</Typography>;
  if (!user) return <Navigate to="/admin/login" />;

  return children;
};

const PublicLayout = ({ children }) => {
  const { settings } = useSiteSettings();
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component="a"
            href="/"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          >
            {settings.site_heading}
          </Typography>
          <ThemeToggleButton />
        </Toolbar>
      </AppBar>
      {children}
    </>
  );
};

function App() {
  return (
    <ThemeModeProvider>
      <SiteSettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicLayout><GalleryList /></PublicLayout>} />
            <Route path="/gallery/:slug" element={<PublicLayout><GalleryGrid /></PublicLayout>} />

            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/galleries" element={<ProtectedRoute><AdminLayout><GalleryManager /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/galleries/:id" element={<ProtectedRoute><AdminLayout><GalleryDetails /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><AdminLayout><SiteSettings /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><AdminLayout><UserManager /></AdminLayout></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </SiteSettingsProvider>
    </ThemeModeProvider>
  );
}

export default App;
