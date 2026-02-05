import { useGameStore } from './store';

/** Board UI — will use React Three Fiber for 3D; placeholder for MVP */
export function GameBoard() {
  const { state } = useGameStore();
  if (!state) return <div>No game</div>;
  return <div data-game={state.kind}>Game board — {state.kind}</div>;
}
