import { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, TextField, Button, Box, Alert, Grid,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Delete, Upload } from '@mui/icons-material';
import { siteSettingsAPI } from '../../services/api';
import { useSiteSettings } from '../../hooks/useSiteSettings';

const SiteSettings = () => {
  const { refresh: refreshGlobalSettings } = useSiteSettings();
  const [settings, setSettings] = useState({ site_title: '', site_heading: '', gallery_card_aspect_ratio: '4x5' });
  const [hasFavicon, setHasFavicon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await siteSettingsAPI.get();
      setSettings({
        site_title: response.data.site_title || '',
        site_heading: response.data.site_heading || '',
        gallery_card_aspect_ratio: response.data.gallery_card_aspect_ratio || '4x5'
      });
      setHasFavicon(response.data.has_favicon);
    } catch {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    try {
      await siteSettingsAPI.update(settings);
      refreshGlobalSettings();
      setSuccess('Settings saved');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save settings');
    }
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setSuccess('');
    try {
      await siteSettingsAPI.uploadFavicon(file);
      setHasFavicon(true);
      refreshGlobalSettings();
      setSuccess('Favicon uploaded and converted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload favicon');
    }
  };

  const handleDeleteFavicon = async () => {
    setError('');
    try {
      await siteSettingsAPI.deleteFavicon();
      setHasFavicon(false);
      setSuccess('Favicon removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to remove favicon');
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" mb={4}>Site Settings</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Branding</Typography>

            <TextField
              fullWidth
              label="Browser Tab Title"
              value={settings.site_title}
              onChange={(e) => setSettings(prev => ({ ...prev, site_title: e.target.value }))}
              margin="normal"
              size="small"
              placeholder="Photo Gallery"
              helperText="Shown in the browser tab"
            />

            <TextField
              fullWidth
              label="Site Heading"
              value={settings.site_heading}
              onChange={(e) => setSettings(prev => ({ ...prev, site_heading: e.target.value }))}
              margin="normal"
              size="small"
              placeholder="Photo Gallery"
              helperText="Shown in the top-left of the navigation bar"
            />

            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Gallery Card Aspect Ratio</InputLabel>
              <Select
                value={settings.gallery_card_aspect_ratio}
                label="Gallery Card Aspect Ratio"
                onChange={(e) => setSettings(prev => ({ ...prev, gallery_card_aspect_ratio: e.target.value }))}
              >
                <MenuItem value="1x1">1:1 (Square)</MenuItem>
                <MenuItem value="4x5">4:5 (Portrait)</MenuItem>
                <MenuItem value="5x4">5:4 (Landscape)</MenuItem>
                <MenuItem value="9x16">9:16 (Tall)</MenuItem>
                <MenuItem value="16x9">16:9 (Wide)</MenuItem>
              </Select>
            </FormControl>

            <Button variant="contained" onClick={handleSave} sx={{ mt: 2 }} fullWidth>
              Save Settings
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Favicon</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a PNG, JPG, or ICO file. PNG/JPG files are automatically converted to ICO format
              with multiple sizes (16x16, 32x32, 48x48, 64x64).
            </Typography>

            {hasFavicon && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  component="img"
                  src={`/api/favicon.ico?t=${Date.now()}`}
                  alt="Current favicon"
                  sx={{ width: 32, height: 32 }}
                />
                <Typography variant="body2" color="text.secondary">Current favicon</Typography>
                <Button
                  size="small"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleDeleteFavicon}
                >
                  Remove
                </Button>
              </Box>
            )}

            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload />}
              fullWidth
            >
              Upload Favicon
              <input
                type="file"
                hidden
                accept=".png,.jpg,.jpeg,.ico"
                onChange={handleFaviconUpload}
              />
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SiteSettings;
