import { useState, useMemo } from 'react';
import { Box, Typography, Collapse, Button, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Visibility, CloudDownload, Photo, ExpandMore } from '@mui/icons-material';
import { ListShell, InitialsAvatar } from '../common/DataList';
import { formatRelative, formatDateTime, formatDuration } from '../common/format';
import { collapseRuns } from './activityModel';
import { Filmstrip, TimelineTrack } from './Filmstrip';
import { EventItem } from './EventItems';

const Metric = ({ icon, value, title, color = 'primary' }) => (
  <Tooltip title={title}>
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.5, height: 26, px: 1, borderRadius: 5,
      fontSize: '0.75rem', fontWeight: 700, color: `${color}.main`,
      bgcolor: (theme) => alpha(theme.palette[color].main, 0.1),
      border: '1px solid', borderColor: (theme) => alpha(theme.palette[color].main, 0.25),
      '& svg': { fontSize: 14 },
    }}>
      {icon}{value}
    </Box>
  </Tooltip>
);

const SessionHeader = ({ session }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
    <InitialsAvatar name={session.email} size={40} />
    <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
      <Typography variant="subtitle2" fontWeight={600} noWrap>{session.email}</Typography>
      <Typography variant="caption" color="text.secondary" component="div" noWrap title={formatDateTime(session.start)}>
        {formatRelative(session.end)} · {formatDuration(session.end - session.start)} · {session.events.length} {session.events.length === 1 ? 'event' : 'events'}
      </Typography>
    </Box>
    {/* Own row on phones, aligned under the email, so the subtitle keeps its width */}
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' }, pl: { xs: '52px', sm: 0 } }}>
      <Metric icon={<Visibility />} value={session.views} title="Image views" />
      <Metric icon={<Photo />} value={session.uniqueImages} title="Different photos viewed" />
      {session.downloads > 0 && <Metric icon={<CloudDownload />} value={session.downloads} title="Gallery downloads" color="secondary" />}
    </Box>
  </Box>
);

const SessionCard = ({ session, galleryId }) => {
  const [open, setOpen] = useState(false);
  const items = useMemo(() => (open ? collapseRuns(session.events) : []), [open, session.events]);

  return (
    <ListShell sx={{ p: { xs: 1.5, sm: 2.25 }, transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      '@media (hover: hover)': { '&:hover': { borderColor: (theme) => alpha(theme.palette.primary.main, 0.4) } } }}>
      <SessionHeader session={session} />
      <Box sx={{ mt: 1.75 }}>
        <TimelineTrack events={session.events} start={session.start} end={session.end} />
      </Box>
      {session.views > 0 ? (
        <Box sx={{ mt: 1 }}><Filmstrip events={session.events} galleryId={galleryId} limit={24} /></Box>
      ) : (
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
          Opened the gallery without viewing individual photos
        </Typography>
      )}
      <Button size="small" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        endIcon={<ExpandMore sx={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'none' }} />}
        sx={{ mt: 1, ml: -0.75, color: 'text.secondary' }}>
        {open ? 'Hide events' : session.events.length === 1 ? 'Show event' : `Show all ${session.events.length} events`}
      </Button>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ pt: 1.5 }}>
          {items.map((item) => <EventItem key={item.id} item={item} galleryId={galleryId} />)}
        </Box>
      </Collapse>
    </ListShell>
  );
};

export default SessionCard;
