import { createTheme } from '@mui/material';

const neonGlow = (color, spread = 4) =>
  `0 0 ${spread}px ${color}, 0 0 ${spread * 2}px ${color}40`;

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0abdc6',
    },
    secondary: {
      main: '#ea00d9',
    },
    background: {
      default: '#091833',
      paper: '#111827',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#9ca3af',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0d1117',
          borderBottom: '1px solid #0abdc640',
          boxShadow: neonGlow('#0abdc6', 2),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#111827',
          border: '1px solid #0abdc620',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          '&:hover': {
            borderColor: '#0abdc660',
            boxShadow: neonGlow('#0abdc6', 3),
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#111827',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          '&:hover': {
            boxShadow: neonGlow('#0abdc6', 3),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: '#0abdc6',
              boxShadow: neonGlow('#0abdc6', 2),
            },
          },
        },
      },
    },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export { darkTheme, lightTheme };
