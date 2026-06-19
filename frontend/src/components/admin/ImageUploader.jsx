import { useState, useCallback, useRef } from 'react';
import { Box, Typography, Paper, LinearProgress, List, ListItem, ListItemText, IconButton, Tooltip } from '@mui/material';
import { CloudUpload, CheckCircle, Error, Delete, Replay } from '@mui/icons-material';
import { imagesAPI } from '../../services/api';

const MAX_RETRIES = 3;
const MAX_CONCURRENT = 5;

const ImageUploader = ({ galleryId, onUploadComplete }) => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const activeUploadsRef = useRef(0);
  const pendingQueueRef = useRef([]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );
    uploadFiles(files);
  }, [galleryId]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    uploadFiles(files);
  };

  const processNext = () => {
    while (activeUploadsRef.current < MAX_CONCURRENT && pendingQueueRef.current.length > 0) {
      const next = pendingQueueRef.current.shift();
      activeUploadsRef.current += 1;
      uploadFile(next);
    }
  };

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
      await imagesAPI.upload(
        galleryId,
        upload.file,
        (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          updateUploadStatus(upload.id, { progress });
        }
      );

      updateUploadStatus(upload.id, { status: 'completed', progress: 100 });
      onFileFinished();
    } catch (err) {
      if (attempt < MAX_RETRIES && (!err.response || err.response.status >= 500)) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        updateUploadStatus(upload.id, { status: 'retrying', progress: 0, error: `Retry ${attempt}/${MAX_RETRIES}...` });
        setTimeout(() => uploadFile(upload, attempt + 1), delay);
      } else {
        updateUploadStatus(upload.id, {
          status: 'error',
          error: err.response?.data?.error || 'Upload failed'
        });
        onFileFinished();
      }
    }
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

  const updateUploadStatus = (id, updates) => {
    setUploadQueue(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeUpload = (id) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" fontSize="small" />;
      case 'error':
        return <Error color="error" fontSize="small" />;
      case 'retrying':
        return <Replay color="warning" fontSize="small" />;
      default:
        return <CloudUpload fontSize="small" />;
    }
  };

  return (
    <Box>
      <Paper
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed #ccc',
          cursor: 'pointer',
          '&:hover': { borderColor: 'primary.main' }
        }}
        onClick={() => document.getElementById('file-input').click()}
      >
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drop images here or click to browse
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supports JPG, PNG, GIF, WebP
        </Typography>
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Paper>

      {uploadQueue.length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">
              Upload Queue ({uploadQueue.filter(u => u.status === 'completed').length} / {uploadQueue.length})
            </Typography>
            <Box display="flex" gap={0.5}>
              {uploadQueue.some(u => u.status === 'error') && (
                <Tooltip title="Retry All Failed">
                  <IconButton size="small" onClick={retryAll}>
                    <Replay fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {uploadQueue.every(u => u.status === 'completed' || u.status === 'error') && (
                <Tooltip title="Clear All">
                  <IconButton size="small" onClick={() => setUploadQueue([])}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
          <List sx={{ maxHeight: 300, overflow: 'auto' }} dense>
            {uploadQueue.map(upload => (
              <ListItem key={upload.id} sx={{ py: 0.5 }} secondaryAction={
                <Box display="flex" gap={0.5}>
                  {upload.status === 'error' && (
                    <Tooltip title="Retry">
                      <IconButton edge="end" size="small" onClick={() => retryUpload(upload)}>
                        <Replay fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {(upload.status === 'completed' || upload.status === 'error') && (
                    <IconButton edge="end" size="small" onClick={() => removeUpload(upload.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              }>
                {getStatusIcon(upload.status)}
                <ListItemText
                  primary={upload.file.name}
                  primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                  secondary={
                    <>
                      {upload.status === 'error' && upload.error}
                      {upload.status === 'retrying' && upload.error}
                      {upload.status === 'uploading' && (
                        <LinearProgress variant="determinate" value={upload.progress} sx={{ mt: 0.5 }} />
                      )}
                      {upload.status === 'completed' && 'Done'}
                      {upload.status === 'queued' && 'Queued'}
                    </>
                  }
                  secondaryTypographyProps={{ variant: 'caption' }}
                  sx={{ ml: 1.5 }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default ImageUploader;
