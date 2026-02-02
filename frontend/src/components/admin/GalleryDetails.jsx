import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Container, Typography, Paper, Grid, TextField, FormControlLabel, Switch, Button, Box, Alert, Divider } from '@mui/material';
import { galleriesAPI } from '../../services/api';
import ImageUploader from './ImageUploader';

const GalleryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadGallery();
  }, [id]);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const response = await galleriesAPI.get(id);
      setGallery(response.data);
    } catch (err) {
      setError('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setError('');
    setSuccess('');

    try {
      await galleriesAPI.update(id, gallery);
      setSuccess('Gallery updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update gallery');
    }
  };

  const handleChange = (field, value) => {
    setGallery(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (!gallery) return <Typography>Gallery not found</Typography>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Edit Gallery</Typography>
        <Button onClick={() => navigate('/admin/galleries')}>
          Back to Galleries
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Gallery Settings</Typography>

            <TextField
              fullWidth
              label="Gallery Name"
              value={gallery.name}
              onChange={(e) => handleChange('name', e.target.value)}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Slug"
              value={gallery.slug}
              margin="normal"
              disabled
              helperText="Auto-generated from name"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={gallery.is_public}
                  onChange={(e) => handleChange('is_public', e.target.checked)}
                />
              }
              label="Public Gallery"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={gallery.allow_download}
                  onChange={(e) => handleChange('allow_download', e.target.checked)}
                />
              }
              label="Allow Downloads"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={gallery.thumbnail_only}
                  onChange={(e) => handleChange('thumbnail_only', e.target.checked)}
                />
              }
              label="Thumbnail Only Mode"
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>Watermark Settings</Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={gallery.watermark_enabled}
                  onChange={(e) => handleChange('watermark_enabled', e.target.checked)}
                />
              }
              label="Enable Watermark"
            />

            <TextField
              fullWidth
              type="number"
              label="Watermark Opacity (%)"
              value={gallery.watermark_opacity}
              onChange={(e) => handleChange('watermark_opacity', parseInt(e.target.value))}
              margin="normal"
              inputProps={{ min: 0, max: 100 }}
            />

            <TextField
              fullWidth
              type="number"
              label="Thumbnail Quality"
              value={gallery.thumbnail_quality}
              onChange={(e) => handleChange('thumbnail_quality', parseInt(e.target.value))}
              margin="normal"
              inputProps={{ min: 1, max: 100 }}
            />

            <Button variant="contained" onClick={handleUpdate} sx={{ mt: 2 }} fullWidth>
              Save Changes
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Images ({gallery.image_count} total)
            </Typography>
            <ImageUploader galleryId={id} onUploadComplete={loadGallery} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default GalleryDetails;
