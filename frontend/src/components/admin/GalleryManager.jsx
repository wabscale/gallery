import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Container, Button, Alert, Snackbar } from '@mui/material';
import { Add, PhotoLibrary, SearchOff } from '@mui/icons-material';
import { galleriesAPI } from '../../services/api';
import { ListShell, SkeletonRows, EmptyState, PageHeader } from './common/DataList';
import { serverTime } from './common/format';
import GalleryToolbar from './galleries/GalleryToolbar';
import GalleryListView from './galleries/GalleryListView';
import GalleryGridView from './galleries/GalleryGridView';
import { CreateGalleryDialog, DeleteGalleryDialog } from './galleries/GalleryDialogs';

const VIEW_KEY = 'adminGalleryView';

const SORTERS = {
  newest: (a, b) => serverTime(b.created_at) - serverTime(a.created_at),
  oldest: (a, b) => serverTime(a.created_at) - serverTime(b.created_at),
  name: (a, b) => a.name.localeCompare(b.name),
  photos: (a, b) => b.image_count - a.image_count,
};

const useVisibleGalleries = (galleries, { search, filter, sort }) => useMemo(() => {
  const query = search.trim().toLowerCase();
  return galleries
    .filter((g) => filter === 'all' || (filter === 'public') === g.is_public)
    .filter((g) => !query || g.name.toLowerCase().includes(query) || g.slug.includes(query))
    .sort(SORTERS[sort]);
}, [galleries, search, filter, sort]);

// Loads galleries and exposes the row actions shared by both views.
const useGalleryData = () => {
  const navigate = useNavigate();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    galleriesAPI.listAll()
      .then((response) => setGalleries(response.data))
      .catch(() => setError('Failed to load galleries'))
      .finally(() => setLoading(false));
  }, []);

  const create = async (form) => {
    const response = await galleriesAPI.create(form);
    navigate(`/admin/galleries/${response.data.id}`);
  };

  const remove = async (gallery) => {
    try {
      await galleriesAPI.delete(gallery.id);
      setGalleries((prev) => prev.filter((g) => g.id !== gallery.id));
      setToast(`Deleted "${gallery.name}"`);
    } catch {
      setError('Failed to delete gallery');
    }
    setDeleteTarget(null);
  };

  const copyLink = async (gallery) => {
    await navigator.clipboard.writeText(`${window.location.origin}/gallery/${gallery.slug}`);
    setToast('Link copied');
  };

  const handlers = {
    onEdit: (gallery) => navigate(`/admin/galleries/${gallery.id}`),
    onCopy: copyLink,
    onDelete: setDeleteTarget,
  };

  return { galleries, loading, error, setError, toast, setToast, deleteTarget, setDeleteTarget, create, remove, handlers };
};

const GalleryManager = () => {
  const {
    galleries, loading, error, setError, toast, setToast,
    deleteTarget, setDeleteTarget, create, remove, handlers,
  } = useGalleryData();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || 'list');

  useEffect(() => localStorage.setItem(VIEW_KEY, view), [view]);

  const visible = useVisibleGalleries(galleries, { search, filter, sort });
  const counts = {
    all: galleries.length,
    public: galleries.filter((g) => g.is_public).length,
    private: galleries.filter((g) => !g.is_public).length,
  };
  const totalPhotos = galleries.reduce((sum, g) => sum + g.image_count, 0);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2.5, sm: 4 } }}>
      <PageHeader
        title="Galleries"
        subtitle={loading ? ' ' : `${counts.all} galleries \u00b7 ${totalPhotos.toLocaleString()} photos`}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)} sx={{ flexShrink: 0 }}>
            New Gallery
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {(loading || galleries.length > 0) && (
        <GalleryToolbar
          search={search} onSearch={setSearch}
          filter={filter} onFilter={setFilter} counts={counts}
          sort={sort} onSort={setSort}
          view={view} onView={setView}
        />
      )}

      <GalleryResults
        loading={loading}
        galleries={galleries}
        visible={visible}
        view={view}
        handlers={handlers}
        onCreate={() => setCreateOpen(true)}
        onClearFilters={() => { setSearch(''); setFilter('all'); }}
      />

      <CreateGalleryDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={create} />
      <DeleteGalleryDialog gallery={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} />
      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

const GalleryResults = ({ loading, galleries, visible, view, handlers, onCreate, onClearFilters }) => {
  if (loading) return <ListShell><SkeletonRows /></ListShell>;

  if (galleries.length === 0) {
    return (
      <ListShell>
        <EmptyState
          icon={<PhotoLibrary />}
          title="No galleries yet"
          subtitle="Create your first gallery to start uploading photos."
          action={<Button variant="contained" startIcon={<Add />} onClick={onCreate}>New Gallery</Button>}
        />
      </ListShell>
    );
  }

  if (visible.length === 0) {
    return (
      <ListShell>
        <EmptyState
          icon={<SearchOff />}
          title="No matching galleries"
          subtitle="Try a different search or filter."
          action={<Button variant="outlined" onClick={onClearFilters}>Clear filters</Button>}
        />
      </ListShell>
    );
  }

  return view === 'grid'
    ? <GalleryGridView galleries={visible} {...handlers} />
    : <GalleryListView galleries={visible} {...handlers} />;
};

export default GalleryManager;
