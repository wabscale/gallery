import { useState, useEffect } from 'react';
import { Container, Grid, Typography } from '@mui/material';
import { galleriesAPI } from '../../services/api';
import GalleryCard from './GalleryCard';

const GalleryList = () => {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    try {
      const response = await galleriesAPI.listPublic();
      setGalleries(response.data);
    } catch (err) {
      console.error('Failed to load galleries:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Photo Galleries
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {galleries.map(gallery => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={gallery.id}>
            <GalleryCard gallery={gallery} />
          </Grid>
        ))}
      </Grid>

      {galleries.length === 0 && (
        <Typography variant="h6" color="text.secondary" align="center" sx={{ mt: 4 }}>
          No galleries available
        </Typography>
      )}
    </Container>
  );
};

export default GalleryList;
