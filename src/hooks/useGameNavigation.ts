/**
 * useGameNavigation - Navigation helper hook for OpenCatan
 *
 * Provides convenient navigation methods for the game flow:
 * Landing -> Create/Join -> Lobby -> Game
 */

import { useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export interface UseGameNavigationReturn {
  /** Navigate to the game lobby for a room */
  goToLobby: (roomCode: string) => void;
  /** Navigate to the active game */
  goToGame: (roomCode: string) => void;
  /** Navigate to the landing page */
  goToLanding: () => void;
  /** Navigate to create room page */
  goToCreate: () => void;
  /** Navigate to join room page, optionally with pre-filled code */
  goToJoin: (code?: string) => void;
}

/**
 * Hook providing navigation methods for game flow
 *
 * @returns Object with navigation methods
 */
export function useGameNavigation(): UseGameNavigationReturn {
  const navigate = useNavigate();

  const goToLobby = useCallback(
    (roomCode: string) => {
      navigate(`/${roomCode.toUpperCase()}`);
    },
    [navigate]
  );

  const goToGame = useCallback(
    (roomCode: string) => {
      navigate(`/${roomCode.toUpperCase()}`);
    },
    [navigate]
  );

  const goToLanding = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const goToCreate = useCallback(() => {
    navigate('/create');
  }, [navigate]);

  const goToJoin = useCallback(
    (code?: string) => {
      if (code) {
        navigate(`/join/${code.toUpperCase()}`);
      } else {
        navigate('/join');
      }
    },
    [navigate]
  );

  return useMemo(
    () => ({
      goToLobby,
      goToGame,
      goToLanding,
      goToCreate,
      goToJoin,
    }),
    [goToLobby, goToGame, goToLanding, goToCreate, goToJoin]
  );
}

export default useGameNavigation;
