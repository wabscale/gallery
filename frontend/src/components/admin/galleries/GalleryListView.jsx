import { Box, Typography, Tooltip, useMediaQuery } from '@mui/material';
import { ListShell, ListHeader, HeaderCell, ListRow, Cell } from '../common/DataList';
import { formatRelative, formatDate } from '../common/format';
import { GalleryCover, VisibilityChip, FeatureBadges } from './GalleryBadges';
import GalleryActions from './GalleryActions';

// Phones and tablets get a stacked three-column row; desktops get table columns.
const TEMPLATE = {
  xs: '48px minmax(0, 1fr) auto',
  md: '56px minmax(0, 2.2fr) minmax(0, 1.3fr) 72px 120px 116px',
};

const photoLabel = (count) => `${count} ${count === 1 ? 'photo' : 'photos'}`;

const NameCell = ({ gallery }) => (
  <Cell>
    <Typography variant="subtitle2" fontWeight={600} noWrap>{gallery.name}</Typography>
    <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.8rem' }}>
      <Box component="span" sx={{ fontFamily: 'monospace' }}>/{gallery.slug}</Box>
      {/* Phones fold the photo count and date into the slug line */}
      <Box component="span" sx={{ display: { md: 'none' } }}>
        {' \u00b7 '}{photoLabel(gallery.image_count)}{' \u00b7 '}{formatRelative(gallery.created_at)}
      </Box>
    </Typography>
    <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
      <VisibilityChip isPublic={gallery.is_public} />
      <FeatureBadges gallery={gallery} />
    </Box>
  </Cell>
);

const GalleryRow = ({ gallery, compact, onEdit, onCopy, onDelete }) => (
  <ListRow template={TEMPLATE} onClick={() => onEdit(gallery)}>
    <GalleryCover gallery={gallery} sx={{ width: { xs: 48, md: 56 }, height: { xs: 48, md: 56 }, alignSelf: { xs: 'start', md: 'center' } }} />
    <NameCell gallery={gallery} />
    <Cell hideBelow="md">
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <VisibilityChip isPublic={gallery.is_public} />
        <FeatureBadges gallery={gallery} />
      </Box>
    </Cell>
    <Cell hideBelow="md" align="right">
      <Typography variant="body2" fontWeight={600}>{gallery.image_count}</Typography>
    </Cell>
    <Cell hideBelow="md">
      <Tooltip title={formatDate(gallery.created_at)} placement="top-start">
        <Typography variant="body2" color="text.secondary" component="span">
          {formatRelative(gallery.created_at)}
        </Typography>
      </Tooltip>
    </Cell>
    <Cell align="right" sx={{ alignSelf: { xs: 'start', md: 'center' } }}>
      <GalleryActions compact={compact} gallery={gallery} onEdit={onEdit} onCopy={onCopy} onDelete={onDelete} />
    </Cell>
  </ListRow>
);

const GalleryListView = ({ galleries, ...handlers }) => {
  const compact = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  return (
    <ListShell>
      <ListHeader template={TEMPLATE.md}>
        <span />
        <HeaderCell>Gallery</HeaderCell>
        <HeaderCell>Status</HeaderCell>
        <HeaderCell align="right">Photos</HeaderCell>
        <HeaderCell>Created</HeaderCell>
        <HeaderCell align="right">Actions</HeaderCell>
      </ListHeader>
      {galleries.map((gallery) => (
        <GalleryRow key={gallery.id} gallery={gallery} compact={compact} {...handlers} />
      ))}
    </ListShell>
  );
};

export default GalleryListView;
