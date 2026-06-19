import { useRef } from 'react';
import { Card, CardMedia, Skeleton } from '@mui/material';
import { useLazyLoad } from '../../hooks/useLazyLoad';

const ASPECT_RATIOS = {
  '1x1': '1 / 1',
  '4x5': '4 / 5',
  '5x4': '5 / 4',
  '9x16': '9 / 16',
  '16x9': '16 / 9',
};

const ImageThumbnail = ({ image, galleryId, onClick, aspectRatio = '4x5' }) => {
  const ref = useRef();
  const isVisible = useLazyLoad(ref);

  const thumbnailUrl = `/images/thumbnails/${galleryId}/${image.id}?size=medium`;
  const cssAspectRatio = ASPECT_RATIOS[aspectRatio] || '4 / 5';

  return (
    <Card
      ref={ref}
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: 3
        }
      }}
    >
      {isVisible ? (
        <CardMedia
          component="img"
          image={thumbnailUrl}
          alt={image.original_filename}
          loading="lazy"
          sx={{ aspectRatio: cssAspectRatio, objectFit: 'cover' }}
        />
      ) : (
        <Skeleton variant="rectangular" sx={{ aspectRatio: cssAspectRatio }} />
      )}
    </Card>
  );
};

export default ImageThumbnail;
