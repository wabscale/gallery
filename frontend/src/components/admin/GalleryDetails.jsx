import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useParams } from 'react-router';
import {
  Container, Typography, Paper, Grid, TextField, FormControlLabel,
  Switch, Button, Box, Alert, FormControl, InputLabel, Slider, Divider,
  Select, MenuItem, IconButton, Chip, Tooltip, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress
} from '@mui/material';
import {
  Delete, DeleteForever, Visibility, VisibilityOff, PhotoCamera, Refresh, Settings, ContentCopy,
  Add, Close
} from '@mui/icons-material';
import { galleriesAPI, imagesAPI } from '../../services/api';
import ImageUploader from './ImageUploader';
import ImageModal from '../gallery/ImageModal';
import AccessLogs from './AccessLogs';
import { useIsMobile } from '../../hooks/useIsMobile';

const DebouncedTextField = memo(({ value: externalValue, onChange, ...props }) => {
  const [localValue, setLocalValue] = useState(externalValue);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setLocalValue(externalValue);
  }, [externalValue]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onChange(val), 300);
  };

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return <TextField value={localValue} onChange={handleChange} {...props} />;
});

const PAPER_SX = { p: { xs: 2, sm: 3 } };

const GalleryDetails = () => {
  const { id } = useParams();
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

  const saveTimeoutRef = useRef(null);
  const pendingChangesRef = useRef({});

  const saveChanges = useCallback(async (changes) => {
    setError('');
    try {
      await galleriesAPI.update(id, changes);
      setSuccess('Saved');
      if ('image_sort' in changes) {
        await refreshGallery();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    }
  }, [id, refreshGallery]);

  const handleChange = useCallback((field, value) => {
    setGallery(prev => ({ ...prev, [field]: value }));
    pendingChangesRef.current = { ...pendingChangesRef.current, [field]: value };

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const changes = pendingChangesRef.current;
      pendingChangesRef.current = {};
      saveChanges(changes);
    }, 800);
  }, [saveChanges]);

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/gallery/${gallery.slug}`;
    await navigator.clipboard.writeText(url);
    setSuccess('Link copied');
  }, [gallery]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleSetCover = async (imageId) => {
    const newCoverId = gallery.cover_image_id === imageId ? null : imageId;
    try {
      await galleriesAPI.update(id, { cover_image_id: newCoverId });
      setGallery(prev => ({ ...prev, cover_image_id: newCoverId }));
      setSuccess(newCoverId ? 'Cover image set' : 'Cover image removed');
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
    } catch (err) {
      setError('Failed to delete images');
    }
  };


  if (loading) return <Typography>Loading...</Typography>;
  if (!gallery) return <Typography>Gallery not found</Typography>;

  const images = gallery.images || [];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2.5, sm: 4 } }}>
      <Typography variant="h4" mb={{ xs: 2.5, sm: 4 }} sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
        Edit Gallery
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Snackbar
        open={!!success}
        autoHideDuration={2000}
        onClose={() => setSuccess('')}
        message={success}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={PAPER_SX}>
            <Typography variant="h6" gutterBottom>Gallery Settings</Typography>
            <GallerySettingsForm
              gallery={gallery}
              onChange={handleChange}
              onCopyLink={handleCopyLink}
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={PAPER_SX}>
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
          <Paper sx={PAPER_SX}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
              <Typography variant="h6">
                Images ({images.length})
              </Typography>
              {images.length > 0 && (
                <Box display="flex" gap={1} flexWrap="wrap">
                  <RegenerateThumbnails galleryId={gallery.id} images={images} />
                  {gallery.watermark_enabled && (
                    <RegenerateWatermarks galleryId={gallery.id} images={images} />
                  )}
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
  const [useParallel, setUseParallel] = useState(true);
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

    const workerCount = useParallel ? Math.min(CONCURRENT_REGEN, total) : 1;
    const workers = Array.from({ length: workerCount }, () => processOne());
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
            <>
              <Typography>
                This will regenerate thumbnails for all {images.length} images. Existing thumbnails will be replaced.
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={useParallel}
                    onChange={(e) => setUseParallel(e.target.checked)}
                  />
                }
                label="Use parallel processing"
                sx={{ mt: 2 }}
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, ml: 4 }}>
                Disable for dense images (40MP+) to reduce memory usage
              </Typography>
            </>
          )}
          {running && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
              Do not reload or navigate away from this page while processing.
            </Typography>
          )}
          {(running || progress.done > 0) && (
            <Box sx={{ mt: 1 }}>
              <Box display="flex" justifyContent="space-between" flexWrap="wrap" columnGap={2} mb={1}>
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

const ClearCacheButton = ({ galleryId, type, label }) => {
  const [loading, setLoading] = useState(false);

  const handleClear = async () => {
    setLoading(true);
    try {
      await galleriesAPI.clearCache(galleryId, type);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="small" variant="outlined" onClick={handleClear} disabled={loading} fullWidth>
      {loading ? 'Clearing...' : label}
    </Button>
  );
};

const SectionLabel = ({ children }) => (
  <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 2.5, mb: 0.5 }}>
    {children}
  </Typography>
);

const ROLE_SUGGESTIONS = [
  'Photographer', 'Director', 'Model', 'Stylist', 'Makeup Artist', 'Hair Stylist',
  'Videographer', 'Creative Director', 'Assistant', 'Editor', 'Retoucher', 'Producer'
];

const CreditsEditor = ({ credits, onChange }) => {
  // Debounced fields fire after a delay, so read the latest list from a ref
  // rather than the render-time closure to avoid dropping a sibling edit.
  const creditsRef = useRef(credits);
  creditsRef.current = credits;

  const commit = (next) => {
    creditsRef.current = next;
    onChange(next);
  };

  const updateCredit = (index, field, value) => {
    commit(creditsRef.current.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addCredit = () => {
    const role = creditsRef.current.length === 0 ? 'Photographer' : '';
    commit([...creditsRef.current, { role, instagram: '' }]);
  };

  const removeCredit = (index) => {
    commit(creditsRef.current.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ mt: 1 }}>
      <datalist id="credit-role-suggestions">
        {ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}
      </datalist>
      {credits.map((credit, index) => (
        <Box key={index} display="flex" gap={1} alignItems="center">
          <DebouncedTextField
            label="Role"
            value={credit.role || ''}
            onChange={(v) => updateCredit(index, 'role', v)}
            margin="dense"
            size="small"
            placeholder="Photographer"
            slotProps={{ htmlInput: { list: 'credit-role-suggestions' } }}
            sx={{ flex: 1 }}
          />
          <DebouncedTextField
            label="Instagram"
            value={credit.instagram || ''}
            onChange={(v) => updateCredit(index, 'instagram', v)}
            margin="dense"
            size="small"
            placeholder="username (without @)"
            sx={{ flex: 1 }}
          />
          <IconButton size="small" onClick={() => removeCredit(index)} aria-label="Remove credit">
            <Close fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<Add />} onClick={addCredit}>
        Add credit
      </Button>
    </Box>
  );
};

const GallerySettingsForm = memo(({ gallery, onChange, onCopyLink }) => {
  const [watermarkOpen, setWatermarkOpen] = useState(false);

  return (
    <>
      {/* Identity */}
      <DebouncedTextField
        fullWidth
        label="Gallery Name"
        value={gallery.name}
        onChange={(v) => onChange('name', v)}
        margin="dense"
        size="small"
      />
      <DebouncedTextField
        fullWidth
        label="Description"
        value={gallery.description || ''}
        onChange={(v) => onChange('description', v)}
        margin="dense"
        size="small"
        multiline
        minRows={2}
        maxRows={5}
        placeholder="Caption displayed below the gallery title"
      />
      <CreditsEditor credits={gallery.credits || []} onChange={(v) => onChange('credits', v)} />
      <DebouncedTextField
        fullWidth
        label="Slug"
        value={gallery.slug}
        onChange={(v) => onChange('slug', v.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
        margin="dense"
        size="small"
        helperText="URL path for this gallery"
      />
      <Button
        size="small"
        startIcon={<ContentCopy />}
        onClick={onCopyLink}
        sx={{ mt: 0.5 }}
      >
        Copy gallery link
      </Button>

      {/* Access & Privacy */}
      <SectionLabel>Access</SectionLabel>
      <Grid container spacing={0}>
        <Grid size={{ xs: 6 }}>
          <FormControlLabel
            control={<Switch checked={gallery.is_public} onChange={(e) => onChange('is_public', e.target.checked)} size="small" />}
            label="Public"
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <FormControlLabel
            control={<Switch checked={gallery.collect_emails} onChange={(e) => onChange('collect_emails', e.target.checked)} size="small" />}
            label="Collect Emails"
          />
        </Grid>
      </Grid>
      {!gallery.is_public && (
        <DebouncedTextField
          fullWidth
          type="password"
          label="Gallery Password"
          value={gallery.password || ''}
          onChange={(v) => onChange('password', v)}
          margin="dense"
          size="small"
          placeholder={gallery.password_hash ? 'Leave empty to keep current' : 'Set a password'}
        />
      )}

      {/* Display */}
      <SectionLabel>Display</SectionLabel>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Aspect Ratio</InputLabel>
            <Select
              value={gallery.thumbnail_aspect_ratio || '4x5'}
              label="Aspect Ratio"
              onChange={(e) => onChange('thumbnail_aspect_ratio', e.target.value)}
            >
              <MenuItem value="1x1">1:1 Square</MenuItem>
              <MenuItem value="4x5">4:5 Portrait</MenuItem>
              <MenuItem value="5x4">5:4 Landscape</MenuItem>
              <MenuItem value="9x16">9:16 Tall</MenuItem>
              <MenuItem value="16x9">16:9 Wide</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Hover Effect</InputLabel>
            <Select
              value={gallery.hover_animation || 'crossfade'}
              label="Hover Effect"
              onChange={(e) => onChange('hover_animation', e.target.value)}
            >
              <MenuItem value="crossfade">Crossfade</MenuItem>
              <MenuItem value="flip">Flip-through</MenuItem>
              <MenuItem value="glitch">Glitch</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small" sx={{ mt: { xs: 0, sm: 1 } }}>
            <InputLabel>Sort Order</InputLabel>
            <Select
              value={gallery.image_sort || 'name_asc'}
              label="Sort Order"
              onChange={(e) => onChange('image_sort', e.target.value)}
            >
              <MenuItem value="name_asc">Name (A-Z)</MenuItem>
              <MenuItem value="name_desc">Name (Z-A)</MenuItem>
              <MenuItem value="modified_asc">Modified (old)</MenuItem>
              <MenuItem value="modified_desc">Modified (new)</MenuItem>
              <MenuItem value="upload_asc">Uploaded (old)</MenuItem>
              <MenuItem value="upload_desc">Uploaded (new)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="Thumbnail Quality"
            value={gallery.thumbnail_quality}
            onChange={(e) => onChange('thumbnail_quality', parseInt(e.target.value))}
            size="small"
            sx={{ mt: { xs: 0, sm: 1 } }}
            inputProps={{ min: 1, max: 100 }}
          />
        </Grid>
      </Grid>

      {/* Delivery */}
      <SectionLabel>Delivery</SectionLabel>
      <Grid container spacing={0}>
        <Grid size={{ xs: 6 }}>
          <FormControlLabel
            control={<Switch checked={gallery.allow_download} onChange={(e) => onChange('allow_download', e.target.checked)} size="small" />}
            label="Allow Download"
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <FormControlLabel
            control={<Switch checked={gallery.thumbnail_only} onChange={(e) => onChange('thumbnail_only', e.target.checked)} size="small" />}
            label="Thumbnail Only"
          />
        </Grid>
      </Grid>

      {/* Cache */}
      <SectionLabel>Cache</SectionLabel>
      <Box display="flex" flexDirection="column" gap={1}>
        <ClearCacheButton galleryId={gallery.id} type="thumbnails" label="Clear Thumbnails" />
        <ClearCacheButton galleryId={gallery.id} type="watermarks" label="Clear Watermarks" />
      </Box>

      {/* Watermark */}
      <Divider sx={{ mt: 2.5, mb: 1.5 }} />
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <FormControlLabel
          control={<Switch checked={gallery.watermark_enabled} onChange={(e) => onChange('watermark_enabled', e.target.checked)} size="small" />}
          label="Watermark"
        />
        {gallery.watermark_enabled && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setWatermarkOpen(true)}
          >
            Watermark Settings
          </Button>
        )}
      </Box>

      <WatermarkDialog
        open={watermarkOpen}
        onClose={() => setWatermarkOpen(false)}
        gallery={gallery}
        onChange={onChange}
        images={gallery.images || []}
      />
    </>
  );
});

const POSITION_OPTIONS = [
  { value: 'bottom_right', label: 'Bottom Right' },
  { value: 'bottom_left', label: 'Bottom Left' },
  { value: 'top_right', label: 'Top Right' },
  { value: 'top_left', label: 'Top Left' },
  { value: 'center', label: 'Center' },
  { value: 'diagonal_lr', label: 'Diagonal (top-left to bottom-right)' },
  { value: 'diagonal_rl', label: 'Diagonal (top-right to bottom-left)' },
];

const FONT_OPTIONS = [
  { value: 'dejavu_sans', label: 'DejaVu Sans' },
  { value: 'times', label: 'Times New Roman' },
  { value: 'arial', label: 'Arial' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'futura', label: 'Futura' },
  { value: 'open_sans', label: 'Open Sans' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'lato', label: 'Lato' },
];

// On phones the preview is pinned to the top of the full-screen dialog so
// changes stay visible while scrolling through the controls below it.
const WatermarkPreview = ({ previewUrl, previewLoading, onDone }) => (
  <Grid
    size={{ xs: 12, md: 7 }}
    sx={{
      order: { xs: -1, md: 0 },
      position: { xs: 'sticky', md: 'static' },
      top: 0,
      zIndex: 2,
      bgcolor: 'background.paper',
      pt: { xs: 2, md: 0 },
      pb: { xs: 1, md: 0 },
    }}
  >
    <Typography variant="body2" color="text.secondary" gutterBottom>
      Preview
    </Typography>
    <Box sx={{
      border: '1px solid', borderColor: 'divider', borderRadius: 1,
      overflow: 'hidden', bgcolor: 'grey.100', minHeight: { xs: 120, md: 200 },
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {previewLoading && !previewUrl && (
        <Typography color="text.secondary">Loading...</Typography>
      )}
      {previewUrl && (
        <Box
          component="img"
          src={previewUrl}
          alt="Watermark preview"
          onLoad={onDone}
          onError={onDone}
          sx={{
            width: '100%', display: 'block',
            maxHeight: { xs: '32vh', md: 'none' },
            objectFit: 'contain',
            opacity: previewLoading ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}
        />
      )}
    </Box>
  </Grid>
);

const WatermarkDialog = memo(({ open, onClose, gallery, onChange, images }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const previewTimeoutRef = useRef(null);
  const isMobile = useIsMobile();

  const wmType = gallery.watermark_type || 'text';

  const buildPreviewUrl = useCallback(() => {
    const images = gallery.images || [];
    if (images.length === 0) return null;
    const imageId = images[0].id;
    const params = new URLSearchParams({
      text: gallery.watermark_text || gallery.name,
      opacity: gallery.watermark_opacity,
      position: gallery.watermark_position || 'bottom_right',
      color: gallery.watermark_color || '#ffffff',
      font: gallery.watermark_font || 'dejavu_sans',
      font_size: gallery.watermark_font_size || 0,
      type: gallery.watermark_type || 'text',
      repeat: gallery.watermark_repeat || 'none',
      spacing: gallery.watermark_spacing || 100,
      grid_angle: gallery.watermark_grid_angle || 0,
      quality: gallery.watermark_quality || 95,
    });
    return `/api/admin/galleries/${gallery.id}/watermark-preview/${imageId}?${params}&t=${Date.now()}`;
  }, [gallery]);

  const refreshPreview = useCallback(() => {
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = setTimeout(() => {
      const url = buildPreviewUrl();
      if (url) {
        setPreviewLoading(true);
        setPreviewUrl(url);
      }
    }, 500);
  }, [buildPreviewUrl]);

  useEffect(() => {
    if (open) refreshPreview();
  }, [
    open, gallery.watermark_text, gallery.watermark_opacity,
    gallery.watermark_position, gallery.watermark_color,
    gallery.watermark_font, gallery.watermark_font_size,
    gallery.watermark_type, gallery.has_watermark_image,
    gallery.watermark_repeat, gallery.watermark_spacing,
    gallery.watermark_grid_angle, gallery.watermark_quality,
    refreshPreview
  ]);

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await imagesAPI.uploadWatermarkImage(gallery.id, file);
      onChange('watermark_type', 'image');
      onChange('has_watermark_image', true);
    } catch {
      // error handled by parent
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleImageDelete = async () => {
    try {
      await imagesAPI.deleteWatermarkImage(gallery.id);
      onChange('watermark_type', 'text');
      onChange('has_watermark_image', false);
    } catch {
      // error handled by parent
    }
  };

  const hasImages = (gallery.images || []).length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle>Watermark Settings</DialogTitle>
      <DialogContent dividers sx={{ pt: { xs: hasImages ? 0 : 2, md: 2 } }}>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid size={{ xs: 12, md: hasImages ? 5 : 12 }}>
            {/* Type selector */}
            <FormControl fullWidth margin="dense" size="small">
              <InputLabel>Watermark Type</InputLabel>
              <Select
                value={wmType}
                label="Watermark Type"
                onChange={(e) => onChange('watermark_type', e.target.value)}
              >
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="image">Image</MenuItem>
              </Select>
            </FormControl>

            {wmType === 'image' && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <Box display="flex" gap={1} alignItems="center">
                  <Button
                    size="small"
                    variant="outlined"
                    component="label"
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : gallery.has_watermark_image ? 'Replace Image' : 'Upload Image'}
                    <input
                      type="file"
                      hidden
                      accept=".png,.jpg,.jpeg,.svg"
                      onChange={handleImageUpload}
                    />
                  </Button>
                  {gallery.has_watermark_image && (
                    <Button size="small" color="error" onClick={handleImageDelete}>
                      Remove
                    </Button>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  PNG, JPEG, or SVG. Scaled to 25% of image width.
                </Typography>
              </Box>
            )}

            {wmType === 'text' && (
              <>
                <DebouncedTextField
                  fullWidth
                  label="Watermark Text"
                  value={gallery.watermark_text || ''}
                  onChange={(v) => onChange('watermark_text', v)}
                  margin="dense"
                  size="small"
                  placeholder={gallery.name}
                  helperText="Empty uses gallery name"
                />

                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel>Font</InputLabel>
                  <Select
                    value={gallery.watermark_font || 'dejavu_sans'}
                    label="Font"
                    onChange={(e) => onChange('watermark_font', e.target.value)}
                  >
                    {FONT_OPTIONS.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  type="number"
                  label="Font Size (px)"
                  value={gallery.watermark_font_size || 0}
                  onChange={(e) => onChange('watermark_font_size', parseInt(e.target.value) || 0)}
                  margin="dense"
                  size="small"
                  inputProps={{ min: 0, max: 500 }}
                  helperText="0 = auto-scale based on image width"
                />

                <Box sx={{ mt: 2, mb: 1 }}>
                  <Typography variant="body2" gutterBottom>Color</Typography>
                  <input
                    type="color"
                    value={gallery.watermark_color || '#ffffff'}
                    onChange={(e) => onChange('watermark_color', e.target.value)}
                    style={{ width: '100%', height: 36, border: 'none', cursor: 'pointer' }}
                  />
                </Box>
              </>
            )}

            {/* Shared settings */}
            <FormControl fullWidth margin="dense" size="small" sx={{ mt: 1 }}>
              <InputLabel>Repeat Mode</InputLabel>
              <Select
                value={gallery.watermark_repeat || 'none'}
                label="Repeat Mode"
                onChange={(e) => onChange('watermark_repeat', e.target.value)}
              >
                <MenuItem value="none">Single (use position)</MenuItem>
                <MenuItem value="grid">Repeating Grid</MenuItem>
              </Select>
            </FormControl>

            {(gallery.watermark_repeat === 'grid') && (
              <>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    Grid Spacing: {gallery.watermark_spacing || 100}px
                  </Typography>
                  <Slider
                    value={gallery.watermark_spacing || 100}
                    onChange={(_, v) => onChange('watermark_spacing', v)}
                    min={10}
                    max={500}
                    step={10}
                    size="small"
                  />
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    Grid Angle: {gallery.watermark_grid_angle || 0}°
                  </Typography>
                  <Slider
                    value={gallery.watermark_grid_angle || 0}
                    onChange={(_, v) => onChange('watermark_grid_angle', v)}
                    min={-90}
                    max={90}
                    step={5}
                    size="small"
                  />
                </Box>
              </>
            )}

            {(gallery.watermark_repeat !== 'grid') && (
              <>
                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel>Full Image Position</InputLabel>
                  <Select
                    value={gallery.watermark_position || 'bottom_right'}
                    label="Full Image Position"
                    onChange={(e) => onChange('watermark_position', e.target.value)}
                  >
                    {POSITION_OPTIONS.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel>Thumbnail Position</InputLabel>
                  <Select
                    value={gallery.watermark_position_thumbnail || 'bottom_right'}
                    label="Thumbnail Position"
                    onChange={(e) => onChange('watermark_position_thumbnail', e.target.value)}
                  >
                    {POSITION_OPTIONS.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Opacity: {gallery.watermark_opacity}%
              </Typography>
              <Slider
                value={gallery.watermark_opacity}
                onChange={(_, v) => onChange('watermark_opacity', v)}
                min={5}
                max={100}
                size="small"
              />
            </Box>

            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" gutterBottom>
                Output Quality: {gallery.watermark_quality || 95}%
              </Typography>
              <Slider
                value={gallery.watermark_quality || 95}
                onChange={(_, v) => onChange('watermark_quality', v)}
                min={10}
                max={100}
                step={5}
                size="small"
              />
              <Typography variant="caption" color="text.secondary">
                Lower quality reduces file size and discourages downloading
              </Typography>
            </Box>
          </Grid>

          {hasImages && (
            <WatermarkPreview
              previewUrl={previewUrl}
              previewLoading={previewLoading}
              onDone={() => setPreviewLoading(false)}
            />
          )}
        </Grid>
        {images.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <RegenerateWatermarks galleryId={gallery.id} images={images} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
});

const RegenerateWatermarks = ({ galleryId, images }) => {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });
  const [eta, setEta] = useState(null);
  const [useParallel, setUseParallel] = useState(true);
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
          await imagesAPI.regenerateWatermark(galleryId, images[idx].id);
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

    const workerCount = useParallel ? Math.min(CONCURRENT_REGEN, total) : 1;
    const workers = Array.from({ length: workerCount }, () => processOne());
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
        Regenerate Watermarks
      </Button>
      <Dialog open={open} onClose={() => !running && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Regenerate Watermarks</DialogTitle>
        <DialogContent>
          {!running && progress.done === 0 && (
            <>
              <Typography>
                This will regenerate watermarked versions for all {images.length} images using current settings. Existing watermarked files will be replaced.
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={useParallel}
                    onChange={(e) => setUseParallel(e.target.checked)}
                  />
                }
                label="Use parallel processing"
                sx={{ mt: 2 }}
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, ml: 4 }}>
                Disable for dense images (40MP+) to reduce memory usage
              </Typography>
            </>
          )}
          {running && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
              Do not reload or navigate away from this page while processing.
            </Typography>
          )}
          {(running || progress.done > 0) && (
            <Box sx={{ mt: 1 }}>
              <Box display="flex" justifyContent="space-between" flexWrap="wrap" columnGap={2} mb={1}>
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
      <Grid container spacing={{ xs: 1, sm: 2 }}>
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
  const thumbUrl = `/images/thumbnails/${galleryId}/${image.id}?size=small&raw=true`;

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

export default GalleryDetails;
