import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { EmojiEvents } from '@mui/icons-material';
import { SectionCard } from '../details/fields';
import { PhotoThumb } from './actionMeta';

const RankRow = ({ entry, rank, max, galleryId }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, '&:not(:last-of-type)': { borderBottom: '1px solid', borderColor: 'divider' } }}>
    <Typography variant="caption" fontWeight={700} sx={{ width: 14, textAlign: 'center', color: rank === 1 ? 'primary.main' : 'text.disabled' }}>
      {rank}
    </Typography>
    <PhotoThumb galleryId={galleryId} imageId={entry.imageId} size={40} radius={1} />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
        <Typography variant="body2" fontWeight={600} noWrap>{entry.filename || 'Deleted photo'}</Typography>
        <Typography variant="caption" fontWeight={700} sx={{ flexShrink: 0 }}>{entry.views}</Typography>
      </Box>
      <Box sx={{ mt: 0.75, height: 4, borderRadius: 2, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), overflow: 'hidden' }}>
        <Box
          sx={{
            width: `${(entry.views / max) * 100}%`,
            height: '100%',
            borderRadius: 2,
            bgcolor: 'primary.main',
            boxShadow: (theme) => `0 0 6px ${theme.palette.primary.main}`,
          }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.25 }}>
        {entry.viewers} {entry.viewers === 1 ? 'visitor' : 'visitors'}
      </Typography>
    </Box>
  </Box>
);

const TopImages = ({ top, galleryId }) => (
  <SectionCard icon={<EmojiEvents />} title="Most viewed" subtitle="Photos visitors lingered on" sx={{ height: '100%' }}>
    {top.length === 0 ? (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No photo views yet</Typography>
    ) : (
      <Box sx={{ mt: -1, mb: -1 }}>
        {top.map((entry, i) => <RankRow key={entry.imageId} entry={entry} rank={i + 1} max={top[0].views} galleryId={galleryId} />)}
      </Box>
    )}
  </SectionCard>
);

export default TopImages;
