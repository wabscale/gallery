import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardActionArea, CardContent, Typography, Box } from '@mui/material';
import { PhotoLibrary } from '@mui/icons-material';
import { galleriesAPI } from '../../services/api';

const ANIMATION_CONFIG = {
  crossfade: { interval: 2000 },
  flip: { interval: 400 },
  glitch: { interval: 1500 },
};

const getImageUrl = (galleryId, imageId) => {
  return `/images/thumbnails/${galleryId}/${imageId}?size=medium`;
};

const GalleryCard = ({ gallery }) => {
  const [images, setImages] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const intervalRef = useRef(null);
  const fetchedRef = useRef(false);

  const animationType = gallery.hover_animation || 'crossfade';
  const coverUrl = gallery.cover_image_id
    ? getImageUrl(gallery.id, gallery.cover_image_id)
    : null;

  const fetchImages = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    const response = await galleriesAPI.getBySlug(gallery.slug);
    const imgs = response.data.images;
    if (imgs?.length > 0) {
      setImages(imgs);
    }
  }, [gallery.slug]);

  useEffect(() => {
    if (!hovered || !images || images.length < 2) {
      clearInterval(intervalRef.current);
      return;
    }

    const config = ANIMATION_CONFIG[animationType];
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        if (animationType === 'glitch') {
          setGlitchActive(true);
          setTimeout(() => setGlitchActive(false), 200);
        }
        return (prev + 1) % images.length;
      });
    }, config.interval);

    return () => clearInterval(intervalRef.current);
  }, [hovered, images, animationType]);

  const handleMouseEnter = () => {
    setHovered(true);
    fetchImages();
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setCurrentIndex(0);
    setGlitchActive(false);
  };

  const showAnimations = hovered && images && images.length > 0;

  return (
    <Card onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <CardActionArea href={`/gallery/${gallery.slug}`}>
        <Box sx={{ height: 200, position: 'relative', overflow: 'hidden', bgcolor: 'grey.900' }}>
          {showAnimations ? (
            <AnimatedImageStack
              images={images}
              galleryId={gallery.id}
              currentIndex={currentIndex}
              animationType={animationType}
              glitchActive={glitchActive}
              hovered={hovered}
            />
          ) : coverUrl ? (
            <Box
              component="img"
              src={coverUrl}
              alt={gallery.name}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <Box sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <PhotoLibrary sx={{ fontSize: 64, color: 'grey.600' }} />
            </Box>
          )}
        </Box>
        <CardContent>
          <Typography variant="h6" component="h2">
            {gallery.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {gallery.image_count} images
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Created {new Date(gallery.created_at).toLocaleDateString()}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const AnimatedImageStack = ({
  images, galleryId, currentIndex, animationType,
  glitchActive, hovered,
}) => {
  if (animationType === 'crossfade') {
    return (
      <>
        {images.map((img, i) => (
          <Box
            key={img.id}
            component="img"
            src={getImageUrl(galleryId, img.id)}
            alt=""
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: i === currentIndex ? 1 : 0,
              transition: 'opacity 0.8s ease, transform 6s ease',
              transform: i === currentIndex && hovered
                ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        ))}
      </>
    );
  }

  if (animationType === 'flip') {
    const img = images[currentIndex];
    return (
      <Box
        key={currentIndex}
        component="img"
        src={getImageUrl(galleryId, img.id)}
        alt=""
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          animation: hovered ? 'flipIn 0.3s ease' : 'none',
          '@keyframes flipIn': {
            '0%': { transform: 'translateY(8px)', opacity: 0.6 },
            '100%': { transform: 'translateY(0)', opacity: 1 },
          },
        }}
      />
    );
  }

  if (animationType === 'glitch') {
    const img = images[currentIndex];
    const src = getImageUrl(galleryId, img.id);
    return (
      <Box sx={{ position: 'absolute', inset: 0 }}>
        <Box
          component="img"
          src={src}
          alt=""
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            ...(glitchActive && {
              animation: 'glitchEffect 0.2s steps(2) forwards',
              '@keyframes glitchEffect': {
                '0%': {
                  clipPath: 'inset(20% 0 30% 0)',
                  transform: 'translateX(-4px)',
                  filter: 'hue-rotate(90deg)',
                },
                '50%': {
                  clipPath: 'inset(50% 0 10% 0)',
                  transform: 'translateX(4px)',
                  filter: 'hue-rotate(-90deg) saturate(2)',
                },
                '100%': {
                  clipPath: 'inset(0)',
                  transform: 'translateX(0)',
                  filter: 'none',
                },
              },
            }),
          }}
        />
        {glitchActive && (
          <>
            <Box
              component="img"
              src={src}
              alt=""
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                clipPath: 'inset(10% 0 60% 0)',
                transform: 'translateX(6px)',
                opacity: 0.7,
                mixBlendMode: 'screen',
                filter: 'hue-rotate(120deg)',
              }}
            />
            <Box
              component="img"
              src={src}
              alt=""
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                clipPath: 'inset(60% 0 10% 0)',
                transform: 'translateX(-6px)',
                opacity: 0.7,
                mixBlendMode: 'screen',
                filter: 'hue-rotate(-120deg)',
              }}
            />
          </>
        )}
      </Box>
    );
  }

  return null;
};

export default GalleryCard;
