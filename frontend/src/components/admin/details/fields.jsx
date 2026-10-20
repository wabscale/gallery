import { useState, useEffect, useRef, memo } from 'react';
import { Box, Typography, TextField, Switch, Slider, ButtonBase } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ListShell } from '../common/DataList';

// Form building blocks for the gallery editor. Section cards share the
// ListShell frame used by the admin list pages so both feel like one app.

export const DebouncedTextField = memo(({ value: externalValue, onChange, ...props }) => {
  const [localValue, setLocalValue] = useState(externalValue);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setLocalValue(externalValue);
  }, [externalValue]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onChange(val), 300);
  };

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return <TextField value={localValue} onChange={handleChange} {...props} />;
});

export const IconTile = ({ icon, color = 'primary', size = 36 }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      width: size,
      height: size,
      borderRadius: 1.5,
      color: `${color}.main`,
      bgcolor: (theme) => alpha(theme.palette[color].main, 0.1),
      border: '1px solid',
      borderColor: (theme) => alpha(theme.palette[color].main, 0.25),
      '& svg': { fontSize: size * 0.5 },
    }}
  >
    {icon}
  </Box>
);

export const SectionCard = ({ icon, title, subtitle, action, children, flush, dense, sx }) => (
  <ListShell sx={sx}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: { xs: 2, sm: 2.5 },
        py: dense ? { xs: 1, sm: 1.75 } : 1.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
      }}
    >
      {icon && <IconTile icon={icon} />}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={600} lineHeight={1.3}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary" component="div">{subtitle}</Typography>}
      </Box>
      {action}
    </Box>
    <Box sx={{ px: { xs: 2, sm: 2.5 }, py: flush ? 0.5 : { xs: dense ? 1.5 : 2, sm: 2.5 } }}>{children}</Box>
  </ListShell>
);

export const FieldLabel = ({ children, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mb: 1 }}>
    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.5, letterSpacing: '0.08em' }}>
      {children}
    </Typography>
    {value !== undefined && (
      <Box
        component="span"
        sx={{
          px: 1,
          py: 0.125,
          borderRadius: 1,
          fontSize: '0.75rem',
          fontWeight: 600,
          fontFamily: 'monospace',
          color: 'primary.main',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
        }}
      >
        {value}
      </Box>
    )}
  </Box>
);

// The whole row is a label so tapping anywhere toggles the switch, which
// gives phones a comfortably large hit area.
export const SwitchRow = ({ icon, label, description, checked, onChange }) => (
  <Box
    component="label"
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      py: 1.5,
      cursor: 'pointer',
      '&:not(:last-of-type)': { borderBottom: '1px solid', borderColor: 'divider' },
    }}
  >
    {icon && <IconTile icon={icon} color={checked ? 'primary' : 'secondary'} size={32} />}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" fontWeight={600}>{label}</Typography>
      {description && <Typography variant="caption" color="text.secondary" component="div">{description}</Typography>}
    </Box>
    <Switch checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
  </Box>
);

export const SliderField = ({ label, value, format = (v) => v, hint, sx, ...sliderProps }) => (
  <Box sx={sx}>
    <FieldLabel value={format(value)}>{label}</FieldLabel>
    <Box sx={{ px: 1 }}>
      <Slider value={value} size="small" {...sliderProps} />
    </Box>
    {hint && <Typography variant="caption" color="text.secondary" component="div">{hint}</Typography>}
  </Box>
);

const tileSx = (selected) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0.75,
  minHeight: 72,
  px: 1,
  py: 1.25,
  borderRadius: 1.5,
  border: '1px solid',
  borderColor: (theme) => (selected ? theme.palette.primary.main : alpha(theme.palette.text.secondary, 0.25)),
  bgcolor: (theme) => (selected ? alpha(theme.palette.primary.main, 0.1) : 'transparent'),
  color: selected ? 'primary.main' : 'text.secondary',
  boxShadow: (theme) => (selected ? `0 0 0 1px ${theme.palette.primary.main} inset` : 'none'),
  transition: 'border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease',
  '@media (hover: hover)': {
    '&:hover': { borderColor: 'primary.main', color: selected ? 'primary.main' : 'text.primary' },
  },
  '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
});

// A row of selectable cards with a small visual for each option.
export const OptionTiles = ({ options, value, onChange, columns, ariaLabel }) => (
  <Box
    role="radiogroup"
    aria-label={ariaLabel}
    sx={{ display: 'grid', gridTemplateColumns: columns || `repeat(${options.length}, minmax(0, 1fr))`, gap: 1 }}
  >
    {options.map((opt) => (
      <ButtonBase
        key={opt.value}
        role="radio"
        aria-checked={value === opt.value}
        onClick={() => onChange(opt.value)}
        sx={tileSx(value === opt.value)}
      >
        {opt.visual}
        <Typography variant="caption" fontWeight={600} lineHeight={1.2} textAlign="center">{opt.label}</Typography>
      </ButtonBase>
    ))}
  </Box>
);
