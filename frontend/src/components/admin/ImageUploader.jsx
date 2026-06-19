import { useState, useCallback, useRef } from 'react';
import { Box, Typography, Paper, LinearProgress, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { CloudUpload, CheckCircle, Error, Delete } from '@mui/icons-material';
import { imagesAPI } from '../../services/api';

const ImageUploader = ({ galleryId, onUploadComplete }) => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const activeUploadsRef = useRef(0);

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

  const uploadFiles = (files) => {
    const newUploads = files.map(file => ({
      id: Math.random().toString(36),
      file,
      progress: 0,
      status: 'queued',
      error: null
    }));

    setUploadQueue(prev => [...prev, ...newUploads]);
    activeUploadsRef.current += newUploads.length;

    newUploads.forEach(upload => {
      uploadFile(upload);
    });
  };

  const onFileFinished = () => {
    activeUploadsRef.current -= 1;
    if (activeUploadsRef.current <= 0 && onUploadComplete) {
      activeUploadsRef.current = 0;
      onUploadComplete();
    }
  };

  const uploadFile = async (upload) => {
    updateUploadStatus(upload.id, { status: 'uploading', progress: 0 });

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
      updateUploadStatus(upload.id, {
        status: 'error',
        error: err.response?.data?.error || 'Upload failed'
      });
      onFileFinished();
    }
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
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return <CloudUpload />;
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
            {uploadQueue.every(u => u.status === 'completed' || u.status === 'error') && (
              <IconButton size="small" onClick={() => setUploadQueue([])}>
                <Delete fontSize="small" />
              </IconButton>
            )}
          </Box>
          <List sx={{ maxHeight: 300, overflow: 'auto' }} dense>
            {uploadQueue.map(upload => (
              <ListItem key={upload.id} sx={{ py: 0.5 }} secondaryAction={
                (upload.status === 'completed' || upload.status === 'error') && (
                  <IconButton edge="end" size="small" onClick={() => removeUpload(upload.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                )
              }>
                {getStatusIcon(upload.status)}
                <ListItemText
                  primary={upload.file.name}
                  primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                  secondary={
                    <>
                      {upload.status === 'error' && upload.error}
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
