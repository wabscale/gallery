import { useState, memo } from 'react';
import { Box, Grid, Button, TextField, MenuItem, Typography, ButtonBase, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  BrandingWatermark, TextFields, Image as ImageIcon, CropFree, GridOn, ControlCamera,
  Opacity, Refresh, CloudUpload, DeleteOutline, Palette
} from '@mui/icons-material';
import { imagesAPI } from '../../../services/api';
import { EmptyState, ListShell } from '../common/DataList';
import { SectionCard, SwitchRow, DebouncedTextField, FieldLabel, OptionTiles, SliderField } from './fields';
import PositionPicker from './PositionPicker';
import WatermarkPreview from './WatermarkPreview';
import { RegenerateWatermarksDialog } from './BatchJobDialog';

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

const TYPE_OPTIONS = [
  { value: 'text', label: 'Text', visual: <TextFields /> },
  { value: 'image', label: 'Image', visual: <ImageIcon /> },
];

const REPEAT_OPTIONS = [
  { value: 'none', label: 'Single', visual: <CropFree /> },
  { value: 'grid', label: 'Repeating grid', visual: <GridOn /> },
];

const COLOR_PRESETS = ['#ffffff', '#000000', '#808080'];

const ColorField = ({ value, onChange }) => (
  <Box>
    <FieldLabel>Color</FieldLabel>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flex: 1, minWidth: 0, p: 0.75, pr: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}>
        <Box sx={{ position: 'relative', width: 32, height: 32, borderRadius: 1, bgcolor: value, border: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Watermark color"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', border: 'none' }} />
        </Box>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', textTransform: 'uppercase' }}>{value}</Typography>
        <Palette fontSize="small" sx={{ ml: 'auto', color: 'text.secondary' }} />
      </Box>
      {COLOR_PRESETS.map((c) => (
        <Tooltip key={c} title={c}>
          <ButtonBase onClick={() => onChange(c)} aria-label={`Use ${c}`}
            sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: c, flexShrink: 0, border: '2px solid', borderColor: (theme) => (value.toLowerCase() === c ? theme.palette.primary.main : alpha(theme.palette.text.secondary, 0.3)) }} />
        </Tooltip>
      ))}
    </Box>
  </Box>
);

const TextControls = ({ gallery, onChange }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <DebouncedTextField fullWidth size="small" label="Watermark Text" value={gallery.watermark_text || ''}
      onChange={(v) => onChange('watermark_text', v)} placeholder={gallery.name} helperText="Empty uses gallery name" />
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 7 }}>
        <TextField select fullWidth size="small" label="Font" value={gallery.watermark_font || 'dejavu_sans'}
          onChange={(e) => onChange('watermark_font', e.target.value)}>
          {FONT_OPTIONS.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 5 }}>
        <TextField fullWidth size="small" type="number" label="Font Size (px)" value={gallery.watermark_font_size || 0}
          onChange={(e) => onChange('watermark_font_size', parseInt(e.target.value) || 0)}
          slotProps={{ htmlInput: { min: 0, max: 500 } }} helperText="0 = auto-scale" />
      </Grid>
    </Grid>
    <ColorField value={gallery.watermark_color || '#ffffff'} onChange={(v) => onChange('watermark_color', v)} />
  </Box>
);

const ImageControls = ({ gallery, onChange, onError }) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await imagesAPI.uploadWatermarkImage(gallery.id, file);
      onChange('watermark_type', 'image');
      onChange('has_watermark_image', true);
    } catch (err) {
      onError(err.response?.data?.error || 'Failed to upload watermark image');
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
    } catch (err) {
      onError(err.response?.data?.error || 'Failed to remove watermark image');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" component="label" startIcon={<CloudUpload />} disabled={uploading}>
          {uploading ? 'Uploading...' : gallery.has_watermark_image ? 'Replace Image' : 'Upload Image'}
          <input type="file" hidden accept=".png,.jpg,.jpeg,.svg" onChange={handleImageUpload} />
        </Button>
        {gallery.has_watermark_image && (
          <Button color="error" startIcon={<DeleteOutline />} onClick={handleImageDelete}>Remove</Button>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        PNG, JPEG, or SVG. Scaled to 25% of image width.
      </Typography>
    </Box>
  );
};

const PlacementCard = ({ gallery, onChange }) => {
  const isGrid = gallery.watermark_repeat === 'grid';
  return (
    <SectionCard icon={<ControlCamera />} title="Placement" subtitle="Where the watermark sits on each photo">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <OptionTiles ariaLabel="Repeat mode" options={REPEAT_OPTIONS} value={gallery.watermark_repeat || 'none'}
          onChange={(v) => onChange('watermark_repeat', v)} />
        {isGrid ? (
          <>
            <SliderField label="Grid spacing" value={gallery.watermark_spacing || 100} format={(v) => `${v}px`}
              onChange={(_, v) => onChange('watermark_spacing', v)} min={10} max={500} step={10} />
            <SliderField label="Grid angle" value={gallery.watermark_grid_angle || 0} format={(v) => `${v}°`}
              onChange={(_, v) => onChange('watermark_grid_angle', v)} min={-90} max={90} step={5} />
          </>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <PositionPicker label="Full image" value={gallery.watermark_position || 'bottom_right'}
                onChange={(v) => onChange('watermark_position', v)} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <PositionPicker label="Thumbnail" value={gallery.watermark_position_thumbnail || 'bottom_right'}
                onChange={(v) => onChange('watermark_position_thumbnail', v)} />
            </Grid>
          </Grid>
        )}
      </Box>
    </SectionCard>
  );
};

const OutputCard = ({ gallery, onChange }) => {
  const [regenOpen, setRegenOpen] = useState(false);
  const images = gallery.images || [];
  return (
    <SectionCard icon={<Opacity />} title="Output" subtitle="Strength and file quality">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SliderField label="Opacity" value={gallery.watermark_opacity} format={(v) => `${v}%`}
          onChange={(_, v) => onChange('watermark_opacity', v)} min={5} max={100} />
        <SliderField label="Output quality" value={gallery.watermark_quality || 95} format={(v) => `${v}%`}
          onChange={(_, v) => onChange('watermark_quality', v)} min={10} max={100} step={5}
          hint="Lower quality reduces file size and discourages downloading" />
        {images.length > 0 && (
          <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" mb={1.5}>
              Photos already watermarked keep the old settings until regenerated.
            </Typography>
            <Button variant="contained" startIcon={<Refresh />} onClick={() => setRegenOpen(true)}>Regenerate watermarks</Button>
          </Box>
        )}
      </Box>
      <RegenerateWatermarksDialog open={regenOpen} onClose={() => setRegenOpen(false)} galleryId={gallery.id} images={images} />
    </SectionCard>
  );
};

const ContentCard = ({ gallery, onChange, onError }) => {
  const wmType = gallery.watermark_type || 'text';
  return (
    <SectionCard icon={<BrandingWatermark />} title="Watermark" subtitle="Protect photos with text or a logo">
      <Box sx={{ mt: -1.5, mb: 2 }}>
        <SwitchRow label="Enabled" description="Applied to photos served to visitors" checked={gallery.watermark_enabled}
          onChange={(v) => onChange('watermark_enabled', v)} />
      </Box>
      <FieldLabel>Type</FieldLabel>
      <OptionTiles ariaLabel="Watermark type" options={TYPE_OPTIONS} value={wmType} onChange={(v) => onChange('watermark_type', v)} />
      <Box sx={{ mt: 2.5 }}>
        {wmType === 'image'
          ? <ImageControls gallery={gallery} onChange={onChange} onError={onError} />
          : <TextControls gallery={gallery} onChange={onChange} />}
      </Box>
    </SectionCard>
  );
};

const WatermarkDisabled = ({ onEnable }) => (
  <ListShell>
    <EmptyState
      icon={<BrandingWatermark />}
      title="Watermarking is off"
      subtitle="Overlay text or a logo on every photo visitors see. Originals are never modified."
      action={<Button variant="contained" startIcon={<BrandingWatermark />} onClick={onEnable}>Enable watermark</Button>}
    />
  </ListShell>
);

// Phones pin the preview below the app bar so it stays visible while the
// controls scroll underneath; desktops pin it beside the controls.
const previewColumnSx = {
  order: { xs: -1, md: 0 },
  position: 'sticky',
  top: { xs: 56, md: 24 },
  zIndex: 2,
  alignSelf: 'flex-start',
};

const WatermarkPanel = memo(({ gallery, active, onChange, onError }) => {
  if (!gallery.watermark_enabled) {
    return <WatermarkDisabled onEnable={() => onChange('watermark_enabled', true)} />;
  }

  return (
    <Grid container spacing={{ xs: 2, sm: 2.5 }}>
      <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 } }}>
        <ContentCard gallery={gallery} onChange={onChange} onError={onError} />
        <PlacementCard gallery={gallery} onChange={onChange} />
        <OutputCard gallery={gallery} onChange={onChange} />
      </Grid>
      <Grid size={{ xs: 12, md: 7 }} sx={previewColumnSx}>
        <WatermarkPreview gallery={gallery} active={active} />
      </Grid>
    </Grid>
  );
});

export default WatermarkPanel;
