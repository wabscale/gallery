import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Groups, Visibility, CloudDownload, Schedule } from '@mui/icons-material';
import { ListShell } from '../common/DataList';
import { IconTile } from '../details/fields';
import { formatRelative, formatDateTime } from '../common/format';

const plural = (n, word) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;

const Delta = ({ current, previous }) => {
  if (!previous && !current) return null;
  const diff = current - previous;
  const up = diff >= 0;
  return (
    <Box
      component="span"
      sx={{
        ml: 0.75,
        px: 0.75,
        borderRadius: 1,
        fontSize: '0.7rem',
        fontWeight: 700,
        color: up ? 'primary.main' : 'secondary.main',
        bgcolor: (theme) => alpha(up ? theme.palette.primary.main : theme.palette.secondary.main, 0.12),
      }}
    >
      {up ? '+' : ''}{diff}
    </Box>
  );
};

const StatTile = ({ icon, color = 'primary', label, value, sub, title, small }) => (
  <ListShell sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'flex-start', gap: 1.5, minWidth: 0 }}>
    <Box sx={{ display: { xs: 'none', sm: 'flex' } }}><IconTile icon={icon} color={color} size={36} /></Box>
    <Box sx={{ minWidth: 0 }} title={title}>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4, letterSpacing: '0.08em', display: 'block' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: small ? { xs: '1rem', sm: '1.15rem' } : { xs: '1.35rem', sm: '1.6rem' }, fontWeight: 600, lineHeight: small ? 1.6 : 1.15 }} noWrap>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" component="div"
        sx={{ mt: 0.25, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>
        {sub}
      </Typography>
    </Box>
  </ListShell>
);

const ActivityStats = ({ stats }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 1, sm: 2 } }}>
    <StatTile
      icon={<Groups />}
      label="Visitors"
      value={stats.visitors.toLocaleString()}
      sub={`${plural(stats.sessions, 'session')} · ${stats.visitorsThisWeek} this week`}
    />
    <StatTile
      icon={<Visibility />}
      label="Image views"
      value={<>{stats.views.toLocaleString()}<Delta current={stats.viewsThisWeek} previous={stats.viewsLastWeek} /></>}
      sub={`${stats.uniqueImages} photos · ~${stats.avgViewsPerSession} per session`}
      title="Change compares the last 7 days with the 7 days before"
    />
    <StatTile
      icon={<CloudDownload />}
      color="secondary"
      label="Downloads"
      value={stats.downloads.toLocaleString()}
      sub={`${stats.downloadsThisWeek} in the last 7 days`}
    />
    <StatTile
      icon={<Schedule />}
      small
      label="Last activity"
      value={stats.last ? formatRelative(stats.last.created_at) : 'Never'}
      sub={stats.last ? stats.last.email : 'No visits yet'}
      title={stats.last ? formatDateTime(stats.last.created_at) : undefined}
    />
  </Box>
);

export default ActivityStats;
