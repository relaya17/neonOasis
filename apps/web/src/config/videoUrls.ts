/**
 * כתובות וידאו — מנתיב חיצוני (Cloudinary וכו').
 * להחלפת וידאו: הגדר ב-.env את המשתנים עם ה-URL המלא.
 */
const env = typeof import.meta !== 'undefined' ? import.meta.env : {};

const e = env as {
  VITE_VIDEO_INTRO_URL?: string;
  VITE_VIDEO_POKER_INTRO_URL?: string;
  VITE_VIDEO_BACKGAMMON_INTRO_URL?: string;
  VITE_VIDEO_SNOOKER_INTRO_URL?: string;
  VITE_VIDEO_TOUCH_INTRO_URL?: string;
  VITE_VIDEO_LEADERBOARD_URL?: string;
  /** וידאו אחרי בחירת אורח/לוגין בדף ברוך הבא */
  VITE_VIDEO_WELCOME_CHOICE_URL?: string;
};

/** וידאו כניסה כללי (all) — אחרי תנאי שימוש ואימות גיל. ברירת מחדל: Cloudinary. */
export const INTRO_VIDEO_URL: string =
  e.VITE_VIDEO_INTRO_URL ??
  'https://res.cloudinary.com/dora8sxcb/video/upload/v1770403442/all.png_w8jliq.mp4';

/** וידאו כניסה לפוקר */
export const POKER_INTRO_VIDEO_URL: string =
  e.VITE_VIDEO_POKER_INTRO_URL ?? '/images/poker..mp4';

/** וידאו כניסה לשש-בש — ברירת מחדל: Cloudinary (נתיב חיצוני) */
export const BACKGAMMON_INTRO_VIDEO_URL: string =
  e.VITE_VIDEO_BACKGAMMON_INTRO_URL ??
  'https://res.cloudinary.com/dora8sxcb/video/upload/v1770403479/play1_jhkk1j.mp4';

/** וידאו רקע ללוח מובילים — הגדר VITE_VIDEO_LEADERBOARD_URL ב-.env לנתיב חיצוני */
export const LEADERBOARD_VIDEO_URL: string =
  e.VITE_VIDEO_LEADERBOARD_URL ?? '/images/play2.mp4';

/** וידאו אחרי בחירת אורח או לוגין (ברוך הבא) — כמו בשש-בש, ברירת מחדל: קובייה Cloudinary */
export const WELCOME_CHOICE_VIDEO_URL: string =
  e.VITE_VIDEO_WELCOME_CHOICE_URL ??
  'https://res.cloudinary.com/dora8sxcb/video/upload/v1770407161/cubeviduo.mp4_mefh5y.mp4';

/** וידאו כרטיס סנוקר — הגדר VITE_VIDEO_SNOOKER_INTRO_URL ב-.env עם כתובת הווידאו */
export const SNOOKER_INTRO_VIDEO_URL: string = e.VITE_VIDEO_SNOOKER_INTRO_URL ?? '';

/** וידאו כרטיס טאצ'/סוליטר — הגדר VITE_VIDEO_TOUCH_INTRO_URL ב-.env עם כתובת הווידאו */
export const TOUCH_INTRO_VIDEO_URL: string = e.VITE_VIDEO_TOUCH_INTRO_URL ?? '';
