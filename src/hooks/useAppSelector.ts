/**
 * Typed useSelector hook for OpenCatan Redux store
 *
 * Use this hook instead of plain `useSelector` to get proper type inference.
 *
 * @example
 * ```typescript
 * import { useAppSelector } from '@/hooks/useAppSelector';
 *
 * function MyComponent() {
 *   const phase = useAppSelector((state) => state.game.phase);
 *   const players = useAppSelector((state) => state.players.players);
 *   return <div>{phase}</div>;
 * }
 * ```
 */

import { useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '@/game/state/store';

/**
 * Typed useSelector hook for the OpenCatan Redux store
 *
 * This hook is a typed wrapper around useSelector that provides
 * proper TypeScript inference for the Redux state.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default useAppSelector;
