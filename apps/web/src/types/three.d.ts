// Type declarations for 'three' module
// This file resolves the issue where @types/three cannot be resolved due to package.json "exports"

declare module 'three' {
  // Re-export common types that are used in the codebase
  export type Mesh = any;
  export type Vector3 = any;
  export type Color = any;
  export type Scene = any;
  export type Camera = any;
  export type WebGLRenderer = any;
  export type Geometry = any;
  export type Material = any;
  export type Object3D = any;
  export type Group = any;
  export type BufferGeometry = any;
  export type MeshStandardMaterial = any;
  export type MeshBasicMaterial = any;
  export type AmbientLight = any;
  export type DirectionalLight = any;
  export type PointLight = any;
  export type SpotLight = any;
  export type PerspectiveCamera = any;
  export type OrthographicCamera = any;
  export type Texture = any;
  export type CubeTexture = any;
  export type AnimationMixer = any;
  export type Clock = any;
  export type Raycaster = any;
  export type EventDispatcher = any;
  
  // Export namespace for global THREE usage
  export as namespace THREE;
  
  // Export default for ES module imports
  const THREE: any;
  export default THREE;
}
