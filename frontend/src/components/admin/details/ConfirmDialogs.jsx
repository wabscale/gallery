import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { WarningAmber } from '@mui/icons-material';
import { thumbUrl } from './PhotoTile';

const ConfirmDialog = ({ open, title, onClose, onConfirm, confirmLabel, children }) => {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmber color="error" /> {title}
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button color="error" variant="contained" onClick={handleConfirm} disabled={busy}>
          {busy ? 'Deleting...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const DeleteImageDialog = ({ image, galleryId, onClose, onConfirm }) => (
  <ConfirmDialog
    open={!!image}
    title="Delete photo"
    confirmLabel="Delete"
    onClose={onClose}
    onConfirm={() => onConfirm(image.id)}
  >
    {image && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, mb: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
        <Box
          component="img"
          src={thumbUrl(galleryId, image.id)}
          alt=""
          sx={{ width: 56, height: 56, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={600} noWrap>{image.original_filename}</Typography>
          {image.width && (
            <Typography variant="body2" color="text.secondary">{image.width} x {image.height}</Typography>
          )}
        </Box>
      </Box>
    )}
    <Typography variant="body2" color="text.secondary">
      Delete this image permanently? This cannot be undone.
    </Typography>
  </ConfirmDialog>
);

export const DeleteAllDialog = ({ open, count, onClose, onConfirm }) => (
  <ConfirmDialog open={open} title="Delete all photos" confirmLabel="Delete all" onClose={onClose} onConfirm={onConfirm}>
    <Typography variant="body2" color="text.secondary">
      Are you sure you want to permanently delete all {count} images from this gallery? This cannot be undone.
    </Typography>
  </ConfirmDialog>
);
