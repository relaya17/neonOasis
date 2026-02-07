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
  VITE_VIDEO_RUMMY_INTRO_URL?: string; // הוספנו לממשק
  VITE_VIDEO_TOUCH_INTRO_URL?: string;
  VITE_VIDEO_LEADERBOARD_URL?: string;
  /** וידאו אחרי בחירת אורח/לוגין בדף ברוך הבא */
  VITE_VIDEO_WELCOME_CHOICE_URL?: string;
};

/** וידאו כניסה כללי (all) */
export const INTRO_VIDEO_URL: string =
  e.VITE_VIDEO_INTRO_URL ??
  'https://res.cloudinary.com/dora8sxcb/video/upload/v1770403442/all.png_w8jliq.mp4';

/** וידאו כניסה לפוקר */
export const POKER_INTRO_VIDEO_URL: string =
  e.VITE_VIDEO_POKER_INTRO_URL ?? 
  'https://res.cloudinary.com/dora8sxcb/video/upload/v1770403389/poker..mp4_etqezy.mp4';

/** וידאו כניסה לשש-בש */
export const BACKGAMMON_INTRO_VIDEO_URL: string =
  e.VITE_VIDEO_BACKGAMMON_INTRO_URL ??
  'https://res.cloudinary.com/dora8sxcb/video/upload/v1770403479/play1_jhkk1j.mp4';

/** וידאו כרטיס סנוקר */
export const SNOOKER_INTRO_VIDEO_URL: string = 
  e.VITE_VIDEO_SNOOKER_INTRO_URL ?? 
  'https://res.cloudinary.com/dora8sxcb/video/upload/v1770416142/snoker.mp4_vjh6h4.mp4';

/** וידאו כניסה לרמי — הלינק החדש ששלחת */
export const RUMMY_INTRO_VIDEO_URL: string = 
  e.VITE_VIDEO_RUMMY_INTRO_URL ?? 
  'https://res.cloudinary.com/dora8sxcb/video/upload/v1770421191/remi.mp4_yp73zm.mp4';

/** וידאו רקע ללוח מובילים */
export const LEADERBOARD_VIDEO_URL: string =
  e.VITE_VIDEO_LEADERBOARD_URL ?? '/images/play2.mp4';

/** וידאו אחרי בחירת אורח או לוגין (ברוך הבא) */
export const WELCOME_CHOICE_VIDEO_URL: string =
  e.VITE_VIDEO_WELCOME_CHOICE_URL ??
  'https://res.cloudinary.com/dora8sxcb/video/upload/v1770404211/all2_zw34fo.mp4';

/** לשמירת תאימות: אותו וידאו כמו רמי אבנים (להחלפה: VITE_VIDEO_TOUCH_INTRO_URL) */
export const TOUCH_INTRO_VIDEO_URL: string = e.VITE_VIDEO_TOUCH_INTRO_URL ?? RUMMY_INTRO_VIDEO_URL;