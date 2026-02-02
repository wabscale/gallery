import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Container, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControlLabel, Switch, Alert } from '@mui/material';
import { Add } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { galleriesAPI } from '../../services/api';

const GalleryManager = () => {
  const navigate = useNavigate();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGallery, setNewGallery] = useState({ name: '', is_public: true, password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    setLoading(true);
    try {
      const response = await galleriesAPI.listAll();
      setGalleries(response.data);
    } catch (err) {
      setError('Failed to load galleries');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setError('');
    try {
      await galleriesAPI.create(newGallery);
      setCreateDialogOpen(false);
      setNewGallery({ name: '', is_public: true, password: '' });
      loadGalleries();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create gallery');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this gallery?')) return;

    try {
      await galleriesAPI.delete(id);
      loadGalleries();
    } catch (err) {
      setError('Failed to delete gallery');
    }
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'slug', headerName: 'Slug', flex: 1 },
    { field: 'is_public', headerName: 'Public', width: 100, type: 'boolean' },
    { field: 'image_count', headerName: 'Images', width: 100 },
    { field: 'created_at', headerName: 'Created', width: 180, valueFormatter: (params) => new Date(params).toLocaleString() },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Button size="small" onClick={() => navigate(`/admin/galleries/${params.row.id}`)}>
            Edit
          </Button>
          <Button size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            Delete
          </Button>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Gallery Manager</Typography>
        <Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)} sx={{ mr: 1 }}>
            New Gallery
          </Button>
          <Button onClick={() => navigate('/admin')}>Back to Dashboard</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={galleries}
          columns={columns}
          pageSize={25}
          rowsPerPageOptions={[25, 50, 100]}
          loading={loading}
          disableSelectionOnClick
        />
      </div>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Gallery</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Gallery Name"
            value={newGallery.name}
            onChange={(e) => setNewGallery({ ...newGallery, name: e.target.value })}
            margin="normal"
            required
          />

          <FormControlLabel
            control={
              <Switch
                checked={newGallery.is_public}
                onChange={(e) => setNewGallery({ ...newGallery, is_public: e.target.checked })}
              />
            }
            label="Public Gallery"
          />

          <TextField
            fullWidth
            type="password"
            label="Password (optional)"
            value={newGallery.password}
            onChange={(e) => setNewGallery({ ...newGallery, password: e.target.value })}
            margin="normal"
            helperText="Leave empty for no password protection"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newGallery.name}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GalleryManager;
