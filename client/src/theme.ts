import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1565c0' },
    secondary: { main: '#2e7d32' },
    error: { main: '#d32f2f' },
    background: { default: '#f6f8fa', paper: '#ffffff' },
  },
  typography: {
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
    h6: { fontSize: '1.125rem', fontWeight: 600, color: '#0f1720' },
    h5: { fontSize: '1.25rem', fontWeight: 700 },
    body1: { fontSize: '0.975rem', color: '#142036' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, #root': { height: '100%' },
        body: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(16,24,40,0.06)'
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 12px', minHeight: 40 },
        containedPrimary: {
          boxShadow: 'none',
          backgroundColor: '#1565c0',
          color: '#fff',
          '&:hover': { backgroundColor: '#0d47a1' },
          '&:active': { boxShadow: 'none' },
          '&.Mui-disabled': { backgroundColor: 'rgba(21,101,192,0.4)', color: 'rgba(255,255,255,0.8)' },
          '&:focus': { outline: '3px solid rgba(21,101,192,0.16)', outlineOffset: 2 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { backgroundColor: 'transparent', color: '#0f1720', fontWeight: 700, fontSize: '0.95rem' },
        root: { padding: '12px 16px' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: { padding: '8px' },
      },
    },
  },
})

export default theme
