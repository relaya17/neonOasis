import { Box, Typography, Link, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function ResponsibleGamingPage() {
  const { t } = useTranslation('common');

  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: 'auto', color: '#e0e0e0' }} role="main" aria-label={t('footer.responsible')}>
      <Typography variant="h5" sx={{ color: 'primary.main', mb: 2 }}>
        משחק אחראי ותקינות משפטית — Neon Oasis
      </Typography>

      <Typography variant="h6" sx={{ color: '#00f2ea', mt: 2, mb: 1, fontSize: '1rem' }}>
        אין הימורים באתר
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: '#e0e0e0' }}>
        Neon Oasis היא פלטפורמת משחקי מיומנות (Skill-Based Gaming) לבידור.
        כל התחרויות מבוססות על מיומנות בלבד — לא על מזל, הגרלה או סיכוי אקראי.
        <strong> אין הימורים, אין קזינו, אין משחקי מזל.</strong>
      </Typography>

      <Typography variant="h6" sx={{ color: '#00f2ea', mt: 2, mb: 1, fontSize: '1rem' }}>
        מטבעות וירטואליים
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: '#e0e0e0' }}>
        המטבעות (Coins) הם וירטואליים ומיועדים לשימוש בתוך הפלטפורמה בלבד.
        הם אינם מייצגים כסף אמיתי, מטבע מדינה, או נכס פיננסי כלשהו.
      </Typography>

      <Typography variant="h6" sx={{ color: '#00f2ea', mt: 2, mb: 1, fontSize: '1rem' }}>
        משחק מול מחשב (AI)
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: '#e0e0e0' }}>
        משחק מול AI הוא לאימון ולתרגול בלבד. אין דמי כניסה ואין רווח כספי.
        מצב זה מיועד ללמוד את המשחק ולשפר מיומנות — ללא כל ערך כספי או פרס.
      </Typography>

      <Typography variant="h6" sx={{ color: '#00f2ea', mt: 2, mb: 1, fontSize: '1rem' }}>
        תחרויות מיומנות (PvP)
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: '#e0e0e0' }}>
        תחרויות בין שחקנים מבוססות על כישורי משחק (שש-בש, סנוקר, פוקר, רמי).
        הפרסים מבוססי מיומנות ומותנים בניצחון בתחרות הוגנת. בכפוף לתקנון ולחוקי המדינה.
      </Typography>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', my: 2 }} />

      <Typography variant="h6" sx={{ color: '#ff9800', mt: 2, mb: 1, fontSize: '1rem' }}>
        משחק אחראי
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: '#e0e0e0' }}>
        1. המשחק מיועד לבידור. אל תשחק/י מעבר ליכולתך הכלכלית.
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: '#e0e0e0' }}>
        2. מומלץ להגביל זמן משחק יומי ולקחת הפסקות. ניתן להגדיר תזכורות במכשיר.
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: '#e0e0e0' }}>
        3. אם את/ה מרגיש/ה שהמשחק פוגע בחיי היומיום, פנה/י לגורם מקצועי או צור/י קשר עם התמיכה.
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: '#e0e0e0' }}>
        4. אסור להשתמש בשירות מתחת לגיל 18 או לגיל המותר לפי החוק במדינתך.
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: '#e0e0e0' }}>
        5. הפלטפורמה שומרת את הזכות לחסום חשבונות שפועלים בניגוד לתקנון.
      </Typography>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', my: 2 }} />

      <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 2, lineHeight: 1.6 }}>
        Neon Oasis פועלת בהתאם לחוקי המדינה הרלוונטיים. השימוש בפלטפורמה הוא באחריות המשתמש/ת.
        יש לוודא שתחרויות מיומנות מותרות בתחום השיפוט שלך.
        לכל שאלה משפטית — פנו לייעוץ משפטי מקצועי.
      </Typography>

      <Link component={RouterLink} to="/" sx={{ color: 'primary.main' }} aria-label={t('back')}>
        ← {t('back')}
      </Link>
    </Box>
  );
}
