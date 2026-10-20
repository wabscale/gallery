import { Box, Typography, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Insights } from '@mui/icons-material';
import { SectionCard } from '../details/fields';
import { actionColor, actionInfo } from './actionMeta';

// Bottom-to-top stacking order for each day's bar
const STACK = ['access', 'view_image', 'download_gallery'];
const MIN_CHART_HEIGHT = 150;
const GUTTER = 3.5;

const dayLabel = (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const Legend = () => (
  <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1.5 }}>
    {STACK.slice().reverse().map((action) => (
      <Box key={action} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: (theme) => actionColor(theme, action) }} />
        <Typography variant="caption" color="text.secondary">{actionInfo(action).short}</Typography>
      </Box>
    ))}
  </Box>
);

const DayTooltip = ({ day }) => (
  <Box sx={{ p: 0.5 }}>
    <Typography variant="caption" fontWeight={700} component="div">
      {day.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
    </Typography>
    {day.total === 0 && <Typography variant="caption" component="div">No activity</Typography>}
    {STACK.filter((a) => day[a] > 0).reverse().map((a) => (
      <Typography key={a} variant="caption" component="div">{day[a]} {actionInfo(a).short.toLowerCase()}</Typography>
    ))}
  </Box>
);

const DayBar = ({ day, max, isToday }) => (
  <Tooltip title={<DayTooltip day={day} />} placement="top" arrow>
    <Box sx={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column-reverse', cursor: 'default',
      '@media (hover: hover)': { '&:hover > div': { filter: 'brightness(1.3)' } } }}>
      {day.total === 0 ? (
        <Box sx={{ height: 2, borderRadius: 1, bgcolor: 'divider' }} />
      ) : STACK.filter((a) => day[a] > 0).map((a, i, shown) => (
        <Box
          key={a}
          sx={{
            height: `${(day[a] / max) * 100}%`,
            minHeight: 3,
            bgcolor: (theme) => actionColor(theme, a),
            borderRadius: i === shown.length - 1 ? '3px 3px 0 0' : 0,
            boxShadow: (theme) => (isToday ? `0 0 10px ${alpha(theme.palette.primary.main, 0.6)}` : 'none'),
            transition: 'filter 0.15s ease',
          }}
        />
      ))}
    </Box>
  </Tooltip>
);

const ActivityChart = ({ daily }) => {
  const max = Math.max(1, ...daily.map((d) => d.total));
  const busiest = daily.reduce((best, d) => (d.total > best.total ? d : best), daily[0]);
  const labelEvery = 7;

  // The card grows to match "Most viewed" and the bar area flexes to fill it
  return (
    <SectionCard
      icon={<Insights />}
      title="Last 30 days"
      subtitle={busiest.total ? `Busiest day: ${dayLabel(busiest.date)} with ${busiest.total} events` : 'No activity in this period'}
      action={<Legend />}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', '& > div:last-of-type': { flex: 1, display: 'flex', flexDirection: 'column' } }}
    >
      <Box sx={{ position: 'relative', flex: 1, minHeight: MIN_CHART_HEIGHT, mt: 2, pr: GUTTER, display: 'flex', alignItems: 'flex-end', gap: { xs: '2px', sm: '4px' } }}>
        {/* Faint guide lines at the top and middle of the scale, labelled in a right gutter */}
        {[1, 0.5].map((f) => (
          <Box key={f} sx={{ position: 'absolute', left: 0, right: 0, bottom: `${f * 100}%`, borderTop: '1px dashed', borderColor: 'divider', pointerEvents: 'none' }}>
            <Typography variant="caption" color="text.disabled"
              sx={{ position: 'absolute', right: 0, top: 0, transform: 'translateY(-50%)', px: 0.5, fontSize: '0.65rem', lineHeight: 1, bgcolor: 'background.paper' }}>
              {Math.round(max * f)}
            </Typography>
          </Box>
        ))}
        {daily.map((day, i) => <DayBar key={day.key} day={day} max={max} isToday={i === daily.length - 1} />)}
      </Box>
      <Box sx={{ display: 'flex', gap: { xs: '2px', sm: '4px' }, mt: 1, pr: GUTTER }}>
        {daily.map((day, i) => (
          <Box key={day.key} sx={{ flex: 1, minWidth: 0, position: 'relative', height: 16 }}>
            {/* Every 7th day counting back from today; skip ones too close to the left edge */}
            {(daily.length - 1 - i) % labelEvery === 0 && i >= 3 && (
              <Typography variant="caption" color={i === daily.length - 1 ? 'primary.main' : 'text.secondary'}
                sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.68rem' }}>
                {i === daily.length - 1 ? 'Today' : dayLabel(day.date)}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </SectionCard>
  );
};

export default ActivityChart;
