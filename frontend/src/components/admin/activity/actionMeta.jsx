import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Login, Visibility, CloudDownload, BrokenImage } from '@mui/icons-material';
import { thumbUrl } from '../details/PhotoTile';

export const ACTIONS = {
  access: { label: 'Opened gallery', short: 'Opened', icon: <Login />, color: 'primary', tone: 0.45 },
  view_image: { label: 'Viewed image', short: 'Views', icon: <Visibility />, color: 'primary', tone: 1 },
  download_gallery: { label: 'Downloaded gallery', short: 'Downloads', icon: <CloudDownload />, color: 'secondary', tone: 1 },
};

export const actionInfo = (action) => ACTIONS[action] || { label: action, short: action, icon: <Visibility />, color: 'primary', tone: 0.6 };

// Solid swatch color for an action, used by charts and timeline markers.
export const actionColor = (theme, action) => {
  const { color, tone } = actionInfo(action);
  return alpha(theme.palette[color].main, tone);
};

export const ActionPill = ({ action, label }) => {
  const info = actionInfo(action);
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.625,
        px: 1,
        py: 0.25,
        borderRadius: 5,
        fontSize: '0.72rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        color: `${info.color}.main`,
        bgcolor: (theme) => alpha(theme.palette[info.color].main, 0.1),
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette[info.color].main, 0.3),
        '& svg': { fontSize: 13 },
      }}
    >
      {info.icon}{label || info.label}
    </Box>
  );
};

// Photo thumbnail that degrades to an icon when the image has been deleted.
export const PhotoThumb = ({ galleryId, imageId, size = 40, radius = 1, sx }) => (
  <Box
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: radius,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'text.disabled',
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
      border: '1px solid',
      borderColor: (theme) => alpha(theme.palette.primary.main, 0.18),
      ...sx,
    }}
  >
    {imageId ? (
      <Box component="img" src={thumbUrl(galleryId, imageId)} alt="" loading="lazy"
        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    ) : (
      <BrokenImage sx={{ fontSize: size * 0.45 }} />
    )}
  </Box>
);
