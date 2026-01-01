/**
 * LandingPage - Root page for OpenCatan
 *
 * Wraps the lobby LandingPage component with routing navigation.
 * Provides entry points to create or join a game.
 */

import { LandingPage as LandingPageComponent } from '@/components/lobby';
import { useGameNavigation } from '@/hooks';

/**
 * Landing page with Create/Join options
 *
 * Routes:
 * - Create Game -> /create
 * - Join Game -> /join
 */
export function LandingPage() {
  const { goToCreate, goToJoin } = useGameNavigation();

  return (
    <LandingPageComponent
      onCreateGame={goToCreate}
      onJoinGame={() => goToJoin()}
    />
  );
}

export default LandingPage;
