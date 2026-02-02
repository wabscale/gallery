import { useState, useEffect } from 'react';
import { Container, Grid, Card, CardContent, Typography, CardActionArea, Box } from '@mui/material';
import { PhotoLibrary } from '@mui/icons-material';
import { galleriesAPI } from '../../services/api';

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
          <Grid item xs={12} sm={6} md={4} key={gallery.id}>
            <Card>
              <CardActionArea href={`/gallery/${gallery.slug}`}>
                <Box
                  sx={{
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.200'
                  }}
                >
                  <PhotoLibrary sx={{ fontSize: 64, color: 'grey.400' }} />
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
