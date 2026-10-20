import { useState, useEffect, useMemo } from 'react';
import { Box, Grid, Button, Alert, Skeleton, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Insights, SearchOff, AlternateEmail, InfoOutlined } from '@mui/icons-material';
import { ListShell, EmptyState } from '../common/DataList';
import { useActivityLog, exportActivityCsv, MAX_EVENTS } from './useActivityLog';
import ActivityStats from './ActivityStats';
import ActivityChart from './ActivityChart';
import TopImages from './TopImages';
import ActivityToolbar from './ActivityToolbar';
import SessionCard from './SessionCard';
import EventFeed, { feedItemCount } from './EventFeed';

const VIEW_KEY = 'adminActivityView';
const PAGE = { sessions: 15, timeline: 60 };

const TrackingOffBanner = ({ onEnable }) => (
  <Box sx={{
    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, p: 1.5, pl: 2, borderRadius: 2,
    border: '1px solid', borderColor: (theme) => alpha(theme.palette.secondary.main, 0.35),
    bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.08),
  }}>
    <InfoOutlined color="secondary" />
    <Typography variant="body2" sx={{ flex: '1 1 220px' }}>
      Email collection is off, so new visits are not being recorded.
    </Typography>
    <Button size="small" variant="outlined" color="secondary" onClick={onEnable}>Turn on</Button>
  </Box>
);

const LoadingState = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: { xs: 1, sm: 2 } }}>
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={92} />)}
    </Box>
    <Skeleton variant="rounded" height={240} />
    {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={150} />)}
  </Box>
);

const NoActivity = ({ tracking, onEnable }) => (
  <ListShell>
    <EmptyState
      icon={tracking ? <Insights /> : <AlternateEmail />}
      title={tracking ? 'No visits yet' : 'Visitor tracking is off'}
      subtitle={tracking
        ? 'Share the gallery link. Opens, photo views and downloads will appear here.'
        : 'Turn on email collection to see who opens the gallery and which photos they look at.'}
      action={!tracking && <Button variant="contained" startIcon={<AlternateEmail />} onClick={onEnable}>Turn on email collection</Button>}
    />
  </ListShell>
);

const useFilteredActivity = (data, search, action) => useMemo(() => {
  const query = search.trim().toLowerCase();
  const matches = (email) => !query || email.toLowerCase().includes(query);
  return {
    sessions: data.sessions.filter((s) => matches(s.email)),
    events: data.events.filter((e) => matches(e.email) && (action === 'all' || e.action === action)),
  };
}, [data.sessions, data.events, search, action]);

const ActivityPanel = ({ gallery, active, onEnableTracking }) => {
  const data = useActivityLog(gallery.id, active);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || 'sessions');
  const [limit, setLimit] = useState(PAGE[view]);
  const filtered = useFilteredActivity(data, search, action);

  useEffect(() => localStorage.setItem(VIEW_KEY, view), [view]);
  useEffect(() => setLimit(PAGE[view]), [view, search, action]);

  if (data.error) return <Alert severity="error" action={<Button color="inherit" onClick={data.reload}>Retry</Button>}>{data.error}</Alert>;
  if (!data.loaded) return <LoadingState />;
  if (data.events.length === 0) return <NoActivity tracking={gallery.collect_emails} onEnable={onEnableTracking} />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 } }}>
      {!gallery.collect_emails && <TrackingOffBanner onEnable={onEnableTracking} />}
      <ActivityStats stats={data.stats} />
      <Grid container spacing={{ xs: 2, sm: 2.5 }}>
        <Grid size={{ xs: 12, md: 7, lg: 8 }}><ActivityChart daily={data.daily} /></Grid>
        <Grid size={{ xs: 12, md: 5, lg: 4 }}><TopImages top={data.top} galleryId={gallery.id} /></Grid>
      </Grid>
      <ActivityToolbar
        search={search} onSearch={setSearch}
        view={view} onView={setView}
        action={action} onAction={setAction}
        loading={data.loading} onRefresh={data.reload}
        onExport={() => exportActivityCsv(gallery.id, data.events)}
      />
      {data.truncated && (
        <Typography variant="caption" color="text.secondary">
          Showing the most recent {MAX_EVENTS.toLocaleString()} of {data.total.toLocaleString()} events.
        </Typography>
      )}
      <ActivityList view={view} filtered={filtered} galleryId={gallery.id} limit={limit} onMore={() => setLimit((l) => l + PAGE[view])}
        onClear={() => { setSearch(''); setAction('all'); }} />
    </Box>
  );
};

const ActivityList = ({ view, filtered, galleryId, limit, onMore, onClear }) => {
  const total = view === 'sessions' ? filtered.sessions.length : feedItemCount(filtered.events);
  if (total === 0) {
    return (
      <ListShell>
        <EmptyState icon={<SearchOff />} title="No matching activity" subtitle="Try a different search or filter."
          action={<Button variant="outlined" onClick={onClear}>Clear filters</Button>} />
      </ListShell>
    );
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
      {view === 'sessions'
        ? filtered.sessions.slice(0, limit).map((s) => <SessionCard key={s.id} session={s} galleryId={galleryId} />)
        : <EventFeed events={filtered.events} galleryId={galleryId} limit={limit} />}
      {total > limit && (
        <Button variant="outlined" onClick={onMore} sx={{ alignSelf: 'center' }}>
          Show more ({(total - limit).toLocaleString()} remaining)
        </Button>
      )}
    </Box>
  );
};

export default ActivityPanel;
