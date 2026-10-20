import { Box, TextField, InputAdornment, IconButton, ToggleButton, ToggleButtonGroup, Tooltip, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Search, Close, Refresh, Download, ViewAgenda, Timeline } from '@mui/icons-material';

const toggleSx = {
  '& .MuiToggleButton-root': { textTransform: 'none', height: 40, px: 1.5, gap: 0.75, whiteSpace: 'nowrap' },
  '& .MuiToggleButton-root.Mui-selected': { color: 'primary.main', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12) },
};

const ACTION_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'view_image', label: 'Views' },
  { value: 'access', label: 'Opens' },
  { value: 'download_gallery', label: 'Downloads' },
];

const ActivityToolbar = ({ search, onSearch, view, onView, action, onAction, loading, onRefresh, onExport }) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
    <TextField
      size="small"
      placeholder="Search visitors by email"
      value={search}
      onChange={(e) => onSearch(e.target.value)}
      sx={{ flex: '1 1 240px' }}
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
          endAdornment: search && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onSearch('')} aria-label="Clear search"><Close fontSize="small" /></IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
    <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v) => v && onView(v)}
      sx={{ ...toggleSx, flex: { xs: '1 1 auto', md: '0 0 auto' }, order: { xs: 1, md: 0 },
        '& .MuiToggleButton-root': { ...toggleSx['& .MuiToggleButton-root'], flex: { xs: 1, md: 'none' } },
        '& .MuiToggleButton-root svg': { display: { xs: 'none', sm: 'block' } } }}>
      <ToggleButton value="sessions"><ViewAgenda fontSize="small" />Sessions</ToggleButton>
      <ToggleButton value="timeline"><Timeline fontSize="small" />Timeline</ToggleButton>
    </ToggleButtonGroup>
    {view === 'timeline' && (
      <ToggleButtonGroup exclusive size="small" value={action} onChange={(_, v) => v && onAction(v)}
        sx={{ ...toggleSx, flex: { xs: '1 1 100%', md: '0 0 auto' }, order: { xs: 3, md: 0 }, '& .MuiToggleButton-root': { ...toggleSx['& .MuiToggleButton-root'], flex: { xs: 1, md: 'none' } } }}>
        {ACTION_FILTERS.map((f) => <ToggleButton key={f.value} value={f.value}>{f.label}</ToggleButton>)}
      </ToggleButtonGroup>
    )}
    <Box sx={{ display: 'flex', gap: 1, ml: { md: 'auto' }, order: { xs: 2, md: 0 } }}>
      <Tooltip title="Refresh">
        <span>
          <IconButton onClick={onRefresh} disabled={loading} aria-label="Refresh activity"
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, width: 40, height: 40 }}>
            <Refresh fontSize="small" sx={{ animation: loading ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
          </IconButton>
        </span>
      </Tooltip>
      <Button variant="outlined" onClick={onExport} aria-label="Export CSV"
        sx={{ height: 40, minWidth: 40, px: { xs: 0, sm: 2 }, gap: 1 }}>
        <Download fontSize="small" />
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>CSV</Box>
      </Button>
    </Box>
  </Box>
);

export default ActivityToolbar;
