import { useState, useEffect, useRef } from 'react';
import { Dialog, IconButton, Box, CircularProgress, Typography } from '@mui/material';
import { Close, ArrowBack, ArrowForward, Download } from '@mui/icons-material';
import { useIsMobile } from '../../hooks/useIsMobile';

const SWIPE_THRESHOLD = 50;

const useSwipe = (onNext, onPrevious) => {
  const startRef = useRef(null);

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e) => {
    if (!startRef.current) return;
    const dx = e.changedTouches[0].clientX - startRef.current.x;
    const dy = e.changedTouches[0].clientY - startRef.current.y;
    startRef.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && onNext) onNext();
    if (dx > 0 && onPrevious) onPrevious();
  };

  return { onTouchStart, onTouchEnd };
};

// Insets keep controls clear of notches and home indicators on phones.
const inset = (side) => `max(8px, env(safe-area-inset-${side}))`;

const ModalControls = ({ image, galleryId, onClose, onNext, onPrevious, allowDownload, isMobile }) => {
  const buttonSx = {
    position: 'absolute',
    color: 'white',
    zIndex: 1,
    ...(isMobile && { bgcolor: 'rgba(0, 0, 0, 0.45)', p: 1.25 }),
  };

  return (
    <>
      <IconButton onClick={onClose} aria-label="Close" sx={{ ...buttonSx, top: inset('top'), right: inset('right') }}>
        <Close />
      </IconButton>

      {onPrevious && (
        <IconButton onClick={onPrevious} aria-label="Previous image" sx={{ ...buttonSx, left: inset('left') }}>
          <ArrowBack />
        </IconButton>
      )}

      {onNext && (
        <IconButton onClick={onNext} aria-label="Next image" sx={{ ...buttonSx, right: inset('right') }}>
          <ArrowForward />
        </IconButton>
      )}

      {allowDownload && (
        <IconButton
          component="a"
          href={`/images/full/${galleryId}/${image.id}`}
          download={image.original_filename}
          aria-label="Download image"
          sx={{ ...buttonSx, bottom: inset('bottom'), right: inset('right') }}
        >
          <Download />
        </IconButton>
      )}

      <Typography
        variant="body2"
        noWrap
        sx={{
          position: 'absolute',
          bottom: inset('bottom'),
          left: inset('left'),
          maxWidth: 'calc(100% - 80px)',
          color: 'white',
          bgcolor: 'rgba(0, 0, 0, 0.6)',
          px: 1.5,
          py: 0.5,
          borderRadius: 1,
          zIndex: 1
        }}
      >
        {image.original_filename}
      </Typography>
    </>
  );
};

const ImageModal = ({ open, onClose, image, galleryId, onNext, onPrevious, allowDownload, thumbnailOnly }) => {
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const swipeHandlers = useSwipe(onNext, onPrevious);

  const imageId = image?.id;
  useEffect(() => {
    setLoading(true);
  }, [imageId]);

  if (!image) return null;

  const imageUrl = thumbnailOnly
    ? `/images/thumbnails/${galleryId}/${image.id}?size=large`
    : `/images/full/${galleryId}/${image.id}`;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && onPrevious) onPrevious();
    if (e.key === 'ArrowRight' && onNext) onNext();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          bgcolor: 'black',
          height: isMobile ? '100dvh' : '90vh'
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <Box
        {...swipeHandlers}
        sx={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <ModalControls
          image={image}
          galleryId={galleryId}
          onClose={onClose}
          onNext={onNext}
          onPrevious={onPrevious}
          allowDownload={allowDownload}
          isMobile={isMobile}
        />

        {loading && (
          <CircularProgress
            sx={{ color: 'rgba(255, 255, 255, 0.7)', position: 'absolute' }}
          />
        )}
        <img
          src={imageUrl}
          alt={image.original_filename}
          onLoad={() => setLoading(false)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}
        />
      </Box>
    </Dialog>
  );
};

export default ImageModal;
