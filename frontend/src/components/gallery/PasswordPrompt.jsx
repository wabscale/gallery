import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert } from '@mui/material';
import { galleriesAPI } from '../../services/api';

const PasswordPrompt = ({ open, onClose, slug, onSuccess, galleryName }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await galleriesAPI.authenticate(slug, password);
      setPassword('');

      try {
        await galleriesAPI.getBySlug(slug);
        onSuccess();
      } catch (err) {
        if (err.response?.data?.requires_email) {
          setShowEmailPrompt(true);
          setLoading(false);
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid password');
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
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

  if (showEmailPrompt) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <form onSubmit={handleEmailSubmit}>
          <DialogTitle>Enter Your Email</DialogTitle>
          <DialogContent>
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
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Password Required</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading || !password}>
            Submit
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PasswordPrompt;
