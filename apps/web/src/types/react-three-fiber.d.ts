declare module '@react-three/fiber' {
  import type { ReactNode } from 'react';
  export function Canvas(props: { children?: ReactNode; [key: string]: unknown }): JSX.Element;
  export function useFrame(callback: (state: RootState, delta: number) => void): void;
  export function useThree(): RootState;
  export interface RootState {
    camera?: { position: { set: (x: number, y: number, z: number) => void }; [key: string]: unknown };
    [key: string]: unknown;
  }
}
