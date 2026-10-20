import { useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, LinearProgress
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CheckCircle, WarningAmber, Refresh, BrandingWatermark } from '@mui/icons-material';
import { imagesAPI } from '../../../services/api';
import { SwitchRow, IconTile } from './fields';

const CONCURRENT_REGEN = 3;
const EMPTY_PROGRESS = { done: 0, total: 0, failed: 0 };

const formatEta = (seconds) => {
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `${mins}m ${secs}s`;
};

// Runs `task(imageId)` over every image with a small worker pool and
// reports progress and an ETA as it goes. Failures are counted, not fatal.
const useBatchJob = (images, task) => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [eta, setEta] = useState(null);
  const [useParallel, setUseParallel] = useState(true);
  const startTimeRef = useRef(null);

  const start = async () => {
    const total = images.length;
    setRunning(true);
    setProgress({ done: 0, total, failed: 0 });
    setEta(null);
    startTimeRef.current = Date.now();

    let done = 0;
    let failed = 0;
    let i = 0;

    const processOne = async () => {
      while (true) {
        const idx = i++;
        if (idx >= total) return;
        try {
          await task(images[idx].id);
        } catch {
          failed += 1;
        }
        done += 1;
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setProgress({ done, total, failed });
        setEta((total - done) / (done / elapsed));
      }
    };

    const workerCount = useParallel ? Math.min(CONCURRENT_REGEN, total) : 1;
    await Promise.all(Array.from({ length: workerCount }, () => processOne()));

    setRunning(false);
    setEta(null);
  };

  const reset = () => setProgress(EMPTY_PROGRESS);

  return { running, progress, eta, useParallel, setUseParallel, start, reset };
};

const JobProgress = ({ running, progress, eta }) => {
  const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const complete = !running && progress.done === progress.total && progress.total > 0;

  return (
    <Box sx={{ p: 2, borderRadius: 2, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05) }}>
      <Box display="flex" justifyContent="space-between" alignItems="baseline" flexWrap="wrap" columnGap={2} mb={1.5}>
        <Typography variant="h5" fontWeight={600}>{percent}%</Typography>
        <Typography variant="body2" color="text.secondary">
          {progress.done} / {progress.total} images
          {running && eta !== null ? ` · ${formatEta(eta)} left` : ''}
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 4 }} />
      {progress.failed > 0 && (
        <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>{progress.failed} failed</Typography>
      )}
      {complete && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.5, color: 'success.main' }}>
          <CheckCircle fontSize="small" />
          <Typography variant="body2">Complete</Typography>
        </Box>
      )}
      {running && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.5, color: 'warning.main' }}>
          <WarningAmber fontSize="small" />
          <Typography variant="caption">Do not reload or navigate away from this page while processing.</Typography>
        </Box>
      )}
    </Box>
  );
};

const BatchJobDialog = ({ open, onClose, title, description, icon, images, task }) => {
  const job = useBatchJob(images, task);
  const { running, progress } = job;
  const complete = !running && progress.done === progress.total && progress.total > 0;
  const idle = !running && progress.done === 0;

  return (
    <Dialog open={open} onClose={() => !running && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <IconTile icon={icon} />
        {title}
      </DialogTitle>
      <DialogContent>
        {idle ? (
          <>
            <Typography variant="body2" color="text.secondary" mb={1}>{description}</Typography>
            <SwitchRow
              label="Use parallel processing"
              description="Disable for dense images (40MP+) to reduce memory usage"
              checked={job.useParallel}
              onChange={job.setUseParallel}
            />
          </>
        ) : (
          <JobProgress running={running} progress={progress} eta={job.eta} />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {complete ? (
          <Button variant="contained" onClick={() => { onClose(); job.reset(); }}>Close</Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={running}>Cancel</Button>
            <Button variant="contained" onClick={job.start} disabled={running}>
              {running ? 'Processing...' : 'Start'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export const RegenerateThumbnailsDialog = ({ open, onClose, galleryId, images }) => (
  <BatchJobDialog
    open={open}
    onClose={onClose}
    title="Regenerate thumbnails"
    icon={<Refresh />}
    description={`This will regenerate thumbnails for all ${images.length} images. Existing thumbnails will be replaced.`}
    images={images}
    task={(imageId) => imagesAPI.regenerateThumbnail(galleryId, imageId)}
  />
);

export const RegenerateWatermarksDialog = ({ open, onClose, galleryId, images }) => (
  <BatchJobDialog
    open={open}
    onClose={onClose}
    title="Regenerate watermarks"
    icon={<BrandingWatermark />}
    description={`This will regenerate watermarked versions for all ${images.length} images using current settings. Existing watermarked files will be replaced.`}
    images={images}
    task={(imageId) => imagesAPI.regenerateWatermark(galleryId, imageId)}
  />
);
