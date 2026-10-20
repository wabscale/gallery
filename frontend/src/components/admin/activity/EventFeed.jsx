import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { ListShell } from '../common/DataList';
import { localDayKey } from '../common/format';
import { collapseRuns } from './activityModel';
import { EventItem } from './EventItems';

const dayHeading = (date) => {
  const today = localDayKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const key = localDayKey(date);
  if (key === today) return 'Today';
  if (key === localDayKey(yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
};

// Newest first, runs of image views collapsed, grouped under local day headings.
const groupByDay = (items) => {
  const days = [];
  items.forEach((item) => {
    const date = new Date(item.events[0].time);
    const key = localDayKey(date);
    if (days[days.length - 1]?.key !== key) days.push({ key, heading: dayHeading(date), items: [], events: 0 });
    const day = days[days.length - 1];
    day.items.push(item);
    day.events += item.events.length;
  });
  return days;
};

const EventFeed = ({ events, galleryId, limit }) => {
  const days = useMemo(() => {
    const newestFirst = [...events].reverse();
    return groupByDay(collapseRuns(newestFirst).slice(0, limit));
  }, [events, limit]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
      {days.map((day) => (
        <ListShell key={day.key} sx={{ p: { xs: 1.5, sm: 2.25 } }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>{day.heading}</Typography>
            <Typography variant="caption" color="text.secondary">{day.events} {day.events === 1 ? 'event' : 'events'}</Typography>
          </Box>
          {day.items.map((item) => <EventItem key={item.id} item={item} galleryId={galleryId} showVisitor />)}
        </ListShell>
      ))}
    </Box>
  );
};

export const feedItemCount = (events) => collapseRuns(events).length;

export default EventFeed;
