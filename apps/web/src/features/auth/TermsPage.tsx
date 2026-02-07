import { Box, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function TermsPage() {
  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: 'auto', color: '#ccc' }} role="main">
      <Typography variant="h5" sx={{ color: 'primary.main', mb: 2 }}>
        תקנון שירות — Neon Oasis
      </Typography>

      <Box
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 1,
          bgcolor: 'rgba(255, 152, 0, 0.1)',
          border: '1px solid rgba(255, 152, 0, 0.4)',
        }}
      >
        <Typography variant="subtitle1" sx={{ color: '#ff9800', fontWeight: 'bold', mb: 1 }}>
          אזהרות
        </Typography>
        <Typography variant="body2" sx={{ color: '#e0e0e0' }} paragraph>
          • השירות מיועד לגיל 18 ומעלה בלבד. אימות גיל (AI Guardian) חובה.
        </Typography>
        <Typography variant="body2" sx={{ color: '#e0e0e0' }} paragraph>
          • משחק אחראי — אל תשחק/י מעבר ליכולתך. ניתן להגביל זמן משחק ולהשתמש במגבלות.
        </Typography>
        <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
          • למידע נוסף: <Link component={RouterLink} to="/responsible-gaming" sx={{ color: '#ff9800' }}>משחק אחראי</Link>
        </Typography>
      </Box>

      <Typography variant="subtitle2" sx={{ color: '#00f2ea', fontWeight: 'bold', mb: 1 }}>
        1. אופי השירות והמטבעות
      </Typography>
      <Typography variant="body2" paragraph>
        Neon Oasis היא פלטפורמת משחקי מיומנות (Skill-Based). קיימים שני סוגי מאזן: <strong>Balance (Play Money)</strong> — מטבעות לרכישה ולשימוש במשחקים ובחנות; <strong>Prize Balance</strong> — זכיות מניצחונות ומתנות מהקהל, הניתנות למשיכה (פדיון) בהתאם לתקנון ולבדיקות.
      </Typography>

      <Typography variant="subtitle2" sx={{ color: '#00f2ea', fontWeight: 'bold', mb: 1 }}>
        2. פדיון (Cash Out)
      </Typography>
      <Typography variant="body2" paragraph>
        פדיון כסף אפשרי רק מ-Prize Balance, בכפוף למינימום פדיון, לאישור המערכת ולתנאי החוק. הזכיות מבוססות מיומנות במשחק (סנוקר, ששבש, פוקר) ולא על הימור מקרי.
      </Typography>

      <Typography variant="body2" paragraph>
        3. אימות גיל (AI Guardian) מתבצע באמצעות סריקה. הנתונים משמשים אך ורק לאימות גיל ולא נשמרים לצמיתות.
      </Typography>
      <Typography variant="body2" paragraph>
        4. אסור להעתיק, לרמות או לנצל באגים. הפרה עלולה לגרום לחסימת חשבון.
      </Typography>
      <Typography variant="body2" paragraph>
        5. אנו שומרים את הזכות לעדכן את התקנון. המשך שימוש לאחר עדכון מהווה הסכמה.
      </Typography>

      <Link component={RouterLink} to="/" sx={{ color: 'primary.main' }}>
        ← חזרה
      </Link>
    </Box>
  );
}
