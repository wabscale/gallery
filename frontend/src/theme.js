import { createTheme } from '@mui/material';

const neonGlow = (color, spread = 4) =>
  `0 0 ${spread}px ${color}, 0 0 ${spread * 2}px ${color}40`;

const accentPulse = (color) => `
  @keyframes accentPulse {
    0%, 100% { box-shadow: ${neonGlow(color, 3)}; }
    50% { box-shadow: ${neonGlow(color, 6)}; }
  }
`;

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d9d9',
    },
    secondary: {
      main: '#ff6b00',
    },
    background: {
      default: '#0a0a0f',
      paper: '#12121a',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#9ca3af',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @keyframes bgGlow {
          0%, 100% {
            background-position: 0% 50%, 0 0, 0 0;
          }
          25% {
            background-position: 100% 50%, 0 0, 0 0;
          }
          50% {
            background-position: 100% 100%, 0 0, 0 0;
          }
          75% {
            background-position: 0% 100%, 0 0, 0 0;
          }
        }
        ${accentPulse('#ff6b00')}
        body {
          background-color: #0a0a0f;
          background-image:
            radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0, 217, 217, 0.08) 0%, rgba(255, 107, 0, 0.04) 40%, transparent 70%),
            linear-gradient(rgba(0, 217, 217, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 217, 0.03) 1px, transparent 1px);
          background-size: 200% 200%, 40px 40px, 40px 40px;
          background-attachment: fixed;
          animation: bgGlow 18s ease-in-out infinite;
        }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
        }
        body::after {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.05;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.12) 2px,
            rgba(0, 0, 0, 0.12) 4px
          );
        }
      `,
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0a0a0f',
          borderBottom: '1px solid #00d9d940',
          boxShadow: neonGlow('#00d9d9', 2),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#12121a',
          border: '1px solid #00d9d920',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          '&:hover': {
            borderColor: '#00d9d960',
            boxShadow: neonGlow('#00d9d9', 3),
            animation: 'accentPulse 2s ease-in-out infinite',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#12121a',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          transition: 'box-shadow 0.3s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: neonGlow('#00d9d9', 3),
          },
        },
        outlined: {
          '&:hover': {
            borderColor: '#ff6b00',
            boxShadow: neonGlow('#ff6b00', 2),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: '#00d9d9',
              boxShadow: neonGlow('#00d9d9', 2),
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: neonGlow('#ff6b00', 2),
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
