import { useState } from 'react';
import { Box, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { OpenInNew, ContentCopy, DeleteOutline, Edit, MoreVert } from '@mui/icons-material';

const stop = (handler) => (e) => {
  e.stopPropagation();
  handler?.();
};

const InlineActions = ({ gallery, onCopy, onDelete }) => (
  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
    <Tooltip title="Open public page">
      <IconButton
        size="small"
        component="a"
        href={`/gallery/${gallery.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        <OpenInNew fontSize="small" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Copy link">
      <IconButton size="small" onClick={stop(() => onCopy(gallery))}>
        <ContentCopy fontSize="small" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Delete">
      <IconButton
        size="small"
        onClick={stop(() => onDelete(gallery))}
        sx={{ '@media (hover: hover)': { '&:hover': { color: 'error.main' } } }}
      >
        <DeleteOutline fontSize="small" />
      </IconButton>
    </Tooltip>
  </Box>
);

const MenuActions = ({ gallery, onEdit, onCopy, onDelete }) => {
  const [anchor, setAnchor] = useState(null);
  const run = (handler) => stop(() => {
    setAnchor(null);
    handler(gallery);
  });

  return (
    <>
      <IconButton
        size="small"
        aria-label="Gallery actions"
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(e.currentTarget);
        }}
      >
        <MoreVert fontSize="small" />
      </IconButton>
      {/* The menu is portaled but React still bubbles its clicks (including the
          backdrop) up to the row, so stop them here to avoid opening the editor. */}
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} onClick={(e) => e.stopPropagation()}>
        <MenuItem onClick={run(onEdit)}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem component="a" href={`/gallery/${gallery.slug}`} target="_blank" rel="noopener noreferrer"
          onClick={() => setAnchor(null)}>
          <ListItemIcon><OpenInNew fontSize="small" /></ListItemIcon>
          <ListItemText>Open public page</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(onCopy)}>
          <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>
          <ListItemText>Copy link</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={run(onDelete)} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteOutline fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

const GalleryActions = ({ compact, ...props }) => (
  compact ? <MenuActions {...props} /> : <InlineActions {...props} />
);

export default GalleryActions;
