import { serverTime, localDayKey } from '../common/format';

// Pure helpers that turn the raw access log into things worth looking at:
// visitor sessions, collapsed runs of image views, daily series and rankings.

export const SESSION_GAP_MS = 30 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Adds a numeric timestamp and returns events oldest first.
export const normalizeLogs = (logs) => logs
  .map((log) => ({ ...log, time: serverTime(log.created_at) }))
  .sort((a, b) => a.time - b.time || a.id - b.id);

const summarizeSession = (email, events) => {
  const views = events.filter((e) => e.action === 'view_image');
  return {
    id: `${email}-${events[0].id}`,
    email,
    events,
    start: events[0].time,
    end: events[events.length - 1].time,
    views: views.length,
    uniqueImages: new Set(views.map((e) => e.image_id)).size,
    downloads: events.filter((e) => e.action === 'download_gallery').length,
  };
};

// A visitor's events split wherever they went quiet for longer than the gap.
export const buildSessions = (events, gapMs = SESSION_GAP_MS) => {
  const byVisitor = new Map();
  events.forEach((e) => {
    if (!byVisitor.has(e.email)) byVisitor.set(e.email, []);
    byVisitor.get(e.email).push(e);
  });

  const sessions = [];
  byVisitor.forEach((visitorEvents, email) => {
    let current = [visitorEvents[0]];
    for (let i = 1; i < visitorEvents.length; i++) {
      const event = visitorEvents[i];
      if (event.time - current[current.length - 1].time > gapMs) {
        sessions.push(summarizeSession(email, current));
        current = [];
      }
      current.push(event);
    }
    sessions.push(summarizeSession(email, current));
  });
  return sessions.sort((a, b) => b.end - a.end);
};

const continuesRun = (run, event, gapMs) => {
  const last = run.events[run.events.length - 1];
  return event.action === 'view_image' && event.email === run.email && Math.abs(event.time - last.time) <= gapMs;
};

// Consecutive image views by the same visitor become one "run" item so a
// visitor paging through 40 photos reads as a single line, not 40.
export const collapseRuns = (events, gapMs = SESSION_GAP_MS) => {
  const items = [];
  events.forEach((event) => {
    const prev = items[items.length - 1];
    if (prev?.kind === 'run' && continuesRun(prev, event, gapMs)) {
      prev.events.push(event);
      return;
    }
    if (event.action === 'view_image') {
      items.push({ kind: 'run', id: `run-${event.id}`, email: event.email, events: [event] });
      return;
    }
    items.push({ kind: 'event', id: `event-${event.id}`, email: event.email, events: [event] });
  });
  // A "run" of one view is just an event
  return items.map((item) => (item.kind === 'run' && item.events.length === 1 ? { ...item, kind: 'event' } : item));
};

// Consecutive views of the same photo collapse into one frame with a count.
export const filmstripFrames = (events) => {
  const frames = [];
  events.filter((e) => e.action === 'view_image').forEach((e) => {
    const prev = frames[frames.length - 1];
    if (prev && prev.imageId === e.image_id) prev.count += 1;
    else frames.push({ key: e.id, imageId: e.image_id, filename: e.image_filename, time: e.time, count: 1 });
  });
  return frames;
};

export const dailySeries = (events, days = 30) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const series = Array.from({ length: days }, (_, i) => {
    // Calendar arithmetic (not 24h steps) so DST changes never skip a day
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - i));
    return { key: localDayKey(date), date, access: 0, view_image: 0, download_gallery: 0, total: 0 };
  });
  const byKey = new Map(series.map((d) => [d.key, d]));
  events.forEach((e) => {
    const day = byKey.get(localDayKey(new Date(e.time)));
    if (!day) return;
    if (e.action in day) day[e.action] += 1;
    day.total += 1;
  });
  return series;
};

export const topImages = (events, limit = 5) => {
  const byImage = new Map();
  events.filter((e) => e.action === 'view_image' && e.image_id).forEach((e) => {
    const entry = byImage.get(e.image_id) || { imageId: e.image_id, filename: e.image_filename, views: 0, viewers: new Set() };
    entry.views += 1;
    entry.viewers.add(e.email);
    byImage.set(e.image_id, entry);
  });
  return [...byImage.values()]
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
    .map((entry) => ({ ...entry, viewers: entry.viewers.size }));
};

const countSince = (events, from, to, predicate = () => true) =>
  events.filter((e) => e.time >= from && e.time < to && predicate(e)).length;

export const summarize = (events, sessions) => {
  const now = Date.now();
  const weekAgo = now - 7 * DAY_MS;
  const twoWeeksAgo = now - 14 * DAY_MS;
  const isView = (e) => e.action === 'view_image';
  const isDownload = (e) => e.action === 'download_gallery';
  const recentVisitors = new Set(events.filter((e) => e.time >= weekAgo).map((e) => e.email));
  return {
    visitors: new Set(events.map((e) => e.email)).size,
    visitorsThisWeek: recentVisitors.size,
    sessions: sessions.length,
    avgViewsPerSession: sessions.length ? Math.round(events.filter(isView).length / sessions.length) : 0,
    views: events.filter(isView).length,
    uniqueImages: new Set(events.filter(isView).map((e) => e.image_id)).size,
    viewsThisWeek: countSince(events, weekAgo, now, isView),
    viewsLastWeek: countSince(events, twoWeeksAgo, weekAgo, isView),
    downloads: events.filter(isDownload).length,
    downloadsThisWeek: countSince(events, weekAgo, now, isDownload),
    last: events[events.length - 1] || null,
  };
};
