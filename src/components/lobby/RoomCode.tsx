import { useState, useCallback } from 'react';
import styles from './lobby.module.css';

interface RoomCodeProps {
  code: string;
}

/**
 * RoomCode - Large display of room code with copy functionality
 *
 * Features:
 * - Large, prominent room code display
 * - "Copy Code" button with success feedback
 * - "Copy Link" button (copies shareable URL)
 * - Visual feedback on copy success
 */
export function RoomCode({ code }: RoomCodeProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }, [code]);

  const handleCopyLink = useCallback(async () => {
    const shareUrl = `${window.location.origin}/join/${code}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [code]);

  return (
    <div className={styles.roomCodeContainer}>
      <span className={styles.roomCodeLabel}>Room Code</span>
      <span className={styles.roomCodeDisplay}>{code}</span>
      <div className={styles.roomCodeActions}>
        <button
          type="button"
          className={`${styles.roomCodeCopyButton} ${copiedCode ? styles.copied : ''}`}
          onClick={handleCopyCode}
          aria-label={copiedCode ? 'Code copied!' : 'Copy room code'}
        >
          {copiedCode ? (
            <>
              <CheckIcon />
              Copied!
            </>
          ) : (
            <>
              <CopyIcon />
              Copy Code
            </>
          )}
        </button>
        <button
          type="button"
          className={`${styles.roomCodeShareButton} ${copiedLink ? styles.copied : ''}`}
          onClick={handleCopyLink}
          aria-label={copiedLink ? 'Link copied!' : 'Copy room link'}
        >
          {copiedLink ? (
            <>
              <CheckIcon />
              Copied!
            </>
          ) : (
            <>
              <LinkIcon />
              Copy Link
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Simple SVG icons
function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export default RoomCode;
