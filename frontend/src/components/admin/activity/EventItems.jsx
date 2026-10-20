import { useState } from 'react';
import { Box, Typography, Collapse, ButtonBase } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ExpandMore } from '@mui/icons-material';
import { InitialsAvatar } from '../common/DataList';
import { formatTime, formatDuration, formatDateTime } from '../common/format';
import { ActionPill, PhotoThumb, actionColor } from './actionMeta';
import { Filmstrip } from './Filmstrip';

// Left rail with a node per item; items stack into a vertical timeline.
const Rail = ({ action, big, children }) => (
  <Box sx={{ display: 'flex', gap: { xs: 1.25, sm: 1.75 }, position: 'relative',
    '&::before': { content: '""', position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, bgcolor: 'divider' },
    '&:first-of-type::before': { top: 14 }, '&:last-of-type::before': { bottom: 'calc(100% - 14px)' } }}>
    <Box sx={{ width: 16, flexShrink: 0, display: 'flex', justifyContent: 'center', pt: '9px', zIndex: 1 }}>
      <Box sx={{
        width: big ? 12 : 10, height: big ? 12 : 10, borderRadius: '50%',
        bgcolor: (theme) => actionColor(theme, action),
        boxShadow: (theme) => `0 0 0 3px ${theme.palette.background.paper}${big ? `, 0 0 10px ${actionColor(theme, action)}` : ''}`,
      }} />
    </Box>
    <Box sx={{ flex: 1, minWidth: 0, pb: 1.5 }}>{children}</Box>
  </Box>
);

const Visitor = ({ email }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
    <InitialsAvatar name={email} size={20} />
    <Typography variant="body2" fontWeight={600} noWrap>{email}</Typography>
  </Box>
);

const Time = ({ time, sx }) => (
  <Typography variant="caption" color="text.secondary" title={formatDateTime(time)}
    sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', ...sx }}>
    {formatTime(time)}
  </Typography>
);

const EventLine = ({ item, galleryId, showVisitor }) => {
  const event = item.events[0];
  return (
    <Rail action={event.action} big={event.action !== 'view_image'}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 1.25, rowGap: 0.5, minHeight: 28 }}>
        <Time time={event.time} sx={{ width: { sm: 64 } }} />
        {showVisitor && <Visitor email={event.email} />}
        <ActionPill action={event.action} />
        {event.action === 'view_image' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <PhotoThumb galleryId={galleryId} imageId={event.image_id} size={24} radius={0.75} />
            <Typography variant="caption" color="text.secondary" noWrap>{event.image_filename || 'Deleted photo'}</Typography>
          </Box>
        )}
      </Box>
    </Rail>
  );
};

const StackedThumbs = ({ events, galleryId }) => {
  const ids = [...new Set(events.map((e) => e.image_id))].slice(0, 3);
  return (
    <Box sx={{ display: 'flex', flexShrink: 0, pl: 1 }}>
      {ids.map((id, i) => (
        <PhotoThumb key={id ?? i} galleryId={galleryId} imageId={id} size={28} radius={0.75}
          sx={{ ml: -1, boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`, zIndex: 3 - i }} />
      ))}
    </Box>
  );
};

const RunHeader = ({ run, galleryId, showVisitor, open }) => {
  const first = run.events[0];
  const last = run.events[run.events.length - 1];
  const unique = new Set(run.events.map((e) => e.image_id)).size;
  const [from, to] = first.time <= last.time ? [first, last] : [last, first];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 1.25, rowGap: 0.5, minHeight: 28, width: '100%' }}>
      <Time time={from.time} sx={{ width: { sm: 64 } }} />
      {showVisitor && <Visitor email={run.email} />}
      <ActionPill action="view_image" label={`Viewed ${run.events.length} images`} />
      <StackedThumbs events={run.events} galleryId={galleryId} />
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {unique} unique · {formatDuration(to.time - from.time)}
      </Typography>
      <ExpandMore sx={{ ml: 'auto', fontSize: 20, color: 'text.secondary', transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'none' }} />
    </Box>
  );
};

const RunLine = ({ item, galleryId, showVisitor }) => {
  const [open, setOpen] = useState(false);
  const chronological = [...item.events].sort((a, b) => a.time - b.time);
  return (
    <Rail action="view_image" big>
      <ButtonBase onClick={() => setOpen((v) => !v)} aria-expanded={open}
        sx={{ display: 'block', width: '100%', textAlign: 'left', borderRadius: 1.5, p: 0.5, m: -0.5,
          '@media (hover: hover)': { '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05) } } }}>
        <RunHeader run={item} galleryId={galleryId} showVisitor={showVisitor} open={open} />
      </ButtonBase>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ mt: 1, p: 1.5, borderRadius: 1.5, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04), border: '1px solid', borderColor: 'divider' }}>
          <Filmstrip events={chronological} galleryId={galleryId} size={48} limit={80} />
          <Box sx={{ mt: 1, maxHeight: 260, overflowY: 'auto' }}>
            {chronological.map((e) => (
              <Box key={e.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.5 }}>
                <Time time={e.time} sx={{ width: 64 }} />
                <PhotoThumb galleryId={galleryId} imageId={e.image_id} size={22} radius={0.5} />
                <Typography variant="caption" color="text.secondary" noWrap>{e.image_filename || 'Deleted photo'}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Collapse>
    </Rail>
  );
};

export const EventItem = ({ item, ...props }) => (
  item.kind === 'run' ? <RunLine item={item} {...props} /> : <EventLine item={item} {...props} />
);
