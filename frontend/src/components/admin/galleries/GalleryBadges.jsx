import { Box, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Lock, AlternateEmail, Download, BrandingWatermark, PhotoLibrary } from '@mui/icons-material';
import { IconBadge } from '../common/DataList';

export const coverUrl = (gallery, size = 'small') => (
  gallery.cover_image_id
    ? `/images/thumbnails/${gallery.id}/${gallery.cover_image_id}?size=${size}&raw=true`
    : null
);

export const VisibilityChip = ({ isPublic, overlay }) => (
  <Chip
    size="small"
    label={isPublic ? 'Public' : 'Private'}
    sx={{
      height: 22,
      fontWeight: 600,
      fontSize: '0.7rem',
      letterSpacing: '0.04em',
      color: isPublic ? 'primary.main' : 'text.secondary',
      bgcolor: (theme) => (overlay
        ? 'rgba(10, 10, 15, 0.7)'
        : alpha(isPublic ? theme.palette.primary.main : theme.palette.text.secondary, 0.1)),
      border: '1px solid',
      borderColor: (theme) => alpha(isPublic ? theme.palette.primary.main : theme.palette.text.secondary, 0.35),
      backdropFilter: overlay ? 'blur(6px)' : 'none',
      '&::before': {
        content: '""',
        width: 6,
        height: 6,
        ml: 1,
        borderRadius: '50%',
        bgcolor: isPublic ? 'primary.main' : 'text.disabled',
        boxShadow: (theme) => (isPublic ? `0 0 6px ${theme.palette.primary.main}` : 'none'),
      },
      '& .MuiChip-label': { pl: 0.75 },
    }}
  />
);

// Feature flags are only shown when enabled so a row stays quiet by default.
export const FeatureBadges = ({ gallery }) => {
  const badges = [
    gallery.has_password && { key: 'pw', icon: <Lock />, title: 'Password protected', color: 'secondary' },
    gallery.collect_emails && { key: 'em', icon: <AlternateEmail />, title: 'Collects visitor emails', color: 'primary' },
    gallery.allow_download && { key: 'dl', icon: <Download />, title: 'Downloads allowed', color: 'primary' },
    gallery.watermark_enabled && { key: 'wm', icon: <BrandingWatermark />, title: 'Watermarked', color: 'primary' },
  ].filter(Boolean);

  if (badges.length === 0) return null;
  return (
    <Box sx={{ display: 'contents' }}>
      {badges.map(({ key, ...b }) => <IconBadge key={key} {...b} />)}
    </Box>
  );
};

export const GalleryCover = ({ gallery, size = 'small', sx }) => {
  const url = coverUrl(gallery, size);
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1.5,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.15),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.disabled',
        ...sx,
      }}
    >
      {url ? (
        <Box
          component="img"
          src={url}
          alt=""
          loading="lazy"
          className="gallery-cover-img"
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }}
        />
      ) : (
        <PhotoLibrary />
      )}
    </Box>
  );
};
