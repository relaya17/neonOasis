import { createTheme, type Direction } from '@mui/material/styles';

/** Design System: Cyber-Vegas (PRD 2026) — WCAG 2.1 contrast */
const textPrimaryOnDark = '#e8e8e8';
const textSecondaryOnDark = '#b0b0b0';

/** Colors: Deep Space Black, Cyber Pink, Electric Blue */
const DEEP_SPACE_BLACK = '#0a0a0f';
const CYBER_PINK = '#ff00ff';
const ELECTRIC_BLUE = '#00ffff';

/** Typography: Orbitron (headers), Heebo (UI / Hebrew) */
const fontHeader = '"Orbitron", sans-serif';
const fontBody = '"Heebo", "Segoe UI", system-ui, sans-serif';

/** Custom theme — 80's Vegas neon, RTL, A11y */
export function getTheme(direction: Direction = 'ltr') {
  return createTheme({
    direction,
    palette: {
      mode: 'dark',
      primary: { main: ELECTRIC_BLUE },
      secondary: { main: CYBER_PINK },
      background: { default: DEEP_SPACE_BLACK, paper: '#141414' },
      text: {
        primary: textPrimaryOnDark,
        secondary: textSecondaryOnDark,
      },
    },
    typography: {
      fontFamily: fontBody,
      h1: { fontFamily: fontHeader },
      h2: { fontFamily: fontHeader },
      h3: { fontFamily: fontHeader },
      h4: { fontFamily: fontHeader },
      h5: { fontFamily: fontHeader },
      h6: { fontFamily: fontHeader },
      body1: { color: textPrimaryOnDark },
      body2: { color: textPrimaryOnDark },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            '--neon-glow': ELECTRIC_BLUE,
            '--neon-secondary': CYBER_PINK,
            '--neon-fade-duration': '0.3s',
          },
          'a:focus-visible, button:focus-visible, [role="button"]:focus-visible': {
            outline: `2px solid ${ELECTRIC_BLUE}`,
            outlineOffset: 2,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            '&:focus-visible': { outline: `2px solid ${ELECTRIC_BLUE}`, outlineOffset: 2 },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&:focus-visible': { outline: `2px solid ${ELECTRIC_BLUE}`, outlineOffset: 2 },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: textSecondaryOnDark,
            '&.Mui-selected': { color: ELECTRIC_BLUE },
            '&:focus-visible': { outline: `2px solid ${ELECTRIC_BLUE}`, outlineOffset: 2 },
          },
        },
      },
    },
  });
}

export const theme = getTheme('ltr');
