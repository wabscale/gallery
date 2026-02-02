import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Container, Grid, Typography, Button, Box, CircularProgress } from '@mui/material';
import { Download } from '@mui/icons-material';
import { galleriesAPI, downloadsAPI } from '../../services/api';
import ImageThumbnail from './ImageThumbnail';
import ImageModal from './ImageModal';
import PasswordPrompt from './PasswordPrompt';

const GalleryGrid = () => {
  const { slug } = useParams();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
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
    } catch (err) {
      if (err.response?.data?.requires_password) {
        setRequiresPassword(true);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">{gallery.name}</Typography>
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
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={image.id}>
            <ImageThumbnail
              image={image}
              galleryId={gallery.id}
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
