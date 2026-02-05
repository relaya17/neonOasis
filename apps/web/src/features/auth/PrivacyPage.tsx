import { Box, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: 'auto', color: '#ccc' }}>
      <Typography variant="h5" sx={{ color: 'primary.main', mb: 2 }}>
        מדיניות פרטיות — Neon Oasis
      </Typography>
      <Typography variant="body2" paragraph>
        1. <strong>Privacy Policy:</strong> לגבי AI Guardian — איננו שומרים תצלומי פנים של המשתמשים. נשמרת רק "חתימה דיגיטלית" (Digital Signature) לאימות גיל, ללא שמירת תמונות.
      </Typography>
      <Typography variant="body2" paragraph>
        2. נתוני משחק (יתרה, היסטוריית משחקים) נשמרים לצורך הפעלת השירות והתמיכה.
      </Typography>
      <Typography variant="body2" paragraph>
        3. איננו מוכרים נתונים אישיים לצדדים שלישיים. שיתוף עם ספקי תשתית (אירוח, DB) כפוף להסכמים.
      </Typography>
      <Typography variant="body2" paragraph>
        4. ניתן לפנות אלינו בבקשה למחיקת חשבון ונתונים.
      </Typography>
      <Link component={RouterLink} to="/" sx={{ color: 'primary.main' }}>
        ← חזרה
      </Link>
    </Box>
  );
}
