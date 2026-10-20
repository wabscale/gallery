import { useNavigate } from 'react-router';
import { Box, Typography, Button, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ArrowBack, ContentCopy, OpenInNew, CloudDone, CloudOff } from '@mui/icons-material';
import { ListShell } from '../common/DataList';
import { formatDate } from '../common/format';
import { GalleryCover, VisibilityChip, FeatureBadges, coverUrl } from '../galleries/GalleryBadges';

const SAVE_STATES = {
  saved: { label: 'All changes saved', short: 'Saved', color: 'success', icon: <CloudDone /> },
  pending: { label: 'Saving...', short: 'Saving', color: 'primary' },
  saving: { label: 'Saving...', short: 'Saving', color: 'primary' },
  error: { label: 'Save failed', short: 'Failed', color: 'error', icon: <CloudOff /> },
};

export const SaveStatus = ({ state }) => {
  const { label, short, color, icon } = SAVE_STATES[state];
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        height: 28,
        px: 1.25,
        borderRadius: 5,
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        color: `${color}.main`,
        bgcolor: (theme) => alpha(theme.palette[color].main, 0.1),
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette[color].main, 0.3),
        '& svg': { fontSize: 15 },
      }}
    >
      {icon || <CircularProgress size={12} color="inherit" thickness={5} />}
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{label}</Box>
      <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{short}</Box>
    </Box>
  );
};

// Blurred cover art behind the header gives each gallery its own tint.
const HeroBackdrop = ({ gallery }) => {
  const url = coverUrl(gallery, 'small');
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: (theme) => `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.06)} 60%, transparent)`,
        '&::before': url ? {
          content: '""',
          position: 'absolute',
          inset: -40,
          backgroundImage: `url(${url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(40px) saturate(1.4)',
          opacity: 0.22,
        } : {},
      }}
    />
  );
};

const photoMeta = (gallery) => {
  const images = gallery.images || [];
  const hidden = images.filter((img) => img.is_hidden).length;
  return [
    `${images.length} ${images.length === 1 ? 'photo' : 'photos'}`,
    hidden > 0 && `${hidden} hidden`,
    `created ${formatDate(gallery.created_at)}`,
  ].filter(Boolean).join(' · ');
};

const HeaderActions = ({ gallery, onCopyLink }) => (
  <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
    <Tooltip title="Copy gallery link">
      <IconButton onClick={onCopyLink} aria-label="Copy gallery link" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, width: 40, height: 40 }}>
        <ContentCopy fontSize="small" />
      </IconButton>
    </Tooltip>
    <Button variant="contained" startIcon={<OpenInNew />} href={`/gallery/${gallery.slug}`} target="_blank" rel="noopener noreferrer" sx={{ height: 40 }}>
      View
    </Button>
  </Box>
);

const DetailsHeader = ({ gallery, saveState, onCopyLink }) => {
  const navigate = useNavigate();
  return (
    <Box sx={{ mb: { xs: 2, sm: 2.5 } }}>
      <Button size="small" startIcon={<ArrowBack />} onClick={() => navigate('/admin/galleries')} sx={{ mb: 1.5, ml: -0.5, color: 'text.secondary' }}>
        Galleries
      </Button>
      <ListShell sx={{ position: 'relative' }}>
        <HeroBackdrop gallery={gallery} />
        <Box sx={{ position: 'relative', display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'center', gap: { xs: 2, sm: 2.5 }, p: { xs: 2, sm: 3 } }}>
          <GalleryCover gallery={gallery} sx={{ width: { xs: 64, sm: 88 }, height: { xs: 64, sm: 88 }, flexShrink: 0, borderRadius: 2, '& > svg': { fontSize: 32 } }} />
          <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
            <Typography variant="h4" noWrap sx={{ fontSize: { xs: '1.4rem', sm: '2rem' }, fontWeight: 600, lineHeight: 1.2 }}>
              {gallery.name || 'Untitled gallery'}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
              <Box component="span" sx={{ fontFamily: 'monospace' }}>/{gallery.slug}</Box>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{' · '}{photoMeta(gallery)}</Box>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mt: 1.25 }}>
              <VisibilityChip isPublic={gallery.is_public} />
              <FeatureBadges gallery={gallery} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flex: { xs: '1 1 100%', md: '0 0 auto' } }}>
            <SaveStatus state={saveState} />
            <HeaderActions gallery={gallery} onCopyLink={onCopyLink} />
          </Box>
        </Box>
      </ListShell>
    </Box>
  );
};

export default DetailsHeader;
