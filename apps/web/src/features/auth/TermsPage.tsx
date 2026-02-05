import { Box, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function TermsPage() {
  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: 'auto', color: '#ccc' }}>
      <Typography variant="h5" sx={{ color: 'primary.main', mb: 2 }}>
        תקנון שירות — Neon Oasis
      </Typography>
      <Typography variant="body2" paragraph>
        1. <strong>Terms of Service (ToS):</strong> המטבעות באפליקציה הם וירטואליים בלבד (Virtual Only) ואין להם ערך כספי לפדיון. אין המרה לכסף אמיתי — כדי שלא ייחשב השירות כקזינו לא חוקי.
      </Typography>
      <Typography variant="body2" paragraph>
        2. אימות גיל (AI Guardian) מתבצע באמצעות סריקה. הנתונים משמשים אך ורק לאימות ולא נשמרים לצמיתות.
      </Typography>
      <Typography variant="body2" paragraph>
        3. אסור להעתיק, לרמות או לנצל באגים. הפרה עלולה לגרום לחסימת חשבון.
      </Typography>
      <Typography variant="body2" paragraph>
        4. אנו שומרים את הזכות לעדכן את התקנון. המשך שימוש לאחר עדכון מהווה הסכמה.
      </Typography>
      <Link component={RouterLink} to="/" sx={{ color: 'primary.main' }}>
        ← חזרה
      </Link>
    </Box>
  );
}
