/**
 * Typed useDispatch hook for OpenCatan Redux store
 *
 * Use this hook instead of plain `useDispatch` to get proper type inference,
 * especially for async thunk actions.
 *
 * @example
 * ```typescript
 * import { useAppDispatch } from '@/hooks/useAppDispatch';
 * import { setPhase, addResources } from '@/game/state';
 *
 * function MyComponent() {
 *   const dispatch = useAppDispatch();
 *
 *   const handleClick = () => {
 *     dispatch(setPhase('playing'));
 *     dispatch(addResources({ playerId: '123', resources: { brick: 1 } }));
 *   };
 *
 *   return <button onClick={handleClick}>Start</button>;
 * }
 * ```
 */

import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/game/state/store';

/**
 * Typed useDispatch hook for the OpenCatan Redux store
 *
 * This hook is a typed wrapper around useDispatch that provides
 * proper TypeScript inference for dispatching actions.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

export default useAppDispatch;
