import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider, createTheme, CssBaseline, Container, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { AuthProvider, useAuth } from './hooks/useAuth';
import GalleryList from './components/gallery/GalleryList';
import GalleryGrid from './components/gallery/GalleryGrid';
import Login from './components/admin/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import GalleryManager from './components/admin/GalleryManager';
import GalleryDetails from './components/admin/GalleryDetails';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

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
          <Typography variant="h6" component="a" href="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
            Photo Gallery
          </Typography>
          <Button color="inherit" href="/admin">Admin</Button>
        </Toolbar>
      </AppBar>
      {children}
    </>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
    </ThemeProvider>
  );
}

export default App;
