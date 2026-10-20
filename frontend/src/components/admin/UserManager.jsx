import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, IconButton, Dialog, DialogTitle, Tooltip,
  DialogContent, DialogActions, TextField, Switch, FormControlLabel, Alert, Chip
} from '@mui/material';
import { EditOutlined, DeleteOutline, PersonAdd } from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import {
  ListShell, ListHeader, HeaderCell, ListRow, Cell, SkeletonRows, InitialsAvatar, StatusDot, PageHeader
} from './common/DataList';
import { formatRelative, formatDate } from './common/format';

const USER_TEMPLATE = {
  xs: '40px minmax(0, 1fr) auto',
  md: '40px minmax(0, 1.2fr) minmax(0, 1.6fr) 110px 130px 96px',
};

const UserRow = ({ user, isSelf, onEdit, onDelete }) => (
  <ListRow template={USER_TEMPLATE} dimmed={!user.is_active}>
    <InitialsAvatar name={user.username} />
    <Cell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={600} noWrap>{user.username}</Typography>
        {isSelf && <Chip label="You" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />}
      </Box>
      {/* On phones email and status fold under the name */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Typography variant="body2" color="text.secondary" noWrap>{user.email}</Typography>
        <Box sx={{ mt: 0.5 }}><StatusDot active={user.is_active} label={user.is_active ? 'Active' : 'Inactive'} /></Box>
      </Box>
    </Cell>
    <Cell hideBelow="md">
      <Typography variant="body2" color="text.secondary" noWrap>{user.email}</Typography>
    </Cell>
    <Cell hideBelow="md">
      <StatusDot active={user.is_active} label={user.is_active ? 'Active' : 'Inactive'} />
    </Cell>
    <Cell hideBelow="md">
      <Tooltip title={formatDate(user.created_at)} placement="top-start">
        <Typography variant="body2" color="text.secondary" component="span">{formatRelative(user.created_at)}</Typography>
      </Tooltip>
    </Cell>
    <Cell align="right" sx={{ whiteSpace: 'nowrap' }}>
      <Tooltip title="Edit">
        <IconButton size="small" onClick={() => onEdit(user)}><EditOutlined fontSize="small" /></IconButton>
      </Tooltip>
      {!isSelf && (
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => onDelete(user)}
            sx={{ '@media (hover: hover)': { '&:hover': { color: 'error.main' } } }}
          >
            <DeleteOutline fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Cell>
  </ListRow>
);

const UserManager = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(false);
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
    <Container maxWidth="lg" sx={{ py: { xs: 2.5, sm: 4 } }}>
      <PageHeader
        title="Users"
        subtitle={loading ? ' ' : `${users.length} ${users.length === 1 ? 'account' : 'accounts'} \u00b7 ${users.filter((u) => u.is_active).length} active`}
        action={
          <Button variant="contained" startIcon={<PersonAdd />} onClick={openCreateDialog} sx={{ flexShrink: 0 }}>
            Add User
          </Button>
        }
      />

      {error && !dialogOpen && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <ListShell>
        <ListHeader template={USER_TEMPLATE.md}>
          <span />
          <HeaderCell>User</HeaderCell>
          <HeaderCell>Email</HeaderCell>
          <HeaderCell>Status</HeaderCell>
          <HeaderCell>Joined</HeaderCell>
          <HeaderCell align="right">Actions</HeaderCell>
        </ListHeader>
        {loading && <SkeletonRows count={3} />}
        {users.map((u) => (
          <UserRow
            key={u.id}
            user={u}
            isSelf={u.id === currentUser?.id}
            onEdit={openEditDialog}
            onDelete={setDeleteConfirm}
          />
        ))}
      </ListShell>

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
