import styles from './lobby.module.css';

interface LandingPageProps {
  onCreateGame: () => void;
  onJoinGame: () => void;
}

/**
 * LandingPage - Home page with Create/Join options
 *
 * Features:
 * - OpenCatan branding/logo area
 * - Create Game button
 * - Join Game button
 * - Simple, clean design
 */
export function LandingPage({ onCreateGame, onJoinGame }: LandingPageProps) {
  return (
    <div className={styles.landingContainer}>
      <div className={styles.landingLogo}>
        <CatanLogo />
      </div>
      <h1 className={styles.landingTitle}>OpenCatan</h1>
      <p className={styles.landingSubtitle}>
        The classic board game, now online with friends
      </p>

      <div className={styles.landingActions}>
        <button
          type="button"
          className={`${styles.landingButton} ${styles.landingButtonPrimary}`}
          onClick={onCreateGame}
        >
          Create Game
        </button>
        <button
          type="button"
          className={styles.landingButton}
          onClick={onJoinGame}
        >
          Join Game
        </button>
      </div>
    </div>
  );
}

/**
 * Simple Catan-style hexagon logo
 */
function CatanLogo() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer hexagon */}
      <path
        d="M60 5L105 30V80L60 105L15 80V30L60 5Z"
        fill="url(#hexGradient)"
        stroke="#ffd700"
        strokeWidth="3"
      />
      {/* Inner hexagon pattern */}
      <path
        d="M60 20L90 37.5V72.5L60 90L30 72.5V37.5L60 20Z"
        fill="none"
        stroke="rgba(255,215,0,0.5)"
        strokeWidth="2"
      />
      {/* Center dot */}
      <circle cx="60" cy="55" r="8" fill="#ffd700" />
      {/* Resource dots */}
      <circle cx="42" cy="42" r="4" fill="rgba(255,215,0,0.7)" />
      <circle cx="78" cy="42" r="4" fill="rgba(255,215,0,0.7)" />
      <circle cx="42" cy="68" r="4" fill="rgba(255,215,0,0.7)" />
      <circle cx="78" cy="68" r="4" fill="rgba(255,215,0,0.7)" />
      <defs>
        <linearGradient id="hexGradient" x1="15" y1="5" x2="105" y2="105">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#0f3460" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default LandingPage;
