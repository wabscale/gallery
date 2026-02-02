import { useState, useEffect } from 'react';
import { Dialog, IconButton, Box, CircularProgress } from '@mui/material';
import { Close, ArrowBack, ArrowForward, Download } from '@mui/icons-material';

const ImageModal = ({ open, onClose, image, galleryId, onNext, onPrevious, allowDownload }) => {
  const [loading, setLoading] = useState(true);

  const imageId = image?.id;
  useEffect(() => {
    setLoading(true);
  }, [imageId]);

  if (!image) return null;

  const fullImageUrl = `/images/full/${galleryId}/${image.id}`;

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
      PaperProps={{
        sx: {
          bgcolor: 'black',
          height: '90vh'
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <Box sx={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8, color: 'white', zIndex: 1 }}
        >
          <Close />
        </IconButton>

        {onPrevious && (
          <IconButton
            onClick={onPrevious}
            sx={{ position: 'absolute', left: 8, color: 'white', zIndex: 1 }}
          >
            <ArrowBack />
          </IconButton>
        )}

        {onNext && (
          <IconButton
            onClick={onNext}
            sx={{ position: 'absolute', right: 8, color: 'white', zIndex: 1 }}
          >
            <ArrowForward />
          </IconButton>
        )}

        {allowDownload && (
          <IconButton
            component="a"
            href={fullImageUrl}
            download={image.original_filename}
            sx={{ position: 'absolute', bottom: 8, right: 8, color: 'white', zIndex: 1 }}
          >
            <Download />
          </IconButton>
        )}

        {loading && (
          <CircularProgress
            sx={{ color: 'rgba(255, 255, 255, 0.7)', position: 'absolute' }}
          />
        )}
        <img
          src={fullImageUrl}
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
