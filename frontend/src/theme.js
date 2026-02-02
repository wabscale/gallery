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
    MuiCssBaseline: {
      styleOverrides: `
        body {
          background-image:
            radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.4) 100%),
            linear-gradient(rgba(10, 189, 198, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10, 189, 198, 0.04) 1px, transparent 1px);
          background-size: 100% 100%, 40px 40px, 40px 40px;
          background-attachment: fixed;
        }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
        }
        body::after {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.06;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.15) 2px,
            rgba(0, 0, 0, 0.15) 4px
          );
        }
      `,
    },
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
