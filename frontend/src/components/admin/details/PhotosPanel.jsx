import { useState, useEffect, useMemo } from 'react';
import { Box, Button } from '@mui/material';
import { PhotoLibrary, SearchOff } from '@mui/icons-material';
import ImageModal from '../../gallery/ImageModal';
import ImageUploader from '../ImageUploader';
import { ListShell, EmptyState } from '../common/DataList';
import { useIsTouch } from '../../../hooks/useIsMobile';
import PhotoTile from './PhotoTile';
import PhotoToolbar from './PhotoToolbar';
import { DeleteImageDialog, DeleteAllDialog } from './ConfirmDialogs';
import { RegenerateThumbnailsDialog, RegenerateWatermarksDialog } from './BatchJobDialog';

const DENSITY_KEY = 'adminPhotoDensity';

const GRID_COLUMNS = {
  comfortable: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(auto-fill, minmax(180px, 1fr))' },
  compact: { xs: 'repeat(3, minmax(0, 1fr))', sm: 'repeat(auto-fill, minmax(120px, 1fr))' },
};

const FILTERS = {
  all: () => true,
  visible: (img) => !img.is_hidden,
  hidden: (img) => img.is_hidden,
};

const useVisiblePhotos = (images, search, filter) => useMemo(() => {
  const query = search.trim().toLowerCase();
  return images
    .filter(FILTERS[filter])
    .filter((img) => !query || img.original_filename.toLowerCase().includes(query));
}, [images, search, filter]);

// Steps through the currently visible photos in the lightbox.
const usePhotoViewer = (photos) => {
  const [index, setIndex] = useState(null);
  const open = index !== null && index < photos.length;
  return {
    image: open ? photos[index] : null,
    open: (image) => setIndex(photos.indexOf(image)),
    close: () => setIndex(null),
    next: open && index < photos.length - 1 ? () => setIndex(index + 1) : null,
    previous: open && index > 0 ? () => setIndex(index - 1) : null,
  };
};

const PhotoResults = ({ images, visible, onClearFilters, tileProps }) => {
  if (images.length === 0) {
    return (
      <ListShell>
        <EmptyState icon={<PhotoLibrary />} title="No photos yet" subtitle="Upload images above to start building this gallery." />
      </ListShell>
    );
  }
  if (visible.length === 0) {
    return (
      <ListShell>
        <EmptyState
          icon={<SearchOff />}
          title="No matching photos"
          subtitle="Try a different search or filter."
          action={<Button variant="outlined" onClick={onClearFilters}>Clear filters</Button>}
        />
      </ListShell>
    );
  }
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS[tileProps.density], gap: { xs: 1, sm: 1.5 } }}>
      {visible.map((img) => (
        <PhotoTile key={img.id} image={img} isCover={tileProps.coverImageId === img.id} compact={tileProps.density === 'compact'} {...tileProps.handlers} />
      ))}
    </Box>
  );
};

const PanelDialogs = ({ gallery, images, dialog, onCloseDialog, deleteTarget, onCloseDelete, onDeleteImage, onDeleteAll }) => (
  <>
    <DeleteImageDialog image={deleteTarget} galleryId={gallery.id} onClose={onCloseDelete} onConfirm={onDeleteImage} />
    <DeleteAllDialog open={dialog === 'deleteAll'} count={images.length} onClose={onCloseDialog} onConfirm={onDeleteAll} />
    <RegenerateThumbnailsDialog open={dialog === 'thumbnails'} onClose={onCloseDialog} galleryId={gallery.id} images={images} />
    <RegenerateWatermarksDialog open={dialog === 'watermarks'} onClose={onCloseDialog} galleryId={gallery.id} images={images} />
  </>
);

const PhotosPanel = ({ gallery, onUploadComplete, onSetCover, onToggleVisibility, onDeleteImage, onDeleteAll }) => {
  const images = gallery.images || [];
  const isTouch = useIsTouch();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [density, setDensity] = useState(() => localStorage.getItem(DENSITY_KEY) || 'comfortable');
  const [dialog, setDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => localStorage.setItem(DENSITY_KEY, density), [density]);

  const visible = useVisiblePhotos(images, search, filter);
  const viewer = usePhotoViewer(visible);
  const hiddenCount = images.filter((img) => img.is_hidden).length;
  const counts = { all: images.length, visible: images.length - hiddenCount, hidden: hiddenCount };

  const handlers = {
    galleryId: gallery.id,
    alwaysShowActions: isTouch,
    onOpen: viewer.open,
    onSetCover,
    onToggleVisibility,
    onDelete: setDeleteTarget,
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 } }}>
      <ImageUploader galleryId={gallery.id} onUploadComplete={onUploadComplete} />

      {images.length > 0 && (
        <PhotoToolbar
          search={search} onSearch={setSearch}
          filter={filter} onFilter={setFilter} counts={counts}
          density={density} onDensity={setDensity}
          watermarkEnabled={gallery.watermark_enabled}
          onAction={setDialog}
        />
      )}

      <PhotoResults
        images={images}
        visible={visible}
        onClearFilters={() => { setSearch(''); setFilter('all'); }}
        tileProps={{ density, coverImageId: gallery.cover_image_id, handlers }}
      />

      <ImageModal
        open={viewer.image !== null}
        onClose={viewer.close}
        image={viewer.image}
        galleryId={gallery.id}
        onNext={viewer.next}
        onPrevious={viewer.previous}
        allowDownload={true}
      />
      <PanelDialogs
        gallery={gallery} images={images} dialog={dialog} onCloseDialog={() => setDialog(null)}
        deleteTarget={deleteTarget} onCloseDelete={() => setDeleteTarget(null)}
        onDeleteImage={onDeleteImage} onDeleteAll={onDeleteAll}
      />
    </Box>
  );
};

export default PhotosPanel;
