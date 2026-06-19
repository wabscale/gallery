import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Container, Typography, Paper, Grid, TextField, FormControlLabel,
  Switch, Button, Box, Alert, FormControl, InputLabel,
  Select, MenuItem, IconButton, Chip, Tooltip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress
} from '@mui/material';
import {
  Delete, DeleteForever, Visibility, VisibilityOff, PhotoCamera, Download, Refresh
} from '@mui/icons-material';
import { galleriesAPI, imagesAPI } from '../../services/api';
import ImageUploader from './ImageUploader';
import ImageModal from '../gallery/ImageModal';

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

  const handleDeleteAllImages = async () => {
    try {
      await imagesAPI.deleteAll(id);
      setGallery(prev => ({ ...prev, images: [], image_count: 0, cover_image_id: null }));
      setSuccess('All images deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete images');
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

        {gallery.collect_emails && (
          <Grid size={{ xs: 12 }}>
            <AccessLogs galleryId={gallery.id} />
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Images ({images.length})
              </Typography>
              {images.length > 0 && (
                <Box display="flex" gap={1}>
                  <RegenerateThumbnails galleryId={gallery.id} images={images} />
                  <DeleteAllButton onConfirm={handleDeleteAllImages} count={images.length} />
                </Box>
              )}
            </Box>
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

const CONCURRENT_REGEN = 3;

const formatEta = (seconds) => {
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `${mins}m ${secs}s`;
};

const RegenerateThumbnails = ({ galleryId, images }) => {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });
  const [eta, setEta] = useState(null);
  const startTimeRef = useRef(null);

  const start = async () => {
    const total = images.length;
    setRunning(true);
    setProgress({ done: 0, total, failed: 0 });
    setEta(null);
    startTimeRef.current = Date.now();

    let done = 0;
    let failed = 0;
    let i = 0;

    const processOne = async () => {
      while (true) {
        const idx = i++;
        if (idx >= total) return;
        try {
          await imagesAPI.regenerateThumbnail(galleryId, images[idx].id);
        } catch {
          failed += 1;
        }
        done += 1;
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const rate = done / elapsed;
        const remaining = (total - done) / rate;
        setProgress({ done, total, failed });
        setEta(remaining);
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENT_REGEN, total) }, () => processOne());
    await Promise.all(workers);

    setRunning(false);
    setEta(null);
  };

  const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<Refresh />}
        onClick={() => setOpen(true)}
      >
        Regenerate Thumbnails
      </Button>
      <Dialog open={open} onClose={() => !running && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Regenerate Thumbnails</DialogTitle>
        <DialogContent>
          {!running && progress.done === 0 && (
            <Typography>
              This will regenerate thumbnails for all {images.length} images. Existing thumbnails will be replaced.
            </Typography>
          )}
          {(running || progress.done > 0) && (
            <Box sx={{ mt: 1 }}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  {progress.done} / {progress.total} images processed
                </Typography>
                <Typography variant="body2">
                  {percent}%{running && eta !== null ? ` - ${formatEta(eta)} remaining` : ''}
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={percent} />
              {progress.failed > 0 && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {progress.failed} failed
                </Typography>
              )}
              {!running && progress.done === progress.total && progress.total > 0 && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  Complete
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!running && progress.done === progress.total && progress.total > 0 ? (
            <Button onClick={() => { setOpen(false); setProgress({ done: 0, total: 0, failed: 0 }); }}>
              Close
            </Button>
          ) : (
            <>
              <Button onClick={() => setOpen(false)} disabled={running}>Cancel</Button>
              <Button variant="contained" onClick={start} disabled={running}>
                {running ? 'Processing...' : 'Start'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

const DeleteAllButton = ({ onConfirm, count }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="small"
        color="error"
        variant="outlined"
        startIcon={<DeleteForever />}
        onClick={() => setOpen(true)}
      >
        Delete All
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Delete All Images</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete all {count} images from this gallery? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => { setOpen(false); onConfirm(); }}>
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
    </>
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
        onChange={(e) => onChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
        margin="normal"
        helperText="URL path for this gallery"
      />

      <Grid container spacing={1} sx={{ mt: 1 }}>
        <Grid size={{ xs: 6 }}>
          <FormControlLabel
            control={
              <Switch
                checked={gallery.is_public}
                onChange={(e) => onChange('is_public', e.target.checked)}
                size="small"
              />
            }
            label="Public"
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <FormControlLabel
            control={
              <Switch
                checked={gallery.allow_download}
                onChange={(e) => onChange('allow_download', e.target.checked)}
                size="small"
              />
            }
            label="Downloads"
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <FormControlLabel
            control={
              <Switch
                checked={gallery.thumbnail_only}
                onChange={(e) => onChange('thumbnail_only', e.target.checked)}
                size="small"
              />
            }
            label="Thumbnail Only"
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <FormControlLabel
            control={
              <Switch
                checked={gallery.collect_emails}
                onChange={(e) => onChange('collect_emails', e.target.checked)}
                size="small"
              />
            }
            label="Collect Emails"
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <FormControlLabel
            control={
              <Switch
                checked={gallery.watermark_enabled}
                onChange={(e) => onChange('watermark_enabled', e.target.checked)}
                size="small"
              />
            }
            label="Watermark"
          />
        </Grid>
      </Grid>

      {!gallery.is_public && (
        <TextField
          fullWidth
          type="password"
          label="Gallery Password"
          value={gallery.password || ''}
          onChange={(e) => onChange('password', e.target.value)}
          margin="normal"
          size="small"
          placeholder={gallery.password_hash ? 'Leave empty to keep current' : 'Set a password'}
          helperText={gallery.password_hash ? 'New password to change, empty to keep' : 'Set a password'}
        />
      )}

      <FormControl fullWidth margin="normal" size="small">
        <InputLabel>Image Sort Order</InputLabel>
        <Select
          value={gallery.image_sort || 'name_asc'}
          label="Image Sort Order"
          onChange={(e) => onChange('image_sort', e.target.value)}
        >
          <MenuItem value="name_asc">Name (A to Z)</MenuItem>
          <MenuItem value="name_desc">Name (Z to A)</MenuItem>
          <MenuItem value="modified_asc">Modified Time (oldest first)</MenuItem>
          <MenuItem value="modified_desc">Modified Time (newest first)</MenuItem>
          <MenuItem value="upload_asc">Upload Time (oldest first)</MenuItem>
          <MenuItem value="upload_desc">Upload Time (newest first)</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal" size="small">
        <InputLabel>Thumbnail Aspect Ratio</InputLabel>
        <Select
          value={gallery.thumbnail_aspect_ratio || '4x5'}
          label="Thumbnail Aspect Ratio"
          onChange={(e) => onChange('thumbnail_aspect_ratio', e.target.value)}
        >
          <MenuItem value="1x1">1:1 (Square)</MenuItem>
          <MenuItem value="4x5">4:5 (Portrait)</MenuItem>
          <MenuItem value="5x4">5:4 (Landscape)</MenuItem>
          <MenuItem value="9x16">9:16 (Tall)</MenuItem>
          <MenuItem value="16x9">16:9 (Wide)</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal" size="small">
        <InputLabel>Hover Animation</InputLabel>
        <Select
          value={gallery.hover_animation || 'crossfade'}
          label="Hover Animation"
          onChange={(e) => onChange('hover_animation', e.target.value)}
        >
          <MenuItem value="crossfade">Crossfade</MenuItem>
          <MenuItem value="flip">Flip-through</MenuItem>
          <MenuItem value="glitch">Glitch</MenuItem>
        </Select>
      </FormControl>

      {gallery.watermark_enabled && (
        <>
          <TextField
            fullWidth
            label="Watermark Text"
            value={gallery.watermark_text || ''}
            onChange={(e) => onChange('watermark_text', e.target.value)}
            margin="normal"
            size="small"
            placeholder={gallery.name}
            helperText="Empty uses gallery name"
          />

          <TextField
            fullWidth
            type="number"
            label="Watermark Opacity (%)"
            value={gallery.watermark_opacity}
            onChange={(e) => onChange('watermark_opacity', parseInt(e.target.value))}
            margin="normal"
            size="small"
            inputProps={{ min: 0, max: 100 }}
          />
        </>
      )}

      <TextField
        fullWidth
        type="number"
        label="Thumbnail Quality"
        value={gallery.thumbnail_quality}
        onChange={(e) => onChange('thumbnail_quality', parseInt(e.target.value))}
        margin="normal"
        size="small"
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleImageClick = (image, index) => {
    setSelectedImage(image);
    setSelectedIndex(index);
  };

  const handleNext = () => {
    if (selectedIndex < images.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);
      setSelectedImage(images[newIndex]);
    }
  };

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);
      setSelectedImage(images[newIndex]);
    }
  };

  return (
    <>
      <Grid container spacing={2}>
        {images.map((img, index) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={img.id}>
            <ImageCard
              image={img}
              galleryId={galleryId}
              isCover={coverImageId === img.id}
              onSetCover={onSetCover}
              onToggleVisibility={onToggleVisibility}
              onDelete={onDelete}
              onClick={() => handleImageClick(img, index)}
            />
          </Grid>
        ))}
      </Grid>

      <ImageModal
        open={selectedImage !== null}
        onClose={() => setSelectedImage(null)}
        image={selectedImage}
        galleryId={galleryId}
        onNext={selectedIndex < images.length - 1 ? handleNext : null}
        onPrevious={selectedIndex > 0 ? handlePrevious : null}
        allowDownload={true}
      />
    </>
  );
};

const ImageCard = ({
  image, galleryId, isCover,
  onSetCover, onToggleVisibility, onDelete, onClick
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
        onClick={onClick}
        sx={{
          width: '100%',
          aspectRatio: '1',
          objectFit: 'cover',
          display: 'block',
          cursor: 'pointer',
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

const AccessLogs = ({ galleryId }) => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await galleriesAPI.getAccessLogs(galleryId, page + 1, rowsPerPage);
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [galleryId, page, rowsPerPage]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const formatDate = (iso) => new Date(iso).toLocaleString();

  const formatAction = (action) => {
    switch (action) {
      case 'access': return 'Accessed Gallery';
      case 'view_image': return 'Viewed Image';
      case 'download_gallery': return 'Downloaded Gallery';
      default: return action;
    }
  };

  const exportCsv = async () => {
    let allLogs = [];
    let currentPage = 1;
    let hasMore = true;
    while (hasMore) {
      const response = await galleriesAPI.getAccessLogs(galleryId, currentPage, 200);
      allLogs = allLogs.concat(response.data.logs);
      hasMore = allLogs.length < response.data.total;
      currentPage++;
    }
    const header = 'Email,Action,Image,IP Address,Date';
    const rows = allLogs.map(log =>
      [
        `"${log.email}"`,
        `"${formatAction(log.action)}"`,
        `"${log.image_filename || ''}"`,
        `"${log.ip_address || ''}"`,
        `"${log.created_at}"`
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access-logs-${galleryId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueEmails = new Set(logs.map(l => l.email)).size;

  return (
    <>
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            Visitor Access Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {total} events from {uniqueEmails} visitor{uniqueEmails !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button size="small" startIcon={<Download />} onClick={exportCsv} disabled={total === 0}>
            CSV
          </Button>
          <Button size="small" variant="outlined" onClick={() => setOpen(true)} disabled={total === 0}>
            View
          </Button>
        </Box>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Visitor Access Logs</Typography>
            <Button size="small" startIcon={<Download />} onClick={exportCsv}>
              Export CSV
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loading && logs.length === 0 ? (
            <Typography color="text.secondary">Loading...</Typography>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Image</TableCell>
                      <TableCell>IP</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{log.email}</TableCell>
                        <TableCell>{formatAction(log.action)}</TableCell>
                        <TableCell>{log.image_filename || '-'}</TableCell>
                        <TableCell>{log.ip_address || '-'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50]}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GalleryDetails;
