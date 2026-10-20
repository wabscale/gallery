import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { galleriesAPI } from '../../../services/api';
import { normalizeLogs, buildSessions, summarize, dailySeries, topImages } from './activityModel';
import { actionInfo } from './actionMeta';

const PAGE_SIZE = 1000;
// Enough history for meaningful charts without pulling an unbounded log
export const MAX_EVENTS = 5000;

const fetchRecentLogs = async (galleryId) => {
  let logs = [];
  let total = 0;
  for (let page = 1; logs.length < MAX_EVENTS; page++) {
    const response = await galleriesAPI.getAccessLogs(galleryId, page, PAGE_SIZE);
    logs = logs.concat(response.data.logs);
    total = response.data.total;
    if (logs.length >= total || response.data.logs.length === 0) break;
  }
  return { logs, total };
};

// Loads lazily the first time the tab is opened, then on demand.
export const useActivityLog = (galleryId, active) => {
  const [raw, setRaw] = useState({ logs: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const loadedRef = useRef(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRaw(await fetchRecentLogs(galleryId));
      loadedRef.current = true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load visitor activity');
    } finally {
      setLoading(false);
    }
  }, [galleryId]);

  useEffect(() => {
    if (active && !loadedRef.current) reload();
  }, [active, reload]);

  const model = useMemo(() => {
    const events = normalizeLogs(raw.logs);
    const sessions = buildSessions(events);
    return {
      events,
      sessions,
      stats: summarize(events, sessions),
      daily: dailySeries(events),
      top: topImages(events),
    };
  }, [raw.logs]);

  return { ...model, total: raw.total, truncated: raw.total > raw.logs.length, loading, loaded: loadedRef.current, error, reload };
};

export const exportActivityCsv = (galleryId, events) => {
  const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const header = 'Email,Action,Image,IP Address,Date (UTC),Date (local)';
  const rows = [...events].reverse().map((e) => [
    quote(e.email),
    quote(actionInfo(e.action).label),
    quote(e.image_filename),
    quote(e.ip_address),
    quote(new Date(e.time).toISOString()),
    quote(new Date(e.time).toLocaleString()),
  ].join(','));
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `visitor-activity-${galleryId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
