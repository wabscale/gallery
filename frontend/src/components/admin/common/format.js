// Timestamps are stored in UTC. The API sends them with an offset, but older
// responses (and any endpoint that slips through) may omit it; JavaScript
// would then read the string as local time and shift it by the UTC offset.
// Always parse server timestamps through here so they display in local time.
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

export const parseServerDate = (iso) => {
  if (iso instanceof Date) return iso;
  if (typeof iso !== 'string') return new Date(iso);
  return new Date(HAS_ZONE.test(iso) || !iso.includes('T') ? iso : `${iso}Z`);
};

export const serverTime = (iso) => parseServerDate(iso).getTime();

const UNITS = [
  { limit: 60, div: 1, unit: 'second' },
  { limit: 3600, div: 60, unit: 'minute' },
  { limit: 86400, div: 3600, unit: 'hour' },
  { limit: 604800, div: 86400, unit: 'day' },
  { limit: 2629800, div: 604800, unit: 'week' },
  { limit: 31557600, div: 2629800, unit: 'month' },
  { limit: Infinity, div: 31557600, unit: 'year' },
];

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export const formatRelative = (iso) => {
  // Clamp small clock skew so a just-logged event never reads "in 3 seconds"
  const seconds = Math.min(0, (serverTime(iso) - Date.now()) / 1000);
  if (seconds > -45) return 'just now';
  const { div, unit } = UNITS.find(({ limit }) => Math.abs(seconds) < limit);
  return relativeFormatter.format(Math.round(seconds / div), unit);
};

export const formatDateTime = (iso) => parseServerDate(iso).toLocaleString(undefined, {
  year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

export const formatDate = (iso) => parseServerDate(iso).toLocaleDateString(undefined, {
  year: 'numeric', month: 'short', day: 'numeric',
});

export const formatTime = (iso) => parseServerDate(iso).toLocaleTimeString(undefined, {
  hour: 'numeric', minute: '2-digit',
});

export const formatDuration = (ms) => {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

// YYYY-MM-DD for the viewer's local calendar day.
export const localDayKey = (date) => {
  const d = date instanceof Date ? date : parseServerDate(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const viewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
