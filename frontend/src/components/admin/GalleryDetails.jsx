import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Container, Typography, Paper, Grid, TextField, FormControlLabel,
  Switch, Button, Box, Alert, Divider, FormControl, InputLabel,
  Select, MenuItem, IconButton, Chip, Tooltip
} from '@mui/material';
import {
  Delete, Visibility, VisibilityOff, PhotoCamera
} from '@mui/icons-material';
import { galleriesAPI, imagesAPI } from '../../services/api';
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

  const refreshGallery = useCallback(async () => {
    try {
      const response = await galleriesAPI.get(id);
      setGallery(response.data);
    } catch (err) {
      setError('Failed to refresh gallery');
    }
  }, [id]);

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

  const handleSetCover = async (imageId) => {
    const newCoverId = gallery.cover_image_id === imageId ? null : imageId;
    try {
      await galleriesAPI.update(id, { cover_image_id: newCoverId });
      setGallery(prev => ({ ...prev, cover_image_id: newCoverId }));
      setSuccess(newCoverId ? 'Cover image set' : 'Cover image removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update cover image');
    }
  };

  const handleToggleVisibility = async (imageId, currentlyHidden) => {
    try {
      await imagesAPI.updateVisibility(imageId, !currentlyHidden);
      setGallery(prev => ({
        ...prev,
        images: prev.images.map(img =>
          img.id === imageId ? { ...img, is_hidden: !currentlyHidden } : img
        )
      }));
    } catch (err) {
      setError('Failed to update image visibility');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Delete this image permanently?')) return;
    try {
      await imagesAPI.delete(imageId);
      setGallery(prev => ({
        ...prev,
        images: prev.images.filter(img => img.id !== imageId),
        image_count: prev.image_count - 1,
        cover_image_id: prev.cover_image_id === imageId ? null : prev.cover_image_id
      }));
    } catch (err) {
      setError('Failed to delete image');
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (!gallery) return <Typography>Gallery not found</Typography>;

  const images = gallery.images || [];

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
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Gallery Settings</Typography>
            <GallerySettingsForm
              gallery={gallery}
              onChange={handleChange}
              onSave={handleUpdate}
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Images ({images.length} total)
            </Typography>
            <ImageUploader galleryId={id} onUploadComplete={refreshGallery} />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Images ({images.length})
            </Typography>
            {images.length === 0 ? (
              <Typography color="text.secondary">
                No images uploaded yet.
              </Typography>
            ) : (
              <ImageManager
                images={images}
                galleryId={gallery.id}
                coverImageId={gallery.cover_image_id}
                onSetCover={handleSetCover}
                onToggleVisibility={handleToggleVisibility}
                onDelete={handleDeleteImage}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

const GallerySettingsForm = ({ gallery, onChange, onSave }) => {
  return (
    <>
      <TextField
        fullWidth
        label="Gallery Name"
        value={gallery.name}
        onChange={(e) => onChange('name', e.target.value)}
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
            onChange={(e) => onChange('is_public', e.target.checked)}
          />
        }
        label="Public Gallery"
      />

      <FormControlLabel
        control={
          <Switch
            checked={gallery.allow_download}
            onChange={(e) => onChange('allow_download', e.target.checked)}
          />
        }
        label="Allow Downloads"
      />

      <FormControlLabel
        control={
          <Switch
            checked={gallery.thumbnail_only}
            onChange={(e) => onChange('thumbnail_only', e.target.checked)}
          />
        }
        label="Thumbnail Only Mode"
      />

      <FormControl fullWidth margin="normal">
        <InputLabel>Hover Animation Style</InputLabel>
        <Select
          value={gallery.hover_animation || 'crossfade'}
          label="Hover Animation Style"
          onChange={(e) => onChange('hover_animation', e.target.value)}
        >
          <MenuItem value="crossfade">Crossfade</MenuItem>
          <MenuItem value="flip">Flip-through</MenuItem>
          <MenuItem value="glitch">Glitch</MenuItem>
        </Select>
      </FormControl>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>Watermark Settings</Typography>

      <FormControlLabel
        control={
          <Switch
            checked={gallery.watermark_enabled}
            onChange={(e) => onChange('watermark_enabled', e.target.checked)}
          />
        }
        label="Enable Watermark"
      />

      <TextField
        fullWidth
        label="Watermark Text"
        value={gallery.watermark_text || ''}
        onChange={(e) => onChange('watermark_text', e.target.value)}
        margin="normal"
        placeholder={gallery.name}
        helperText="Leave empty to use gallery name"
      />

      <TextField
        fullWidth
        type="number"
        label="Watermark Opacity (%)"
        value={gallery.watermark_opacity}
        onChange={(e) => onChange('watermark_opacity', parseInt(e.target.value))}
        margin="normal"
        inputProps={{ min: 0, max: 100 }}
      />

      <TextField
        fullWidth
        type="number"
        label="Thumbnail Quality"
        value={gallery.thumbnail_quality}
        onChange={(e) => onChange('thumbnail_quality', parseInt(e.target.value))}
        margin="normal"
        inputProps={{ min: 1, max: 100 }}
      />

      <Button variant="contained" onClick={onSave} sx={{ mt: 2 }} fullWidth>
        Save Changes
      </Button>
    </>
  );
};

const ImageManager = ({
  images, galleryId, coverImageId,
  onSetCover, onToggleVisibility, onDelete
}) => {
  return (
    <Grid container spacing={2}>
      {images.map(img => (
        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={img.id}>
          <ImageCard
            image={img}
            galleryId={galleryId}
            isCover={coverImageId === img.id}
            onSetCover={onSetCover}
            onToggleVisibility={onToggleVisibility}
            onDelete={onDelete}
          />
        </Grid>
      ))}
    </Grid>
  );
};

const ImageCard = ({
  image, galleryId, isCover,
  onSetCover, onToggleVisibility, onDelete
}) => {
  const thumbUrl = `/images/thumbnails/${galleryId}/${image.id}?size=small`;

  return (
    <Box sx={{
      position: 'relative',
      borderRadius: 1,
      overflow: 'hidden',
      border: isCover ? '2px solid' : '1px solid',
      borderColor: isCover ? 'primary.main' : 'divider',
      opacity: image.is_hidden ? 0.5 : 1,
      transition: 'opacity 0.2s',
    }}>
      <Box
        component="img"
        src={thumbUrl}
        alt={image.original_filename}
        sx={{
          width: '100%',
          aspectRatio: '1',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {isCover && (
        <Chip
          label="Cover"
          size="small"
          color="primary"
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
          }}
        />
      )}

      {image.is_hidden && (
        <Chip
          label="Hidden"
          size="small"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: 'rgba(0,0,0,0.6)',
            color: '#fff',
          }}
        />
      )}

      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: 0.5,
        p: 0.5,
        bgcolor: 'background.paper',
      }}>
        <Tooltip title={isCover ? 'Remove cover' : 'Set as cover'}>
          <IconButton
            size="small"
            onClick={() => onSetCover(image.id)}
            color={isCover ? 'primary' : 'default'}
          >
            <PhotoCamera fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={image.is_hidden ? 'Show image' : 'Hide image'}>
          <IconButton
            size="small"
            onClick={() => onToggleVisibility(image.id, image.is_hidden)}
          >
            {image.is_hidden
              ? <VisibilityOff fontSize="small" />
              : <Visibility fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Delete image">
          <IconButton
            size="small"
            onClick={() => onDelete(image.id)}
            color="error"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography
        variant="caption"
        noWrap
        sx={{
          display: 'block',
          px: 0.5,
          pb: 0.5,
          color: 'text.secondary',
        }}
      >
        {image.original_filename}
      </Typography>
    </Box>
  );
};

export default GalleryDetails;
