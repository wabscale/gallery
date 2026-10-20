import { useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router';
import { Container, Alert, Snackbar, Tabs, Tab, Box, Skeleton, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { PhotoLibrary, Tune, BrandingWatermark, Insights, SearchOff, ArrowBack } from '@mui/icons-material';
import { ListShell, EmptyState } from './common/DataList';
import { useGalleryEditor } from './details/useGalleryEditor';
import DetailsHeader from './details/DetailsHeader';
import PhotosPanel from './details/PhotosPanel';
import SettingsPanel from './details/SettingsPanel';
import WatermarkPanel from './details/WatermarkPanel';
import ActivityPanel from './activity/ActivityPanel';
import { useIsMobile } from '../../hooks/useIsMobile';

const TABS = ['photos', 'settings', 'watermark', 'activity'];

const CountPill = ({ value }) => (
  <Box
    component="span"
    sx={{
      ml: 0.75,
      px: 0.75,
      minWidth: 20,
      borderRadius: 5,
      fontSize: '0.7rem',
      lineHeight: '18px',
      fontWeight: 700,
      textAlign: 'center',
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
      color: 'primary.main',
    }}
  >
    {value}
  </Box>
);

const StatusDot = ({ active }) => (
  <Box
    component="span"
    sx={{
      ml: 1,
      width: 7,
      height: 7,
      borderRadius: '50%',
      bgcolor: active ? 'primary.main' : 'text.disabled',
      boxShadow: (theme) => (active ? `0 0 6px ${theme.palette.primary.main}` : 'none'),
    }}
  />
);

const tabSx = {
  mb: { xs: 2, sm: 3 },
  minHeight: 44,
  borderBottom: '1px solid',
  borderColor: 'divider',
  '& .MuiTab-root': {
    minHeight: 44, minWidth: { xs: 0, sm: 90 }, textTransform: 'none', fontWeight: 600,
    fontSize: '0.9rem', px: { xs: 1.5, sm: 2.5 },
  },
  '& .MuiTab-iconWrapper': { display: { xs: 'none', sm: 'inline-flex' }, fontSize: 20 },
  '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', boxShadow: (theme) => `0 0 8px ${theme.palette.primary.main}` },
};

// Four tabs don't fit a phone at full width, so they scroll there instead.
const EditorTabs = ({ tab, onTab, gallery }) => {
  const isMobile = useIsMobile();
  return (
  <Tabs value={tab} onChange={(_, v) => onTab(v)} variant={isMobile ? 'scrollable' : 'fullWidth'} scrollButtons={false}
    sx={{ ...tabSx, maxWidth: { sm: 680 } }}>
    <Tab value="photos" icon={<PhotoLibrary />} iconPosition="start"
      label={<Box sx={{ display: 'flex', alignItems: 'center' }}>Photos<CountPill value={(gallery.images || []).length} /></Box>} />
    <Tab value="settings" icon={<Tune />} iconPosition="start" label="Settings" />
    <Tab value="watermark" icon={<BrandingWatermark />} iconPosition="start"
      label={<Box sx={{ display: 'flex', alignItems: 'center' }}>Watermark<StatusDot active={gallery.watermark_enabled} /></Box>} />
    {/* The dot shows whether visits are currently being recorded */}
    <Tab value="activity" icon={<Insights />} iconPosition="start"
      label={<Box sx={{ display: 'flex', alignItems: 'center' }}>Activity<StatusDot active={gallery.collect_emails} /></Box>} />
  </Tabs>
  );
};

const TabPanel = ({ active, children }) => (
  <Box role="tabpanel" sx={{ display: active ? 'block' : 'none' }}>{children}</Box>
);

const LoadingState = () => (
  <>
    <Skeleton width={110} height={32} sx={{ mb: 1.5 }} />
    <ListShell sx={{ p: { xs: 2, sm: 3 }, display: 'flex', alignItems: 'center', gap: 2.5, mb: 2.5 }}>
      <Skeleton variant="rounded" sx={{ width: { xs: 64, sm: 88 }, height: { xs: 64, sm: 88 }, flexShrink: 0 }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="45%" height={40} />
        <Skeleton width="30%" />
      </Box>
    </ListShell>
    <Skeleton variant="rounded" height={44} sx={{ mb: 3, maxWidth: 680 }} />
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(auto-fill, minmax(180px, 1fr))' }, gap: 1.5 }}>
      {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} variant="rounded" sx={{ aspectRatio: '1', height: 'auto' }} />)}
    </Box>
  </>
);

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <ListShell>
      <EmptyState
        icon={<SearchOff />}
        title="Gallery not found"
        subtitle="It may have been deleted or the link is wrong."
        action={<Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/admin/galleries')}>Back to galleries</Button>}
      />
    </ListShell>
  );
};

const GalleryDetails = () => {
  const { id } = useParams();
  const editor = useGalleryEditor(id);
  const { gallery, loading, error, setError, toast, setToast } = editor;
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'photos';
  const setTab = (value) => setParams({ tab: value }, { replace: true });
  const openActivity = useCallback(() => setParams({ tab: 'activity' }, { replace: true }), [setParams]);
  const enableTracking = () => editor.handleChange('collect_emails', true);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2.5, sm: 4 } }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {loading && <LoadingState />}
      {!loading && !gallery && <NotFound />}
      {!loading && gallery && (
        <>
          <DetailsHeader gallery={gallery} saveState={editor.saveState} onCopyLink={editor.copyLink} />
          <EditorTabs tab={tab} onTab={setTab} gallery={gallery} />
          {/* Panels stay mounted so uploads and pending debounced edits survive tab switches */}
          <TabPanel active={tab === 'photos'}>
            <PhotosPanel
              gallery={gallery}
              onUploadComplete={editor.refreshGallery}
              onSetCover={editor.setCover}
              onToggleVisibility={editor.toggleVisibility}
              onDeleteImage={editor.deleteImage}
              onDeleteAll={editor.deleteAllImages}
            />
          </TabPanel>
          <TabPanel active={tab === 'settings'}>
            <SettingsPanel gallery={gallery} onChange={editor.handleChange} onCopyLink={editor.copyLink} onError={setError} onToast={setToast}
              onOpenActivity={openActivity} />
          </TabPanel>
          <TabPanel active={tab === 'watermark'}>
            <WatermarkPanel gallery={gallery} active={tab === 'watermark'} onChange={editor.handleChange} onError={setError} />
          </TabPanel>
          <TabPanel active={tab === 'activity'}>
            <ActivityPanel gallery={gallery} active={tab === 'activity'} onEnableTracking={enableTracking} />
          </TabPanel>
        </>
      )}
      <Snackbar
        open={!!toast}
        autoHideDuration={2000}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

export default GalleryDetails;
