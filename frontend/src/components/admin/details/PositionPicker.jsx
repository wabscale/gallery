import { Box, ButtonBase, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { SouthEast, SouthWest } from '@mui/icons-material';
import { FieldLabel } from './fields';

// Corner and center placements on a 3x3 grid; empty slots are spacers.
const GRID = ['top_left', null, 'top_right', null, 'center', null, 'bottom_left', null, 'bottom_right'];

const LABELS = {
  top_left: 'Top Left',
  top_right: 'Top Right',
  center: 'Center',
  bottom_left: 'Bottom Left',
  bottom_right: 'Bottom Right',
};

const DIAGONALS = [
  { value: 'diagonal_lr', icon: <SouthEast />, title: 'Diagonal (top-left to bottom-right)', line: [0, 0, 100, 100] },
  { value: 'diagonal_rl', icon: <SouthWest />, title: 'Diagonal (top-right to bottom-left)', line: [100, 0, 0, 100] },
];

const DiagonalLine = ({ line }) => (
  <Box component="svg" viewBox="0 0 100 100" preserveAspectRatio="none"
    sx={{ position: 'absolute', inset: 8, width: 'calc(100% - 16px)', height: 'calc(100% - 16px)', color: 'primary.main', pointerEvents: 'none' }}>
    <line x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} stroke="currentColor" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.8" />
  </Box>
);

const Cell = ({ position, selected, onSelect }) => (
  <Tooltip title={LABELS[position]}>
    <ButtonBase
      onClick={() => onSelect(position)}
      aria-label={LABELS[position]}
      aria-pressed={selected}
      sx={{
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '@media (hover: hover)': { '&:hover .mark': { bgcolor: (theme) => alpha(theme.palette.primary.main, selected ? 1 : 0.45) } },
        '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main' },
      }}
    >
      <Box
        className="mark"
        sx={{
          width: selected ? '70%' : 10,
          height: selected ? '38%' : 10,
          borderRadius: selected ? 0.75 : '50%',
          bgcolor: (theme) => (selected ? theme.palette.primary.main : alpha(theme.palette.text.secondary, 0.35)),
          boxShadow: (theme) => (selected ? `0 0 10px ${alpha(theme.palette.primary.main, 0.6)}` : 'none'),
          transition: 'all 0.2s ease',
        }}
      />
    </ButtonBase>
  </Tooltip>
);

const DiagonalButton = ({ option, selected, onSelect }) => (
  <Tooltip title={option.title}>
    <ButtonBase
      onClick={() => onSelect(option.value)}
      aria-label={option.title}
      aria-pressed={selected}
      sx={{
        gap: 0.5,
        py: 0.75,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: (theme) => (selected ? theme.palette.primary.main : alpha(theme.palette.text.secondary, 0.25)),
        bgcolor: (theme) => (selected ? alpha(theme.palette.primary.main, 0.1) : 'transparent'),
        color: selected ? 'primary.main' : 'text.secondary',
        '& svg': { fontSize: 16 },
      }}
    >
      {option.icon}
      <Typography variant="caption" fontWeight={600} sx={{ display: { xs: 'none', sm: 'inline' } }}>Diagonal</Typography>
    </ButtonBase>
  </Tooltip>
);

const PositionPicker = ({ label, value, onChange }) => {
  const diagonal = DIAGONALS.find((d) => d.value === value);
  return (
    <Box>
      <FieldLabel>{label}</FieldLabel>
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '4 / 3',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: 0.5,
          p: 0.75,
          borderRadius: 1.5,
          border: '1px dashed',
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.35),
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
        }}
      >
        {diagonal && <DiagonalLine line={diagonal.line} />}
        {GRID.map((pos, i) => (pos
          ? <Cell key={pos} position={pos} selected={value === pos} onSelect={onChange} />
          : <span key={i} />))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75, mt: 0.75 }}>
        {DIAGONALS.map((d) => <DiagonalButton key={d.value} option={d} selected={value === d.value} onSelect={onChange} />)}
      </Box>
    </Box>
  );
};

export default PositionPicker;
