import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { darkTheme, lightTheme } from './theme';
import GalleryList from './components/gallery/GalleryList';
import GalleryGrid from './components/gallery/GalleryGrid';
import Login from './components/admin/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import GalleryManager from './components/admin/GalleryManager';
import GalleryDetails from './components/admin/GalleryDetails';

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
            Photo Gallery
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
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicLayout><GalleryList /></PublicLayout>} />
            <Route path="/gallery/:slug" element={<PublicLayout><GalleryGrid /></PublicLayout>} />

            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/galleries" element={<ProtectedRoute><GalleryManager /></ProtectedRoute>} />
            <Route path="/admin/galleries/:id" element={<ProtectedRoute><GalleryDetails /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeModeProvider>
  );
}

export default App;
