import { useState, useCallback } from 'react';
import { Box, Typography, Paper, LinearProgress, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { CloudUpload, CheckCircle, Error, Delete } from '@mui/icons-material';
import { imagesAPI } from '../../services/api';

const ImageUploader = ({ galleryId, onUploadComplete }) => {
  const [uploadQueue, setUploadQueue] = useState([]);

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

    newUploads.forEach(upload => {
      uploadFile(upload);
    });
  };

  const uploadFile = async (upload) => {
    updateUploadStatus(upload.id, { status: 'uploading', progress: 0 });

    try {
      await imagesAPI.upload(
        galleryId,
        upload.file,
        (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          updateUploadStatus(upload.id, { progress });
        }
      );

      updateUploadStatus(upload.id, { status: 'completed', progress: 100 });

      if (onUploadComplete) {
        setTimeout(() => onUploadComplete(), 500);
      }
    } catch (err) {
      updateUploadStatus(upload.id, {
        status: 'error',
        error: err.response?.data?.error || 'Upload failed'
      });
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
          <Typography variant="h6" gutterBottom>
            Upload Queue ({uploadQueue.filter(u => u.status === 'completed').length} / {uploadQueue.length})
          </Typography>
          <List>
            {uploadQueue.map(upload => (
              <ListItem key={upload.id} secondaryAction={
                upload.status === 'completed' && (
                  <IconButton edge="end" onClick={() => removeUpload(upload.id)}>
                    <Delete />
                  </IconButton>
                )
              }>
                {getStatusIcon(upload.status)}
                <ListItemText
                  primary={upload.file.name}
                  secondary={
                    <>
                      {upload.status === 'error' && upload.error}
                      {upload.status === 'uploading' && (
                        <LinearProgress variant="determinate" value={upload.progress} sx={{ mt: 1 }} />
                      )}
                      {upload.status === 'completed' && 'Upload complete'}
                      {upload.status === 'queued' && 'Queued'}
                    </>
                  }
                  sx={{ ml: 2 }}
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
