import { createTheme } from '@mui/material/styles';

export const colors = {
  background: '#F5F4ED',
  surface: '#FFFFFF',
  ink: '#1A2925',
  muted: '#52645E',
  line: '#D8E1D9',
  green: '#245C46',
  greenLight: '#D8EDE0',
  fifo: '#3170A4',
  priority: '#A95820',
  aging: '#785CA8',
} as const;

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: colors.green, contrastText: '#FFFFFF' },
    background: { default: colors.background, paper: colors.surface },
    text: { primary: colors.ink, secondary: colors.muted },
    divider: colors.line,
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
    h1: {
      fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
      fontWeight: 750,
      lineHeight: 1.08,
      letterSpacing: '-0.055em',
    },
    h2: {
      fontSize: 'clamp(2rem, 3vw, 3rem)',
      fontWeight: 730,
      lineHeight: 1.13,
      letterSpacing: '-0.04em',
    },
    h4: { fontWeight: 720, letterSpacing: '-0.035em' },
    h5: { fontWeight: 700, letterSpacing: '-0.025em' },
    h6: { fontWeight: 680, letterSpacing: '-0.015em' },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.background },
        '::selection': { backgroundColor: colors.greenLight },
        ':focus-visible': {
          outline: `3px solid ${colors.fifo}`,
          outlineOffset: '3px',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 17px',
          transition: 'transform 160ms ease, background-color 160ms ease',
        },
        contained: {
          '&:hover': { transform: 'translateY(-2px)' },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            '&:hover': { transform: 'none' },
          },
        },
        outlined: {
          borderColor: colors.line,
          '&:hover': { borderColor: colors.green },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderColor: colors.line,
          boxShadow: '0 12px 36px rgba(24, 52, 38, 0.04)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiTableHead: {
      styleOverrides: { root: { backgroundColor: '#EFF3EE' } },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderColor: colors.line } },
    },
  },
});
