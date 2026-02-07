import { Box, Link, Typography, Select, MenuItem, FormControl } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'he', label: 'עברית' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'ar', label: 'العربية' },
];

export function AppFooter() {
  const { t, i18n } = useTranslation('common');

  return (
    <Box
      component="footer"
      role="contentinfo"
      aria-label="Footer"
      sx={{
        py: 2,
        px: 2,
        mt: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Link
        component={RouterLink}
        to="/terms"
        sx={{ color: 'primary.main', fontSize: '0.875rem' }}
        aria-label={t('footer.terms')}
      >
        {t('footer.terms')}
      </Link>
      <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }} aria-hidden>
        ·
      </Typography>
      <Link
        component={RouterLink}
        to="/privacy"
        sx={{ color: 'primary.main', fontSize: '0.875rem' }}
        aria-label={t('footer.privacy')}
      >
        {t('footer.privacy')}
      </Link>
      <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }} aria-hidden>
        ·
      </Typography>
      <Link
        component={RouterLink}
        to="/responsible-gaming"
        sx={{ color: 'primary.main', fontSize: '0.875rem' }}
        aria-label={t('footer.responsible')}
      >
        {t('footer.responsible')}
      </Link>
      <FormControl size="small" sx={{ minWidth: 80 }} id="footer-lang-label">
        <Select
          value={i18n.language?.slice(0, 2) || 'en'}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          sx={{ color: 'primary.main', fontSize: '0.875rem', height: 32 }}
          aria-labelledby="footer-lang-label"
          inputProps={{ 'aria-label': 'בחירת שפה' }}
        >
          {LANGUAGES.map((lang) => (
            <MenuItem key={lang.code} value={lang.code} aria-label={lang.label}>
              {lang.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
