import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Switch, FormControlLabel, Alert, Chip
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const UserManager = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', is_active: true });
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const response = await adminAPI.listUsers();
    setUsers(response.data);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setForm({ username: '', email: '', password: '', is_active: true });
    setError('');
    setDialogOpen(true);
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setForm({ username: user.username, email: user.email, password: '', is_active: user.is_active });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editingUser) {
        const data = { username: form.username, email: form.email, is_active: form.is_active };
        if (form.password) data.password = form.password;
        await adminAPI.updateUser(editingUser.id, data);
      } else {
        if (!form.password) {
          setError('Password is required for new users');
          return;
        }
        await adminAPI.createUser(form);
      }
      setDialogOpen(false);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await adminAPI.deleteUser(userId);
      setDeleteConfirm(null);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
      setDeleteConfirm(null);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Users</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Add User
        </Button>
      </Box>

      {error && !dialogOpen && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  {u.username}
                  {u.id === currentUser?.id && (
                    <Chip label="you" size="small" sx={{ ml: 1 }} />
                  )}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip
                    label={u.is_active ? 'Active' : 'Inactive'}
                    color={u.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEditDialog(u)}>
                    <Edit />
                  </IconButton>
                  {u.id !== currentUser?.id && (
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(u)}>
                      <Delete />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
        <DialogContent>
          {error && dialogOpen && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            label="Username"
            fullWidth
            margin="dense"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <TextField
            label="Email"
            fullWidth
            margin="dense"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label={editingUser ? 'New Password (leave blank to keep)' : 'Password'}
            fullWidth
            margin="dense"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
            }
            label="Active"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingUser ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{deleteConfirm?.username}"? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => handleDelete(deleteConfirm.id)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManager;
