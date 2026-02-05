import { Box, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function ResponsibleGamingPage() {
  const { t } = useTranslation('common');

  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: 'auto', color: '#e0e0e0' }} role="main" aria-label={t('footer.responsible')}>
      <Typography variant="h5" sx={{ color: 'primary.main', mb: 2 }}>
        משחק אחראי — Neon Oasis
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: '#e0e0e0' }}>
        1. המטבעות באפליקציה הם וירטואליים בלבד ואין להם ערך כספי לפדיון. אין להחשיב את השירות כהמרה לכסף אמיתי.
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: '#e0e0e0' }}>
        2. אנו ממליצים להגביל זמן משחק יומי ולקחת הפסקות. ניתן להגדיר תזכורות במכשיר.
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: '#e0e0e0' }}>
        3. המשחק מיועד לבידור. אם את/ה מרגיש/ה שהמשחק פוגע בחיי היומיום, פנה/י לגורם מקצועי או השתמש/י במגבלות הזמינות.
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: '#e0e0e0' }}>
        4. אסור להשתמש בשירות מתחת לגיל המותר לפי החוק במדינתך. AI Guardian משמש לאימות גיל בלבד.
      </Typography>
      <Link component={RouterLink} to="/" sx={{ color: 'primary.main' }} aria-label={t('back')}>
        ← {t('back')}
      </Link>
    </Box>
  );
}
