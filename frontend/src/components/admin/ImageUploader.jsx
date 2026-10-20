import { useState, useRef } from 'react';
import { Box, Typography, LinearProgress, IconButton, Tooltip, Button, ButtonBase } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CloudUpload, CheckCircle, ErrorOutline, Replay, Close, Schedule, DeleteSweep } from '@mui/icons-material';
import { imagesAPI } from '../../services/api';
import { useIsTouch } from '../../hooks/useIsMobile';
import { ListShell } from './common/DataList';

const MAX_RETRIES = 3;
const MAX_CONCURRENT = 5;

const isFinished = (u) => u.status === 'completed' || u.status === 'error';

const useUploadQueue = (galleryId, onUploadComplete) => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const activeUploadsRef = useRef(0);
  const pendingQueueRef = useRef([]);

  const updateUploadStatus = (id, updates) => {
    setUploadQueue(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const processNext = () => {
    while (activeUploadsRef.current < MAX_CONCURRENT && pendingQueueRef.current.length > 0) {
      const next = pendingQueueRef.current.shift();
      activeUploadsRef.current += 1;
      uploadFile(next);
    }
  };

  const onFileFinished = () => {
    activeUploadsRef.current -= 1;
    if (activeUploadsRef.current < 0) activeUploadsRef.current = 0;
    processNext();
    if (activeUploadsRef.current <= 0 && pendingQueueRef.current.length === 0 && onUploadComplete) {
      onUploadComplete();
    }
  };

  const uploadFile = async (upload, attempt = 1) => {
    updateUploadStatus(upload.id, { status: 'uploading', progress: 0, error: null });
    try {
      await imagesAPI.upload(galleryId, upload.file, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        updateUploadStatus(upload.id, { progress });
      });
      updateUploadStatus(upload.id, { status: 'completed', progress: 100 });
      onFileFinished();
    } catch (err) {
      if (attempt < MAX_RETRIES && (!err.response || err.response.status >= 500)) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        updateUploadStatus(upload.id, { status: 'retrying', progress: 0, error: `Retry ${attempt}/${MAX_RETRIES}...` });
        setTimeout(() => uploadFile(upload, attempt + 1), delay);
      } else {
        updateUploadStatus(upload.id, { status: 'error', error: err.response?.data?.error || 'Upload failed' });
        onFileFinished();
      }
    }
  };

  return { uploadQueue, setUploadQueue, updateUploadStatus, processNext, pendingQueueRef };
};

const useUploader = (galleryId, onUploadComplete) => {
  const { uploadQueue, setUploadQueue, updateUploadStatus, processNext, pendingQueueRef } = useUploadQueue(galleryId, onUploadComplete);

  const uploadFiles = (files) => {
    const newUploads = files.map(file => ({
      id: Math.random().toString(36),
      file,
      progress: 0,
      status: 'queued',
      error: null
    }));
    setUploadQueue(prev => [...prev, ...newUploads]);
    pendingQueueRef.current.push(...newUploads);
    processNext();
  };

  const retryUpload = (upload) => {
    updateUploadStatus(upload.id, { status: 'queued', progress: 0, error: null });
    pendingQueueRef.current.push(upload);
    processNext();
  };

  const retryAll = () => {
    setUploadQueue(prev => {
      const failed = prev.filter(u => u.status === 'error');
      failed.forEach(u => {
        u.status = 'queued';
        u.progress = 0;
        u.error = null;
        pendingQueueRef.current.push(u);
      });
      processNext();
      return [...prev];
    });
  };

  const removeUpload = (id) => setUploadQueue(prev => prev.filter(item => item.id !== id));
  const clearAll = () => setUploadQueue([]);

  return { uploadQueue, uploadFiles, retryUpload, retryAll, removeUpload, clearAll };
};

const dropZoneSx = (dragging) => ({
  width: '100%',
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },
  alignItems: 'center',
  gap: { xs: 1.5, sm: 2.5 },
  p: { xs: 2.5, sm: 3 },
  borderRadius: 2,
  textAlign: { xs: 'center', sm: 'left' },
  border: '2px dashed',
  borderColor: (theme) => alpha(theme.palette.primary.main, dragging ? 0.9 : 0.3),
  bgcolor: (theme) => alpha(theme.palette.primary.main, dragging ? 0.1 : 0.03),
  transition: 'border-color 0.2s ease, background-color 0.2s ease',
  '@media (hover: hover)': {
    '&:hover': { borderColor: 'primary.main', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06) },
  },
});

const DropIcon = ({ lifted }) => (
  <Box
    sx={{
      display: 'flex', p: 1.5, borderRadius: '50%', color: 'primary.main', flexShrink: 0,
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
      border: '1px solid', borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
      transform: lifted ? 'translateY(-3px)' : 'none',
      transition: 'transform 0.2s ease',
    }}
  >
    <CloudUpload sx={{ fontSize: 28 }} />
  </Box>
);

const DropZone = ({ onFiles }) => {
  const isTouch = useIsTouch();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    onFiles(Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/')));
  };

  return (
    <ButtonBase
      component="div"
      onClick={() => inputRef.current.click()}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setDragging(false)}
      sx={dropZoneSx(dragging)}
    >
      <DropIcon lifted={dragging} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {dragging ? 'Release to upload' : isTouch ? 'Tap to select images' : 'Drop images here or click to browse'}
        </Typography>
        <Typography variant="body2" color="text.secondary">Supports JPG, PNG, GIF, WebP</Typography>
      </Box>
      <Button variant="contained" component="span" startIcon={<CloudUpload />} sx={{ display: { xs: 'none', sm: 'inline-flex' }, flexShrink: 0 }}>
        Browse files
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: 'none' }}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onFiles(Array.from(e.target.files))}
      />
    </ButtonBase>
  );
};

const STATUS = {
  completed: { icon: <CheckCircle />, color: 'success', label: 'Done' },
  error: { icon: <ErrorOutline />, color: 'error' },
  retrying: { icon: <Replay />, color: 'warning' },
  uploading: { icon: <CloudUpload />, color: 'primary' },
  queued: { icon: <Schedule />, color: 'secondary', label: 'Queued' },
};

const QueueRow = ({ upload, onRetry, onRemove }) => {
  const { icon, color, label } = STATUS[upload.status];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: { xs: 1.5, sm: 2.5 }, py: 1, '&:not(:last-of-type)': { borderBottom: '1px solid', borderColor: 'divider' } }}>
      <Box sx={{ display: 'flex', color: `${color}.main`, '& svg': { fontSize: 20 } }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap>{upload.file.name}</Typography>
        {upload.status === 'uploading' ? (
          <LinearProgress variant="determinate" value={upload.progress} sx={{ mt: 0.75, height: 4, borderRadius: 2 }} />
        ) : (
          <Typography variant="caption" color={upload.status === 'error' ? 'error' : 'text.secondary'}>{upload.error || label}</Typography>
        )}
      </Box>
      {upload.status === 'error' && (
        <Tooltip title="Retry">
          <IconButton size="small" onClick={() => onRetry(upload)}><Replay fontSize="small" /></IconButton>
        </Tooltip>
      )}
      {isFinished(upload) && (
        <Tooltip title="Remove">
          <IconButton size="small" onClick={() => onRemove(upload.id)}><Close fontSize="small" /></IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

const UploadQueue = ({ uploadQueue, retryUpload, retryAll, removeUpload, clearAll }) => {
  const completed = uploadQueue.filter(u => u.status === 'completed').length;
  const percent = Math.round((completed / uploadQueue.length) * 100);
  return (
    <ListShell sx={{ mt: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: { xs: 1.5, sm: 2.5 }, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03) }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600}>Uploading {completed} / {uploadQueue.length}</Typography>
          <LinearProgress variant="determinate" value={percent} sx={{ mt: 0.75, height: 4, borderRadius: 2, maxWidth: 320 }} />
        </Box>
        {uploadQueue.some(u => u.status === 'error') && (
          <Button size="small" startIcon={<Replay />} onClick={retryAll}>Retry failed</Button>
        )}
        {uploadQueue.every(isFinished) && (
          <Tooltip title="Clear all">
            <IconButton size="small" onClick={clearAll} aria-label="Clear all"><DeleteSweep fontSize="small" /></IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
        {uploadQueue.map(upload => (
          <QueueRow key={upload.id} upload={upload} onRetry={retryUpload} onRemove={removeUpload} />
        ))}
      </Box>
    </ListShell>
  );
};

const ImageUploader = ({ galleryId, onUploadComplete }) => {
  const uploader = useUploader(galleryId, onUploadComplete);
  return (
    <Box>
      <DropZone onFiles={uploader.uploadFiles} />
      {uploader.uploadQueue.length > 0 && <UploadQueue {...uploader} />}
    </Box>
  );
};

export default ImageUploader;
