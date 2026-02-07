/// <reference types="vite/client" />

declare module '@react-three/cannon' {
  import type { ReactNode, RefObject } from 'react';
  export function Physics(props: { children: ReactNode; [key: string]: unknown }): JSX.Element;
  export function usePlane<T>(config: unknown): [RefObject<T>, { position: { set: (x: number, y: number, z: number) => void }; rotation: { set: (x: number, y: number, z: number) => number }; }];
  export function useBox<T>(config: unknown): [RefObject<T>, { velocity: { set: (x: number, y: number, z: number) => void }; angularVelocity: { set: (x: number, y: number, z: number) => void }; quaternion: { set: (x: number, y: number, z: number, w: number) => void }; }];
}

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
    /** בסיס כתובות לקבצי סאונד (מותר ברשת – CDN או שרת עם CORS). לדוגמה: https://cdn.example.com/assets */
    readonly VITE_SOUNDS_BASE_URL?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
