import React from 'react';
import { usePlane } from '@react-three/cannon';
import { spreadMaterialProps } from '../../types/r3f-materials';
import { useBackgammonStore } from './store';

export function Board() {
  const { state } = useBackgammonStore();
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0] }));

  return (
    <group>
      {/* בסיס הלוח - עץ אגוז עמוק */}
      <mesh ref={ref as React.RefObject<unknown>} receiveShadow>
        <planeGeometry args={[14, 18]} />
        <meshStandardMaterial {...spreadMaterialProps({ color: '#0a0a0a', roughness: 1 })} />
      </mesh>

      {/* מסגרת זהב יוקרתית */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[14.5, 0.3, 18.5]} />
        <meshStandardMaterial {...spreadMaterialProps({ color: '#ffd700', metalness: 1, roughness: 0.2 })} />
      </mesh>

      {/* רינדור הכלים (Checkers) */}
      {state.board.map((count, index) => {
         // לוגיקת מיקום הכלים על הלוח (כפי שמופיעה בקוד הקודם שלך)
         return null; // יש להכניס כאן את renderCheckers מהקובץ הקודם
      })}
    </group>
  );
}