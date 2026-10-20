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
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const { div, unit } = UNITS.find(({ limit }) => Math.abs(seconds) < limit);
  return relativeFormatter.format(Math.round(seconds / div), unit);
};

export const formatDateTime = (iso) => new Date(iso).toLocaleString();

export const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, {
  year: 'numeric', month: 'short', day: 'numeric',
});
