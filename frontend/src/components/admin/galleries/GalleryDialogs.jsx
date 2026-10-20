import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControlLabel, Switch,
  Button, Alert, Box, Typography
} from '@mui/material';
import { WarningAmber } from '@mui/icons-material';
import { GalleryCover } from './GalleryBadges';

const EMPTY_GALLERY = { name: '', is_public: true, password: '' };

export const CreateGalleryDialog = ({ open, onClose, onCreate }) => {
  const [form, setForm] = useState(EMPTY_GALLERY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setError('');
    setSaving(true);
    try {
      await onCreate(form);
      setForm(EMPTY_GALLERY);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create gallery');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Gallery</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <TextField
          fullWidth
          autoFocus
          label="Gallery Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && form.name && handleCreate()}
          margin="normal"
          required
        />
        <FormControlLabel
          control={<Switch checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} />}
          label="Public Gallery"
        />
        <TextField
          fullWidth
          type="password"
          label="Password (optional)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          margin="normal"
          helperText="Leave empty for no password protection"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={!form.name || saving}>
          {saving ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const DeleteGalleryDialog = ({ gallery, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm(gallery);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={!!gallery} onClose={() => !deleting && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmber color="error" /> Delete gallery
      </DialogTitle>
      <DialogContent>
        {gallery && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, mb: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
            <GalleryCover gallery={gallery} sx={{ width: 56, height: 56, flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={600} noWrap>{gallery.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {gallery.image_count} {gallery.image_count === 1 ? 'photo' : 'photos'}
              </Typography>
            </Box>
          </Box>
        )}
        <Typography variant="body2" color="text.secondary">
          This permanently deletes the gallery and all of its photos. This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>Cancel</Button>
        <Button color="error" variant="contained" onClick={handleConfirm} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
