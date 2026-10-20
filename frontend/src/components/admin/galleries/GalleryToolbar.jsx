import { useState } from 'react';
import {
  Box, TextField, InputAdornment, IconButton, ToggleButton, ToggleButtonGroup, MenuItem, Menu, Tooltip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Search, Close, ViewList, GridView, Sort, Check } from '@mui/icons-material';
import { useIsMobile } from '../../../hooks/useIsMobile';

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'photos', label: 'Most photos' },
];

const toggleSx = {
  '& .MuiToggleButton-root': {
    textTransform: 'none',
    height: 40,
    px: 1.5,
    gap: 0.75,
    whiteSpace: 'nowrap',
  },
  '& .MuiToggleButton-root.Mui-selected': {
    color: 'primary.main',
    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
  },
};

const Count = ({ value }) => (
  <Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.7 }}>{value}</Box>
);

const SearchField = ({ value, onChange }) => (
  <TextField
    size="small"
    placeholder="Search by name or slug"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    sx={{ flex: '1 1 260px', order: 0 }}
    slotProps={{
      input: {
        startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
        endAdornment: value && (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => onChange('')} aria-label="Clear search">
              <Close fontSize="small" />
            </IconButton>
          </InputAdornment>
        ),
      },
    }}
  />
);

// Full select on wider screens; a compact icon menu on phones so the
// filter buttons keep the whole row.
const SortControl = ({ value, onChange }) => {
  const isMobile = useIsMobile();
  const [anchor, setAnchor] = useState(null);

  if (!isMobile) {
    return (
      <TextField
        select
        size="small"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{ order: 2, minWidth: 136 }}
        slotProps={{ htmlInput: { 'aria-label': 'Sort galleries' } }}
      >
        {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
      </TextField>
    );
  }

  return (
    <>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label="Sort galleries"
        sx={{ order: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1, width: 40, height: 40 }}
      >
        <Sort fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {SORT_OPTIONS.map((o) => (
          <MenuItem key={o.value} selected={o.value === value} onClick={() => { onChange(o.value); setAnchor(null); }}>
            <Box component="span" sx={{ width: 28, display: 'inline-flex' }}>
              {o.value === value && <Check fontSize="small" color="primary" />}
            </Box>
            {o.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

// On phones the order puts search + view toggle on the first line and
// filter + sort on the second; on desktop everything sits on one line.
const GalleryToolbar = ({ search, onSearch, filter, onFilter, counts, sort, onSort, view, onView }) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2 }}>
    <SearchField value={search} onChange={onSearch} />
    <ToggleButtonGroup
      exclusive
      size="small"
      value={filter}
      onChange={(_, v) => v && onFilter(v)}
      sx={{ ...toggleSx, order: { xs: 2, md: 1 }, flex: { xs: '1 1 auto', md: '0 0 auto' }, '& .MuiToggleButton-root': { ...toggleSx['& .MuiToggleButton-root'], flex: { xs: 1, md: 'none' } } }}
    >
      <ToggleButton value="all">All <Count value={counts.all} /></ToggleButton>
      <ToggleButton value="public">Public <Count value={counts.public} /></ToggleButton>
      <ToggleButton value="private">Private <Count value={counts.private} /></ToggleButton>
    </ToggleButtonGroup>
    <SortControl value={sort} onChange={onSort} />
    <ToggleButtonGroup
      exclusive
      size="small"
      value={view}
      onChange={(_, v) => v && onView(v)}
      sx={{ ...toggleSx, order: { xs: 1, md: 3 } }}
    >
      <ToggleButton value="list" aria-label="List view">
        <Tooltip title="List view"><ViewList fontSize="small" /></Tooltip>
      </ToggleButton>
      <ToggleButton value="grid" aria-label="Grid view">
        <Tooltip title="Grid view"><GridView fontSize="small" /></Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  </Box>
);

export default GalleryToolbar;
