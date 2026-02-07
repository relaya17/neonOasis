// Type declarations for 'three' module
// This file resolves the issue where @types/three cannot be resolved due to package.json "exports"

declare module 'three' {
  // Re-export common types that are used in the codebase
  export type Mesh = unknown;
  export type Vector3 = unknown;
  export type Color = unknown;
  export type Scene = unknown;
  export type Camera = unknown;
  export type WebGLRenderer = unknown;
  export type Geometry = unknown;
  export type Material = unknown;
  export type Object3D = unknown;
  export type Group = unknown;
  export type BufferGeometry = unknown;
  export type MeshStandardMaterial = unknown;
  export type MeshBasicMaterial = unknown;
  export type AmbientLight = unknown;
  export type DirectionalLight = unknown;
  export type PointLight = unknown;
  export type SpotLight = unknown;
  export type PerspectiveCamera = unknown;
  export type OrthographicCamera = unknown;
  export type Texture = unknown;
  export type CubeTexture = unknown;
  export type AnimationMixer = unknown;
  export type Clock = unknown;
  export type Raycaster = unknown;
  export type EventDispatcher = unknown;

  export class Euler {
    constructor(x?: number, y?: number, z?: number);
  }
  export class Quaternion {
    constructor(x?: number, y?: number, z?: number, w?: number);
    setFromEuler(e: Euler): this;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
  }

  export as namespace THREE;
}
