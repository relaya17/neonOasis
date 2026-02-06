/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_WS_URL?: string;
    readonly VITE_SOCKET_URL?: string;
    readonly VITE_DEMO_USER_ID?: string;
    /** כתובת וידאו כניסה כללי (למשל מ-Cloudinary) */
    readonly VITE_VIDEO_INTRO_URL?: string;
    /** כתובת וידאו כניסה לפוקר */
    readonly VITE_VIDEO_POKER_INTRO_URL?: string;
    /** כתובת וידאו כניסה לדמקה */
    readonly VITE_VIDEO_BACKGAMMON_INTRO_URL?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
