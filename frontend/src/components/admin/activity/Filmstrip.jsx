import { Box, Typography, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { filmstripFrames } from './activityModel';
import { actionColor, PhotoThumb } from './actionMeta';
import { formatTime, formatDuration } from '../common/format';

const FrameBadge = ({ count }) => (
  <Box
    sx={{
      position: 'absolute',
      right: -4,
      top: -4,
      px: 0.5,
      minWidth: 18,
      height: 16,
      borderRadius: 2,
      fontSize: '0.62rem',
      fontWeight: 700,
      lineHeight: '16px',
      textAlign: 'center',
      color: 'background.default',
      bgcolor: 'primary.main',
    }}
  >
    x{count}
  </Box>
);

// The photos a visitor looked at, in order. Edges fade so long strips read
// as scrollable on phones.
export const Filmstrip = ({ events, galleryId, size = 44, limit = 40 }) => {
  const frames = filmstripFrames(events);
  const shown = frames.slice(0, limit);
  const hidden = frames.length - shown.length;
  if (frames.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.75,
        overflowX: 'auto',
        pt: 0.75,
        pb: 0.5,
        pr: 1,
        scrollbarWidth: 'thin',
        maskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent)',
      }}
    >
      {shown.map((frame) => (
        <Tooltip key={frame.key} title={`${frame.filename || 'Deleted photo'} · ${formatTime(frame.time)}${frame.count > 1 ? ` · viewed ${frame.count}x` : ''}`}>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <PhotoThumb galleryId={galleryId} imageId={frame.imageId} size={size} radius={1} />
            {frame.count > 1 && <FrameBadge count={frame.count} />}
          </Box>
        </Tooltip>
      ))}
      {hidden > 0 && (
        <Box sx={{ flexShrink: 0, width: size, height: size, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: 'primary.main', border: '1px dashed', borderColor: (theme) => alpha(theme.palette.primary.main, 0.4) }}>
          +{hidden}
        </Box>
      )}
    </Box>
  );
};

const markerSize = (action) => (action === 'view_image' ? 7 : 11);

// Every event plotted along the session's duration: clusters of view dots
// show bursts of browsing; larger markers show opens and downloads.
export const TimelineTrack = ({ events, start, end }) => {
  const span = Math.max(end - start, 1);
  const position = (t) => (end === start ? 50 : ((t - start) / span) * 100);

  return (
    <Box>
      <Box sx={{ position: 'relative', height: 16, mx: 0.75 }}>
        <Box sx={{ position: 'absolute', left: 0, right: 0, top: 7, height: 2, borderRadius: 1,
          background: (theme) => `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.primary.main, 0.45)})` }} />
        {events.map((e) => (
          <Box
            key={e.id}
            sx={{
              position: 'absolute',
              top: 8,
              left: `${position(e.time)}%`,
              width: markerSize(e.action),
              height: markerSize(e.action),
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              bgcolor: (theme) => (e.action === 'access' ? theme.palette.background.paper : actionColor(theme, e.action)),
              border: e.action === 'access' ? '2px solid' : 'none',
              borderColor: 'primary.main',
              opacity: e.action === 'view_image' ? 0.75 : 1,
              boxShadow: (theme) => (e.action === 'download_gallery' ? `0 0 8px ${theme.palette.secondary.main}` : 'none'),
              zIndex: e.action === 'view_image' ? 1 : 2,
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>{formatTime(start)}</Typography>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>{formatDuration(end - start)}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>{formatTime(end)}</Typography>
      </Box>
    </Box>
  );
};
