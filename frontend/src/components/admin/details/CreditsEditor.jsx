import { useRef } from 'react';
import { Box, Button, IconButton, InputAdornment, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add, Close } from '@mui/icons-material';
import { InitialsAvatar } from '../common/DataList';
import { DebouncedTextField } from './fields';

const ROLE_SUGGESTIONS = [
  'Photographer', 'Director', 'Model', 'Stylist', 'Makeup Artist', 'Hair Stylist',
  'Videographer', 'Creative Director', 'Assistant', 'Editor', 'Retoucher', 'Producer'
];

const CreditRow = ({ credit, onUpdate, onRemove }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '32px minmax(0, 1fr) auto', sm: '32px minmax(0, 1fr) minmax(0, 1fr) auto' },
      alignItems: 'center',
      columnGap: 1.5,
      rowGap: 1,
      p: 1.25,
      borderRadius: 2,
      border: '1px solid',
      borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
    }}
  >
    <InitialsAvatar name={credit.instagram || credit.role || '?'} size={32} />
    <DebouncedTextField
      label="Role"
      value={credit.role || ''}
      onChange={(v) => onUpdate('role', v)}
      size="small"
      placeholder="Photographer"
      slotProps={{ htmlInput: { list: 'credit-role-suggestions' } }}
    />
    <DebouncedTextField
      label="Instagram"
      value={credit.instagram || ''}
      onChange={(v) => onUpdate('instagram', v)}
      size="small"
      placeholder="username"
      sx={{ gridColumn: { xs: '2 / 3', sm: 'auto' }, gridRow: { xs: 2, sm: 'auto' } }}
      slotProps={{ input: { startAdornment: <InputAdornment position="start">@</InputAdornment> } }}
    />
    <Tooltip title="Remove credit">
      <IconButton size="small" onClick={onRemove} aria-label="Remove credit" sx={{ gridColumn: { xs: 3, sm: 'auto' }, gridRow: { xs: 1, sm: 'auto' } }}>
        <Close fontSize="small" />
      </IconButton>
    </Tooltip>
  </Box>
);

const CreditsEditor = ({ credits, onChange }) => {
  // Debounced fields fire after a delay, so read the latest list from a ref
  // rather than the render-time closure to avoid dropping a sibling edit.
  const creditsRef = useRef(credits);
  creditsRef.current = credits;

  const commit = (next) => {
    creditsRef.current = next;
    onChange(next);
  };

  const updateCredit = (index, field, value) => {
    commit(creditsRef.current.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addCredit = () => {
    const role = creditsRef.current.length === 0 ? 'Photographer' : '';
    commit([...creditsRef.current, { role, instagram: '' }]);
  };

  const removeCredit = (index) => {
    commit(creditsRef.current.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <datalist id="credit-role-suggestions">
        {ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}
      </datalist>
      {credits.length === 0 && (
        <Typography variant="body2" color="text.secondary">No credits added yet.</Typography>
      )}
      {credits.map((credit, index) => (
        <CreditRow
          key={index}
          credit={credit}
          onUpdate={(field, value) => updateCredit(index, field, value)}
          onRemove={() => removeCredit(index)}
        />
      ))}
      <Box>
        <Button size="small" startIcon={<Add />} onClick={addCredit}>Add credit</Button>
      </Box>
    </Box>
  );
};

export default CreditsEditor;
