import { Box, Paper, Typography, Skeleton, Avatar, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';

// Building blocks for the admin list views. Rows are CSS grids so each view
// can supply a different column template per breakpoint (a compact stacked
// layout on phones, a full table-like layout on wider screens).

const accent = (theme) => theme.palette.primary.main;

export const ListShell = ({ children, sx }) => (
  <Paper
    sx={{
      overflow: 'hidden',
      borderRadius: 2,
      border: '1px solid',
      borderColor: (theme) => alpha(accent(theme), 0.15),
      ...sx,
    }}
  >
    {children}
  </Paper>
);

export const ListHeader = ({ template, from = 'md', children }) => (
  <Box
    sx={{
      display: { xs: 'none', [from]: 'grid' },
      gridTemplateColumns: template,
      alignItems: 'center',
      columnGap: 2,
      px: 2.5,
      py: 1.25,
      borderBottom: '1px solid',
      borderColor: 'divider',
      bgcolor: (theme) => alpha(accent(theme), 0.03),
    }}
  >
    {children}
  </Box>
);

export const HeaderCell = ({ children, align = 'left', hideBelow }) => (
  <Typography
    variant="overline"
    color="text.secondary"
    sx={{
      lineHeight: 1.5,
      letterSpacing: '0.08em',
      textAlign: align,
      ...(hideBelow && { display: { xs: 'none', [hideBelow]: 'block' } }),
    }}
  >
    {children}
  </Typography>
);

export const ListRow = ({ template, onClick, dimmed, children }) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'grid',
      gridTemplateColumns: template,
      alignItems: 'center',
      columnGap: 2,
      px: { xs: 1.5, sm: 2.5 },
      py: 1.5,
      cursor: onClick ? 'pointer' : 'default',
      opacity: dimmed ? 0.6 : 1,
      transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
      '&:not(:last-of-type)': { borderBottom: '1px solid', borderColor: 'divider' },
      '@media (hover: hover)': {
        '&:hover': {
          bgcolor: (theme) => alpha(accent(theme), 0.05),
          boxShadow: (theme) => `inset 3px 0 0 ${accent(theme)}`,
        },
      },
      '&:active': onClick ? { bgcolor: (theme) => alpha(accent(theme), 0.08) } : {},
    }}
  >
    {children}
  </Box>
);

export const Cell = ({ children, hideBelow, align = 'left', sx }) => (
  <Box
    sx={{
      minWidth: 0,
      textAlign: align,
      ...(hideBelow && { display: { xs: 'none', [hideBelow]: 'block' } }),
      ...sx,
    }}
  >
    {children}
  </Box>
);

export const SkeletonRows = ({ count = 5 }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.75 }}>
        <Skeleton variant="rounded" width={44} height={44} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="40%" />
          <Skeleton width="25%" height={16} />
        </Box>
        <Skeleton width={80} sx={{ display: { xs: 'none', sm: 'block' } }} />
      </Box>
    ))}
  </>
);

export const EmptyState = ({ icon, title, subtitle, action }) => (
  <Box sx={{ textAlign: 'center', py: { xs: 6, sm: 8 }, px: 3 }}>
    <Box
      sx={{
        display: 'inline-flex',
        p: 2,
        mb: 2,
        borderRadius: '50%',
        color: 'primary.main',
        bgcolor: (theme) => alpha(accent(theme), 0.08),
        border: '1px solid',
        borderColor: (theme) => alpha(accent(theme), 0.25),
        '& svg': { fontSize: 36 },
      }}
    >
      {icon}
    </Box>
    <Typography variant="h6">{title}</Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: action ? 2.5 : 0 }}>
        {subtitle}
      </Typography>
    )}
    {action}
  </Box>
);

const hashString = (value) => [...value].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export const InitialsAvatar = ({ name = '', size = 36 }) => {
  const initials = name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const tone = hashString(name) % 2 === 0 ? 'primary' : 'secondary';
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontWeight: 600,
        color: `${tone}.main`,
        // Tint over a solid base so overlapping avatars (AvatarGroup) stay opaque
        bgcolor: 'background.paper',
        backgroundImage: (theme) => {
          const tint = alpha(theme.palette[tone].main, 0.12);
          return `linear-gradient(${tint}, ${tint})`;
        },
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette[tone].main, 0.4),
      }}
    >
      {initials || '?'}
    </Avatar>
  );
};

export const StatusDot = ({ active, label, activeColor = 'primary' }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        flexShrink: 0,
        bgcolor: active ? `${activeColor}.main` : 'text.disabled',
        boxShadow: (theme) => (active ? `0 0 6px ${theme.palette[activeColor].main}` : 'none'),
      }}
    />
    <Typography variant="body2" color={active ? 'text.primary' : 'text.secondary'}>{label}</Typography>
  </Box>
);

export const IconBadge = ({ icon, title, color = 'primary' }) => (
  <Tooltip title={title}>
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 26,
        height: 26,
        borderRadius: 1,
        color: `${color}.main`,
        bgcolor: (theme) => alpha(theme.palette[color].main, 0.1),
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette[color].main, 0.25),
        '& svg': { fontSize: 15 },
      }}
    >
      {icon}
    </Box>
  </Tooltip>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} mb={{ xs: 2.5, sm: 3 }}>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
    </Box>
    {action}
  </Box>
);
