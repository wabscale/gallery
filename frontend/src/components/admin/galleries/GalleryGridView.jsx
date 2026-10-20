import { Box, Card, Grid, Typography } from '@mui/material';
import { formatRelative } from '../common/format';
import { GalleryCover, VisibilityChip, FeatureBadges } from './GalleryBadges';
import GalleryActions from './GalleryActions';

const GalleryTile = ({ gallery, onEdit, onCopy, onDelete }) => (
  <Card
    onClick={() => onEdit(gallery)}
    sx={{
      cursor: 'pointer',
      borderRadius: 2,
      '@media (hover: hover)': { '&:hover .gallery-cover-img': { transform: 'scale(1.05)' } },
    }}
  >
    <Box sx={{ position: 'relative' }}>
      <GalleryCover gallery={gallery} size="medium" sx={{ aspectRatio: { xs: '16 / 9', sm: '4 / 3' }, borderRadius: 0, border: 'none', '& > svg': { fontSize: 48 } }} />
      <Box sx={{ position: 'absolute', top: 10, left: 10 }}>
        <VisibilityChip isPublic={gallery.is_public} overlay />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 0.5,
          p: 0.5,
          borderRadius: 1.5,
          bgcolor: 'rgba(10, 10, 15, 0.7)',
          backdropFilter: 'blur(6px)',
          '&:empty': { display: 'none' },
        }}
      >
        <FeatureBadges gallery={gallery} />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          inset: 'auto 0 0 0',
          px: 2,
          pt: 5,
          pb: 1.5,
          background: 'linear-gradient(to top, rgba(10, 10, 15, 0.92), rgba(10, 10, 15, 0))',
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ color: '#fff' }}>{gallery.name}</Typography>
        <Typography variant="caption" noWrap sx={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'monospace', display: 'block' }}>
          /{gallery.slug}
        </Typography>
      </Box>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 2, py: 1 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {gallery.image_count} {gallery.image_count === 1 ? 'photo' : 'photos'}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap component="div">
          {formatRelative(gallery.created_at)}
        </Typography>
      </Box>
      <GalleryActions gallery={gallery} onEdit={onEdit} onCopy={onCopy} onDelete={onDelete} />
    </Box>
  </Card>
);

const GalleryGridView = ({ galleries, ...handlers }) => (
  <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
    {galleries.map((gallery) => (
      <Grid key={gallery.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
        <GalleryTile gallery={gallery} {...handlers} />
      </Grid>
    ))}
  </Grid>
);

export default GalleryGridView;
