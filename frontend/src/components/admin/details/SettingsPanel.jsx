import { useState, memo } from 'react';
import { Box, Grid, TextField, MenuItem, InputAdornment, IconButton, Tooltip, Button } from '@mui/material';
import {
  Edit, Groups, Tune, Shield, Download, Build, ContentCopy, Public, AlternateEmail,
  PhotoSizeSelectLarge, Gradient, AutoStories, BlurOn, CleaningServices, Refresh
} from '@mui/icons-material';
import { galleriesAPI } from '../../../services/api';
import AccessLogs from '../AccessLogs';
import CreditsEditor from './CreditsEditor';
import { RegenerateThumbnailsDialog } from './BatchJobDialog';
import { SectionCard, SwitchRow, DebouncedTextField, FieldLabel, OptionTiles, SliderField } from './fields';

const RatioShape = ({ w, h }) => {
  const scale = 26 / Math.max(w, h);
  return <Box sx={{ width: w * scale, height: h * scale, border: '2px solid currentColor', borderRadius: 0.5 }} />;
};

const ASPECT_OPTIONS = [
  { value: '1x1', label: '1:1', visual: <RatioShape w={1} h={1} /> },
  { value: '4x5', label: '4:5', visual: <RatioShape w={4} h={5} /> },
  { value: '5x4', label: '5:4', visual: <RatioShape w={5} h={4} /> },
  { value: '9x16', label: '9:16', visual: <RatioShape w={9} h={16} /> },
  { value: '16x9', label: '16:9', visual: <RatioShape w={16} h={9} /> },
];

const HOVER_OPTIONS = [
  { value: 'crossfade', label: 'Crossfade', visual: <Gradient /> },
  { value: 'flip', label: 'Flip-through', visual: <AutoStories /> },
  { value: 'glitch', label: 'Glitch', visual: <BlurOn /> },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'modified_asc', label: 'Modified (old)' },
  { value: 'modified_desc', label: 'Modified (new)' },
  { value: 'upload_asc', label: 'Uploaded (old)' },
  { value: 'upload_desc', label: 'Uploaded (new)' },
];

const GeneralCard = ({ gallery, onChange, onCopyLink }) => (
  <SectionCard icon={<Edit />} title="General" subtitle="Name, caption and public URL">
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DebouncedTextField fullWidth label="Gallery Name" value={gallery.name} onChange={(v) => onChange('name', v)} />
      <DebouncedTextField
        fullWidth
        label="Description"
        value={gallery.description || ''}
        onChange={(v) => onChange('description', v)}
        multiline
        minRows={2}
        maxRows={5}
        placeholder="Caption displayed below the gallery title"
      />
      <DebouncedTextField
        fullWidth
        label="Slug"
        value={gallery.slug}
        onChange={(v) => onChange('slug', v.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
        helperText="URL path for this gallery"
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start" sx={{ '& p': { fontFamily: 'monospace', fontSize: '0.85rem' } }}>/gallery/</InputAdornment>,
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Copy gallery link">
                  <IconButton size="small" onClick={onCopyLink} aria-label="Copy gallery link"><ContentCopy fontSize="small" /></IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          },
          htmlInput: { style: { fontFamily: 'monospace' } },
        }}
      />
    </Box>
  </SectionCard>
);

const DisplayCard = ({ gallery, onChange }) => (
  <SectionCard icon={<Tune />} title="Display" subtitle="How photos appear on the public page">
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <FieldLabel>Thumbnail aspect ratio</FieldLabel>
        <OptionTiles ariaLabel="Aspect ratio" options={ASPECT_OPTIONS} value={gallery.thumbnail_aspect_ratio || '4x5'} onChange={(v) => onChange('thumbnail_aspect_ratio', v)} />
      </Box>
      <Box>
        <FieldLabel>Hover effect</FieldLabel>
        <OptionTiles ariaLabel="Hover effect" options={HOVER_OPTIONS} value={gallery.hover_animation || 'crossfade'} onChange={(v) => onChange('hover_animation', v)} />
      </Box>
      <Grid container spacing={{ xs: 3, sm: 2 }} alignItems="flex-start">
        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldLabel>Sort order</FieldLabel>
          <TextField select fullWidth size="small" value={gallery.image_sort || 'name_asc'} onChange={(e) => onChange('image_sort', e.target.value)}
            slotProps={{ htmlInput: { 'aria-label': 'Sort order' } }}>
            {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SliderField label="Thumbnail quality" value={gallery.thumbnail_quality ?? 85} min={1} max={100}
            onChange={(_, v) => onChange('thumbnail_quality', v)} />
        </Grid>
      </Grid>
    </Box>
  </SectionCard>
);

const AccessCard = ({ gallery, onChange }) => (
  <SectionCard icon={<Shield />} title="Privacy & access" subtitle="Who can see this gallery" flush>
    <SwitchRow icon={<Public />} label="Public" description="Listed on the home page and viewable by anyone"
      checked={gallery.is_public} onChange={(v) => onChange('is_public', v)} />
    {!gallery.is_public && (
      <Box sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <DebouncedTextField
          fullWidth
          size="small"
          type="password"
          label="Gallery Password"
          value={gallery.password || ''}
          onChange={(v) => onChange('password', v)}
          placeholder={gallery.password_hash ? 'Leave empty to keep current' : 'Set a password'}
        />
      </Box>
    )}
    <SwitchRow icon={<AlternateEmail />} label="Collect emails" description="Ask visitors for an email before viewing"
      checked={gallery.collect_emails} onChange={(v) => onChange('collect_emails', v)} />
    {gallery.collect_emails && (
      <Box sx={{ pb: 2 }}>
        <AccessLogs galleryId={gallery.id} />
      </Box>
    )}
  </SectionCard>
);

const DeliveryCard = ({ gallery, onChange }) => (
  <SectionCard icon={<Download />} title="Delivery" subtitle="What visitors can take with them" flush>
    <SwitchRow icon={<Download />} label="Allow download" description="Visitors can download photos"
      checked={gallery.allow_download} onChange={(v) => onChange('allow_download', v)} />
    <SwitchRow icon={<PhotoSizeSelectLarge />} label="Thumbnail only" description="Visitors never get full resolution files"
      checked={gallery.thumbnail_only} onChange={(v) => onChange('thumbnail_only', v)} />
  </SectionCard>
);

const ClearCacheButton = ({ galleryId, type, label, onError, onToast }) => {
  const [loading, setLoading] = useState(false);

  const handleClear = async () => {
    setLoading(true);
    try {
      await galleriesAPI.clearCache(galleryId, type);
      onToast(`${label} cleared`);
    } catch {
      onError(`Failed to clear ${label.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outlined" startIcon={<CleaningServices />} onClick={handleClear} disabled={loading} fullWidth sx={{ justifyContent: 'flex-start' }}>
      {loading ? 'Clearing...' : `Clear ${label.toLowerCase()}`}
    </Button>
  );
};

const MaintenanceCard = ({ gallery, onError, onToast }) => {
  const [regenOpen, setRegenOpen] = useState(false);
  const images = gallery.images || [];
  return (
    <SectionCard icon={<Build />} title="Maintenance" subtitle="Rebuild cached files after changing settings">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <ClearCacheButton galleryId={gallery.id} type="thumbnails" label="Thumbnail cache" onError={onError} onToast={onToast} />
        <ClearCacheButton galleryId={gallery.id} type="watermarks" label="Watermark cache" onError={onError} onToast={onToast} />
        {images.length > 0 && (
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => setRegenOpen(true)} fullWidth sx={{ justifyContent: 'flex-start' }}>
            Regenerate thumbnails
          </Button>
        )}
      </Box>
      <RegenerateThumbnailsDialog open={regenOpen} onClose={() => setRegenOpen(false)} galleryId={gallery.id} images={images} />
    </SectionCard>
  );
};

const SettingsPanel = memo(({ gallery, onChange, onCopyLink, onError, onToast }) => (
  <Grid container spacing={{ xs: 2, sm: 2.5 }}>
    <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 } }}>
      <GeneralCard gallery={gallery} onChange={onChange} onCopyLink={onCopyLink} />
      <SectionCard icon={<Groups />} title="Credits" subtitle="People who worked on this gallery">
        <CreditsEditor credits={gallery.credits || []} onChange={(v) => onChange('credits', v)} />
      </SectionCard>
      <DisplayCard gallery={gallery} onChange={onChange} />
    </Grid>
    <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 } }}>
      <AccessCard gallery={gallery} onChange={onChange} />
      <DeliveryCard gallery={gallery} onChange={onChange} />
      <MaintenanceCard gallery={gallery} onError={onError} onToast={onToast} />
    </Grid>
  </Grid>
));

export default SettingsPanel;
