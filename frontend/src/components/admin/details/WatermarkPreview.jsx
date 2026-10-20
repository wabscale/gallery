import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Visibility, AddPhotoAlternate } from '@mui/icons-material';
import { SectionCard } from './fields';

const PREVIEW_DELAY = 500;

const previewUrlFor = (gallery) => {
  const images = gallery.images || [];
  if (images.length === 0) return null;
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
  return `/api/admin/galleries/${gallery.id}/watermark-preview/${images[0].id}?${params}&t=${Date.now()}`;
};

// Rebuilds the server-rendered preview of the first photo whenever a
// watermark setting changes, debounced so slider drags don't flood it.
const useWatermarkPreview = (gallery, active) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewTimeoutRef = useRef(null);

  const buildPreviewUrl = useCallback(() => previewUrlFor(gallery), [gallery]);

  const refreshPreview = useCallback(() => {
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = setTimeout(() => {
      const url = buildPreviewUrl();
      if (url) {
        setPreviewLoading(true);
        setPreviewUrl(url);
      }
    }, PREVIEW_DELAY);
  }, [buildPreviewUrl]);

  useEffect(() => {
    if (active) refreshPreview();
  }, [
    active, gallery.watermark_text, gallery.watermark_opacity,
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

  return { previewUrl, previewLoading, onDone: () => setPreviewLoading(false) };
};

// Checkerboard so light or transparent watermarks stay visible.
const checkerSx = (theme) => {
  const c = alpha(theme.palette.text.secondary, 0.08);
  return {
    backgroundColor: alpha(theme.palette.text.secondary, 0.03),
    backgroundImage: `linear-gradient(45deg, ${c} 25%, transparent 25%), linear-gradient(-45deg, ${c} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${c} 75%), linear-gradient(-45deg, transparent 75%, ${c} 75%)`,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
  };
};

const NoPhotos = () => (
  <Box sx={{ textAlign: 'center', color: 'text.secondary', p: 3 }}>
    <AddPhotoAlternate sx={{ fontSize: 40, mb: 1, opacity: 0.6 }} />
    <Typography variant="body2">Upload a photo to preview the watermark.</Typography>
  </Box>
);

const WatermarkPreview = ({ gallery, active }) => {
  const { previewUrl, previewLoading, onDone } = useWatermarkPreview(gallery, active);
  const hasImages = (gallery.images || []).length > 0;

  return (
    <SectionCard dense icon={<Visibility />} title="Live preview" subtitle={hasImages ? `Rendered on ${gallery.images[0].original_filename}` : 'No photos yet'}>
      <Box sx={{ position: 'relative', borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        {previewLoading && <LinearProgress sx={{ position: 'absolute', inset: '0 0 auto 0', zIndex: 1, height: 3 }} />}
        <Box sx={(theme) => ({ ...checkerSx(theme), minHeight: { xs: 120, md: 260 }, display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
          {!hasImages && <NoPhotos />}
          {hasImages && !previewUrl && <Typography color="text.secondary" variant="body2">Loading preview...</Typography>}
          {previewUrl && (
            <Box
              component="img"
              src={previewUrl}
              alt="Watermark preview"
              onLoad={onDone}
              onError={onDone}
              sx={{
                width: '100%',
                display: 'block',
                maxHeight: { xs: '24vh', md: '70vh' },
                objectFit: 'contain',
                opacity: previewLoading ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}
            />
          )}
        </Box>
      </Box>
    </SectionCard>
  );
};

export default WatermarkPreview;
