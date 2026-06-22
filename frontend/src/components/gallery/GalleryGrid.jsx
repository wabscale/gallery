import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Container, Grid, Typography, Button, Box, CircularProgress } from '@mui/material';
import { Download } from '@mui/icons-material';
import { galleriesAPI, downloadsAPI } from '../../services/api';
import ImageThumbnail from './ImageThumbnail';
import ImageModal from './ImageModal';
import PasswordPrompt from './PasswordPrompt';
import EmailPrompt from './EmailPrompt';

const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <radialGradient id="ig-gradient" cx="30%" cy="107%" r="150%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="5%" stopColor="#fdf497" />
        <stop offset="45%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="90%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig-gradient)" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4.5" stroke="url(#ig-gradient)" strokeWidth="2" fill="none" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig-gradient)" />
  </svg>
);

const getGridSize = (aspectRatio) => {
  switch (aspectRatio) {
    case '1x1':
      return { xs: 6, sm: 4, md: 3, lg: 3 };
    case '9x16':
      return { xs: 6, sm: 4, md: 3, lg: 2 };
    case '16x9':
      return { xs: 12, sm: 6, md: 4 };
    case '5x4':
      return { xs: 12, sm: 6, md: 4 };
    case '4x5':
    default:
      return { xs: 6, sm: 4, md: 3, lg: 2 };
  }
};

const GalleryGrid = () => {
  const { slug } = useParams();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [requiresEmail, setRequiresEmail] = useState(false);
  const [galleryName, setGalleryName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [downloadTaskId, setDownloadTaskId] = useState(null);

  useEffect(() => {
    loadGallery();
  }, [slug]);

  const loadGallery = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await galleriesAPI.getBySlug(slug);
      setGallery(response.data);
      setRequiresPassword(false);
      setRequiresEmail(false);
    } catch (err) {
      if (err.response?.data?.requires_password) {
        setRequiresPassword(true);
        setGalleryName(err.response?.data?.gallery_name || '');
      } else if (err.response?.data?.requires_email) {
        setRequiresEmail(true);
        setGalleryName(err.response?.data?.gallery_name || '');
      } else {
        setError(err.response?.data?.error || 'Failed to load gallery');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image, index) => {
    setSelectedImage(image);
    setSelectedIndex(index);
  };

  const handleNext = () => {
    if (selectedIndex < gallery.images.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);
      setSelectedImage(gallery.images[newIndex]);
    }
  };

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);
      setSelectedImage(gallery.images[newIndex]);
    }
  };

  const handleDownloadGallery = async () => {
    setDownloadStatus('requesting');

    try {
      const response = await downloadsAPI.requestZip(slug);
      const taskId = response.data.task_id;
      setDownloadTaskId(taskId);
      setDownloadStatus('processing');

      pollDownloadStatus(taskId);
    } catch (err) {
      setDownloadStatus('error');
      setError(err.response?.data?.error || 'Failed to start download');
    }
  };

  const pollDownloadStatus = async (taskId) => {
    const interval = setInterval(async () => {
      try {
        const response = await downloadsAPI.checkStatus(taskId);
        const status = response.data.status;

        if (status === 'ready') {
          clearInterval(interval);
          setDownloadStatus('ready');
          window.location.href = downloadsAPI.downloadFile(taskId);
          setTimeout(() => setDownloadStatus(null), 3000);
        } else if (status === 'error') {
          clearInterval(interval);
          setDownloadStatus('error');
          setError(response.data.error);
        }
      } catch (err) {
        clearInterval(interval);
        setDownloadStatus('error');
      }
    }, 2000);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (requiresPassword) {
    return (
      <PasswordPrompt
        open={requiresPassword}
        onClose={() => window.location.href = '/'}
        slug={slug}
        galleryName={galleryName}
        onSuccess={loadGallery}
      />
    );
  }

  if (requiresEmail) {
    return (
      <EmailPrompt
        open={requiresEmail}
        onClose={() => window.location.href = '/'}
        slug={slug}
        galleryName={galleryName}
        onSuccess={loadGallery}
      />
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!gallery) return null;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" component="h1">{gallery.name}</Typography>
          {gallery.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
              {gallery.description}
            </Typography>
          )}
          <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {gallery.image_count} {gallery.image_count === 1 ? 'photo' : 'photos'}
            </Typography>
            {gallery.photographer_instagram && (
              <>
                <Typography variant="body2" color="text.secondary">|</Typography>
                <a
                  href={`https://instagram.com/${gallery.photographer_instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                >
                  <InstagramIcon size={16} />
                  <Typography variant="body2" color="text.secondary">
                    @{gallery.photographer_instagram}
                  </Typography>
                </a>
              </>
            )}
          </Box>
        </Box>
        {gallery.allow_download && (
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownloadGallery}
            disabled={downloadStatus === 'requesting' || downloadStatus === 'processing'}
          >
            {downloadStatus === 'processing' ? 'Preparing...' : 'Download Gallery'}
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        {gallery.images.map((image, index) => (
          <Grid size={getGridSize(gallery.thumbnail_aspect_ratio || '4x5')} key={image.id}>
            <ImageThumbnail
              image={image}
              galleryId={gallery.id}
              aspectRatio={gallery.thumbnail_aspect_ratio || '4x5'}
              onClick={() => handleImageClick(image, index)}
            />
          </Grid>
        ))}
      </Grid>

      <ImageModal
        open={selectedImage !== null}
        onClose={() => setSelectedImage(null)}
        image={selectedImage}
        galleryId={gallery?.id}
        onNext={selectedIndex < gallery.images.length - 1 ? handleNext : null}
        onPrevious={selectedIndex > 0 ? handlePrevious : null}
        allowDownload={gallery?.allow_download && !gallery?.thumbnail_only}
      />
    </Container>
  );
};

export default GalleryGrid;
