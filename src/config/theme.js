import { createTheme } from '@mui/material/styles';

const font = '"Poppins", system-ui, sans-serif';
export const colors = { navy: '#12285E', navySoft: '#E8EDF9', cta: '#F59E0B', ctaInk: '#1B1300', good: '#137A4B', warn: '#A25A00', bad: '#C42B3A', line: '#E3E7F1', muted: '#667391', bg: '#FAFAFA' };

export default createTheme({
  palette: {
    primary: { main: colors.navy }, secondary: { main: colors.cta, contrastText: colors.ctaInk },
    success: { main: colors.good }, warning: { main: colors.warn }, error: { main: colors.bad },
    background: { default: colors.bg, paper: '#fff' }, text: { primary: '#17203A', secondary: colors.muted }, divider: colors.line
  },
  shape: { borderRadius: 10 },
  typography: { fontFamily: font, fontSize: 13, button: { textTransform: 'none', fontWeight: 500 }, h1: { fontSize: 22, fontWeight: 600 }, h2: { fontSize: 18, fontWeight: 600 }, h3: { fontSize: 15, fontWeight: 600 } },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiOutlinedInput: { styleOverrides: {
      root: { backgroundColor: '#F7F8FC', borderRadius: 10, fontSize: 13, '& fieldset': { borderColor: colors.line }, '&:hover fieldset': { borderColor: '#C9D0E3' }, '&.Mui-focused': { backgroundColor: '#fff' }, '&.Mui-disabled': { backgroundColor: '#F1F3F9' } },
      input: { paddingTop: 10.5, paddingBottom: 10.5 }, inputMultiline: { padding: 0 }
    } },
    MuiFormHelperText: { styleOverrides: { root: { marginLeft: 2, marginRight: 2, fontSize: 11.5 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 600, color: colors.muted, fontSize: 12 } } }
  }
});
