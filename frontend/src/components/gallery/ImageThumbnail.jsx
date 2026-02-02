import { useRef } from 'react';
import { Card, CardMedia, Skeleton } from '@mui/material';
import { useLazyLoad } from '../../hooks/useLazyLoad';

const ImageThumbnail = ({ image, galleryId, onClick }) => {
  const ref = useRef();
  const isVisible = useLazyLoad(ref);

  const thumbnailUrl = `/images/thumbnails/${galleryId}/${image.id}?size=medium`;

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
          height="300"
          image={thumbnailUrl}
          alt={image.original_filename}
          loading="lazy"
          sx={{ objectFit: 'cover' }}
        />
      ) : (
        <Skeleton variant="rectangular" height={300} />
      )}
    </Card>
  );
};

export default ImageThumbnail;
