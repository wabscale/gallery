import { useState, useEffect, useCallback } from 'react';
import {
  Paper, Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  TablePagination, AvatarGroup, Tooltip, IconButton
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Download, Login, Visibility, CloudDownload, Close, Groups } from '@mui/icons-material';
import { galleriesAPI } from '../../services/api';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ListShell, ListHeader, HeaderCell, ListRow, Cell, InitialsAvatar, SkeletonRows, EmptyState } from './common/DataList';
import { formatRelative, formatDateTime } from './common/format';

const ACTIONS = {
  access: { label: 'Accessed gallery', icon: <Login />, color: 'primary' },
  view_image: { label: 'Viewed image', icon: <Visibility />, color: 'primary' },
  download_gallery: { label: 'Downloaded gallery', icon: <CloudDownload />, color: 'secondary' },
};

const actionInfo = (action) => ACTIONS[action] || { label: action, icon: <Visibility />, color: 'primary' };

const LOG_TEMPLATE = {
  xs: '36px minmax(0, 1fr) auto',
  md: '36px minmax(0, 1.5fr) 190px minmax(0, 1.2fr) 120px 110px',
};

const ActionPill = ({ action }) => {
  const { label, icon, color } = actionInfo(action);
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1,
        py: 0.25,
        borderRadius: 5,
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        color: `${color}.main`,
        bgcolor: (theme) => alpha(theme.palette[color].main, 0.1),
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette[color].main, 0.3),
        '& svg': { fontSize: 14 },
      }}
    >
      {icon}{label}
    </Box>
  );
};

const LogRow = ({ log }) => (
  <ListRow template={LOG_TEMPLATE}>
    <InitialsAvatar name={log.email} size={32} />
    <Cell>
      <Typography variant="body2" fontWeight={600} noWrap>{log.email}</Typography>
      <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mt: 0.5, minWidth: 0 }}>
        <ActionPill action={log.action} />
        {log.image_filename && (
          <Typography variant="caption" color="text.secondary" noWrap>{log.image_filename}</Typography>
        )}
      </Box>
    </Cell>
    <Cell hideBelow="md"><ActionPill action={log.action} /></Cell>
    <Cell hideBelow="md">
      <Typography variant="body2" color="text.secondary" noWrap>{log.image_filename || '-'}</Typography>
    </Cell>
    <Cell hideBelow="md">
      <Typography variant="body2" color="text.secondary" noWrap sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
        {log.ip_address || '-'}
      </Typography>
    </Cell>
    <Cell align="right" sx={{ alignSelf: { xs: 'start', md: 'center' } }}>
      <Tooltip title={formatDateTime(log.created_at)} placement="top-end">
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {formatRelative(log.created_at)}
        </Typography>
      </Tooltip>
    </Cell>
  </ListRow>
);

const exportCsv = async (galleryId) => {
  let allLogs = [];
  let currentPage = 1;
  let hasMore = true;
  while (hasMore) {
    const response = await galleriesAPI.getAccessLogs(galleryId, currentPage, 200);
    allLogs = allLogs.concat(response.data.logs);
    hasMore = allLogs.length < response.data.total;
    currentPage++;
  }
  const header = 'Email,Action,Image,IP Address,Date';
  const rows = allLogs.map((log) => [
    `"${log.email}"`,
    `"${actionInfo(log.action).label}"`,
    `"${log.image_filename || ''}"`,
    `"${log.ip_address || ''}"`,
    `"${log.created_at}"`,
  ].join(','));
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `access-logs-${galleryId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const useAccessLogs = (galleryId) => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await galleriesAPI.getAccessLogs(galleryId, page + 1, rowsPerPage);
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [galleryId, page, rowsPerPage]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return { logs, total, page, setPage, rowsPerPage, setRowsPerPage, loading };
};

// Logs arrive newest first, so the first page gives the most recent visitors.
const recentVisitors = (logs) => [...new Set(logs.map((l) => l.email))].slice(0, 5);

const AccessSummary = ({ total, logs, onExport, onOpen }) => (
  <Paper
    sx={{
      p: 2,
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 2,
      border: '1px solid',
      borderColor: (theme) => alpha(theme.palette.primary.main, 0.15),
    }}
  >
    <Box
      sx={{
        display: 'flex', p: 1.25, borderRadius: 2, color: 'primary.main',
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
      }}
    >
      <Groups />
    </Box>
    <Box sx={{ flex: '1 1 160px', minWidth: 0 }}>
      <Typography variant="subtitle1" fontWeight={600}>Visitor Access Logs</Typography>
      <Typography variant="body2" color="text.secondary">
        {total.toLocaleString()} {total === 1 ? 'event' : 'events'}
        {logs[0] && ` \u00b7 last activity ${formatRelative(logs[0].created_at)}`}
      </Typography>
    </Box>
    {logs.length > 0 && (
      <Tooltip title={`Recent: ${recentVisitors(logs).join(', ')}`}>
        <AvatarGroup max={5} spacing={2} sx={{ '& .MuiAvatar-root': { borderColor: 'background.paper' } }}>
          {recentVisitors(logs).map((email) => <InitialsAvatar key={email} name={email} size={30} />)}
        </AvatarGroup>
      </Tooltip>
    )}
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button size="small" startIcon={<Download />} onClick={onExport} disabled={total === 0}>CSV</Button>
      <Button size="small" variant="outlined" onClick={onOpen} disabled={total === 0}>View</Button>
    </Box>
  </Paper>
);

const AccessLogs = ({ galleryId }) => {
  const { logs, total, page, setPage, rowsPerPage, setRowsPerPage, loading } = useAccessLogs(galleryId);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      <AccessSummary total={total} logs={logs} onExport={() => exportCsv(galleryId)} onOpen={() => setOpen(true)} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            Visitor Access Logs
            <Typography variant="body2" color="text.secondary">{total.toLocaleString()} events</Typography>
          </Box>
          <Button size="small" startIcon={<Download />} onClick={() => exportCsv(galleryId)}>
            {isMobile ? 'CSV' : 'Export CSV'}
          </Button>
          <IconButton onClick={() => setOpen(false)} aria-label="Close"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <ListShell>
            <ListHeader template={LOG_TEMPLATE.md}>
              <span />
              <HeaderCell>Visitor</HeaderCell>
              <HeaderCell>Action</HeaderCell>
              <HeaderCell>Image</HeaderCell>
              <HeaderCell>IP</HeaderCell>
              <HeaderCell align="right">When</HeaderCell>
            </ListHeader>
            {loading && logs.length === 0 && <SkeletonRows count={6} />}
            {!loading && logs.length === 0 && <EmptyState icon={<Groups />} title="No visits yet" />}
            {logs.map((log) => <LogRow key={log.id} log={log} />)}
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage={isMobile ? 'Rows' : 'Rows per page'}
            />
          </ListShell>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AccessLogs;
