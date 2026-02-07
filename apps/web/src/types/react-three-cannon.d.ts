declare module '@react-three/cannon' {
  import type { ReactNode, RefObject } from 'react';
  export function Physics(props: { children: ReactNode; [key: string]: unknown }): JSX.Element;
  export function usePlane<T>(config: unknown): [RefObject<T>, { position: { set: (x: number, y: number, z: number) => void }; rotation: { set: (x: number, y: number, z: number) => number }; }];
  export function useBox<T>(config: unknown): [RefObject<T>, { velocity: { set: (x: number, y: number, z: number) => void }; angularVelocity: { set: (x: number, y: number, z: number) => void }; quaternion: { set: (x: number, y: number, z: number, w: number) => void }; }];
}
