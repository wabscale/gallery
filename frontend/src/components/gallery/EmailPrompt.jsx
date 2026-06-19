import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Typography } from '@mui/material';
import { galleriesAPI } from '../../services/api';

const EmailPrompt = ({ open, onClose, slug, galleryName, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await galleriesAPI.submitEmail(slug, email);
      setEmail('');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Enter Your Email</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please enter your email address to access {galleryName || 'this gallery'}.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            fullWidth
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading || !email}>
            Continue
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EmailPrompt;
