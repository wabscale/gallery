import { useState } from 'react';
import {
  Box, TextField, InputAdornment, IconButton, ToggleButton, ToggleButtonGroup, Tooltip,
  Button, Menu, MenuItem, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Search, Close, GridView, Apps, MoreVert, Refresh, BrandingWatermark, DeleteSweep
} from '@mui/icons-material';
import { useIsMobile } from '../../../hooks/useIsMobile';

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
    placeholder="Search by filename"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    sx={{ flex: { xs: '1 1 120px', sm: '1 1 220px' }, minWidth: 0, order: 0 }}
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

const BulkActionsMenu = ({ watermarkEnabled, onAction }) => {
  const isMobile = useIsMobile();
  const [anchor, setAnchor] = useState(null);
  const run = (action) => () => {
    setAnchor(null);
    onAction(action);
  };

  return (
    <>
      {isMobile ? (
        <IconButton
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label="Bulk actions"
          sx={{ order: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, width: 40, height: 40 }}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      ) : (
        <Button variant="outlined" endIcon={<MoreVert />} onClick={(e) => setAnchor(e.currentTarget)} sx={{ order: 4, height: 40 }}>
          Actions
        </Button>
      )}
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem onClick={run('thumbnails')}>
          <ListItemIcon><Refresh fontSize="small" /></ListItemIcon>
          <ListItemText>Regenerate thumbnails</ListItemText>
        </MenuItem>
        {watermarkEnabled && (
          <MenuItem onClick={run('watermarks')}>
            <ListItemIcon><BrandingWatermark fontSize="small" /></ListItemIcon>
            <ListItemText>Regenerate watermarks</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={run('deleteAll')} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteSweep fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete all photos</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

// Phones: search, density and actions on the first line, filter below.
// Wider screens: everything on one line.
const PhotoToolbar = ({ search, onSearch, filter, onFilter, counts, density, onDensity, watermarkEnabled, onAction }) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
    <SearchField value={search} onChange={onSearch} />
    <ToggleButtonGroup
      exclusive
      size="small"
      value={filter}
      onChange={(_, v) => v && onFilter(v)}
      sx={{
        ...toggleSx,
        order: { xs: 3, sm: 1 },
        flex: { xs: '1 1 100%', sm: '0 0 auto' },
        '& .MuiToggleButton-root': { ...toggleSx['& .MuiToggleButton-root'], flex: { xs: 1, sm: 'none' } },
      }}
    >
      <ToggleButton value="all">All <Count value={counts.all} /></ToggleButton>
      <ToggleButton value="visible">Visible <Count value={counts.visible} /></ToggleButton>
      <ToggleButton value="hidden">Hidden <Count value={counts.hidden} /></ToggleButton>
    </ToggleButtonGroup>
    <ToggleButtonGroup
      exclusive
      size="small"
      value={density}
      onChange={(_, v) => v && onDensity(v)}
      sx={{ ...toggleSx, order: { xs: 1, sm: 3 } }}
    >
      <ToggleButton value="comfortable" aria-label="Large tiles">
        <Tooltip title="Large tiles"><GridView fontSize="small" /></Tooltip>
      </ToggleButton>
      <ToggleButton value="compact" aria-label="Small tiles">
        <Tooltip title="Small tiles"><Apps fontSize="small" /></Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
    <BulkActionsMenu watermarkEnabled={watermarkEnabled} onAction={onAction} />
  </Box>
);

export default PhotoToolbar;
