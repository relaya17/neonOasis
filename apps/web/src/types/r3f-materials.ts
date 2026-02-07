/**
 * Props for <meshStandardMaterial> matching THREE.MeshStandardMaterial.
 * R3F typings don't expose these correctly; use spreadMaterialProps() when passing to <meshStandardMaterial>.
 */
export interface MeshStandardMaterialProps {
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
  transparent?: boolean;
  opacity?: number;
}

/** Return type accepted by R3F meshStandardMaterial (index signature for three.js props). */
type R3FMaterialProps = Record<string, string | number | undefined>;

/**
 * Type-safe spread for meshStandardMaterial. Use: <meshStandardMaterial {...spreadMaterialProps(props)} />
 * Avoids `any` while working around R3F's ExtendedColors typing.
 */
export function spreadMaterialProps(props: MeshStandardMaterialProps): R3FMaterialProps {
  return props as unknown as R3FMaterialProps;
}
