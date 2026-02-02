import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Container, Typography, Grid, Paper, Box, Button } from '@mui/material';
import { Add, PhotoLibrary, Image as ImageIcon, Storage } from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await adminAPI.getMetrics();
      setMetrics(response.data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Admin Dashboard</Typography>
        <Box>
          <Button variant="contained" onClick={() => navigate('/admin/galleries')} sx={{ mr: 1 }}>
            Manage Galleries
          </Button>
          <Button onClick={handleLogout}>Logout</Button>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>Welcome, {user?.username}</Typography>

      {metrics && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
              <PhotoLibrary sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4">{metrics.total_galleries}</Typography>
                <Typography color="text.secondary">Total Galleries</Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
              <ImageIcon sx={{ fontSize: 40, mr: 2, color: 'secondary.main' }} />
              <Box>
                <Typography variant="h4">{metrics.total_images}</Typography>
                <Typography color="text.secondary">Total Images</Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
              <Storage sx={{ fontSize: 40, mr: 2, color: 'success.main' }} />
              <Box>
                <Typography variant="h4">{formatBytes(metrics.total_storage)}</Typography>
                <Typography color="text.secondary">Storage Used</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>Recent Uploads</Typography>
        {metrics?.recent_uploads.map((upload) => (
          <Box key={upload.id} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
            <Typography variant="body1">{upload.filename}</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(upload.uploaded_at).toLocaleString()}
            </Typography>
          </Box>
        ))}
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
