import { memo } from 'react';
import { Box, ButtonBase, IconButton, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Star, StarBorder, Visibility, VisibilityOff, DeleteOutline } from '@mui/icons-material';

export const thumbUrl = (galleryId, imageId) => `/images/thumbnails/${galleryId}/${imageId}?size=small&raw=true`;

const GLASS = 'rgba(10, 10, 15, 0.62)';

const glassButtonSx = (active, danger, small) => ({
  width: small ? 26 : 30,
  height: small ? 26 : 30,
  color: active ? 'primary.main' : '#fff',
  bgcolor: GLASS,
  backdropFilter: 'blur(6px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  '& svg': { fontSize: small ? 15 : 17 },
  '@media (hover: hover)': {
    '&:hover': { bgcolor: 'rgba(10, 10, 15, 0.85)', color: danger ? 'error.light' : 'primary.main' },
  },
});

const Badge = ({ icon, label, color }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      px: 0.75,
      py: 0.25,
      borderRadius: 5,
      fontSize: '0.68rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: color ? `${color}.main` : '#fff',
      bgcolor: GLASS,
      backdropFilter: 'blur(6px)',
      border: '1px solid',
      borderColor: (theme) => (color ? alpha(theme.palette[color].main, 0.5) : 'rgba(255, 255, 255, 0.2)'),
      '& svg': { fontSize: 12 },
    }}
  >
    {icon}{label}
  </Box>
);

const TileActions = ({ image, isCover, small, onSetCover, onToggleVisibility, onDelete }) => (
  <Box className="tile-actions" sx={{ display: 'flex', gap: small ? 0.25 : 0.5 }}>
    <Tooltip title={isCover ? 'Remove cover' : 'Set as cover'}>
      <IconButton size="small" onClick={() => onSetCover(image.id)} sx={glassButtonSx(isCover, false, small)} aria-label={isCover ? 'Remove cover' : 'Set as cover'}>
        {isCover ? <Star /> : <StarBorder />}
      </IconButton>
    </Tooltip>
    <Tooltip title={image.is_hidden ? 'Show image' : 'Hide image'}>
      <IconButton size="small" onClick={() => onToggleVisibility(image.id, image.is_hidden)} sx={glassButtonSx(false, false, small)} aria-label={image.is_hidden ? 'Show image' : 'Hide image'}>
        {image.is_hidden ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </Tooltip>
    <Tooltip title="Delete image">
      <IconButton size="small" onClick={() => onDelete(image)} sx={glassButtonSx(false, true, small)} aria-label="Delete image">
        <DeleteOutline />
      </IconButton>
    </Tooltip>
  </Box>
);

// Pointer devices reveal actions and the caption on hover; touch devices
// keep them visible since there is no hover to discover them with.
const revealSx = (alwaysShow) => (alwaysShow ? {} : {
  '@media (hover: hover)': {
    '& .tile-actions, & .tile-caption': { opacity: 0, transition: 'opacity 0.2s ease' },
    '&:hover .tile-actions, &:hover .tile-caption, &:focus-within .tile-actions': { opacity: 1 },
  },
});

const tileFrameSx = (isCover, isHidden, alwaysShow) => ({
  position: 'relative',
  borderRadius: 2,
  overflow: 'hidden',
  aspectRatio: '1',
  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
  border: '1px solid',
  borderColor: (theme) => (isCover ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.15)),
  boxShadow: (theme) => (isCover ? `0 0 0 1px ${theme.palette.primary.main}, 0 0 12px ${alpha(theme.palette.primary.main, 0.45)}` : 'none'),
  '& img': {
    filter: isHidden ? 'grayscale(1)' : 'none',
    opacity: isHidden ? 0.4 : 1,
    transition: 'transform 0.5s ease, opacity 0.2s ease, filter 0.2s ease',
  },
  '@media (hover: hover)': { '&:hover img': { transform: 'scale(1.04)' } },
  ...revealSx(alwaysShow),
});

const TileCaption = ({ image }) => (
  <Box
    className="tile-caption"
    sx={{
      position: 'absolute',
      inset: 'auto 0 0 0',
      px: 1.25,
      pb: 1,
      pt: 4,
      pointerEvents: 'none',
      background: 'linear-gradient(to top, rgba(10, 10, 15, 0.85), rgba(10, 10, 15, 0))',
    }}
  >
    <Typography variant="caption" noWrap component="div" sx={{ color: '#fff', fontWeight: 600 }}>
      {image.original_filename}
    </Typography>
    {image.width && (
      <Typography noWrap component="div" sx={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.68rem', fontFamily: 'monospace' }}>
        {image.width} x {image.height}
      </Typography>
    )}
  </Box>
);

const PhotoTile = memo(({ image, galleryId, isCover, compact, alwaysShowActions, onOpen, ...actions }) => (
  <Box sx={tileFrameSx(isCover, image.is_hidden, alwaysShowActions)}>
    <ButtonBase
      onClick={() => onOpen(image)}
      aria-label={`Open ${image.original_filename}`}
      sx={{ position: 'absolute', inset: 0, '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 } }}
    >
      <Box component="img" src={thumbUrl(galleryId, image.id)} alt={image.original_filename} loading="lazy"
        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </ButtonBase>

    <Box sx={{ position: 'absolute', top: 6, left: 6, display: 'flex', flexWrap: 'wrap', gap: 0.5, pointerEvents: 'none' }}>
      {isCover && <Badge icon={<Star />} label="Cover" color="primary" />}
      {image.is_hidden && <Badge icon={<VisibilityOff />} label="Hidden" />}
    </Box>

    {alwaysShowActions ? (
      <Box sx={{ position: 'absolute', bottom: 6, right: 6 }}>
        <TileActions image={image} isCover={isCover} small={compact} {...actions} />
      </Box>
    ) : (
      <>
        <Box sx={{ position: 'absolute', top: 6, right: 6 }}>
          <TileActions image={image} isCover={isCover} small={compact} {...actions} />
        </Box>
        {!compact && <TileCaption image={image} />}
      </>
    )}
  </Box>
));

export default PhotoTile;
