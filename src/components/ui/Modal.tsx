/**
 * Modal - Base modal component for overlays
 *
 * A reusable modal component with backdrop, animations, focus trap,
 * and keyboard handling.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import styles from './ui.module.css';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Optional title for the modal header */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Size variant for the modal */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the close button in header (default: true) */
  showCloseButton?: boolean;
  /** Whether clicking backdrop closes the modal (default: true) */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes the modal (default: true) */
  closeOnEscape?: boolean;
  /** Additional class name for the modal content */
  className?: string;
  /** Footer content (buttons, etc.) */
  footer?: React.ReactNode;
}

/**
 * Base Modal component with backdrop, animations, and keyboard handling
 *
 * Features:
 * - Click outside to close (optional)
 * - Escape key to close
 * - Focus trap
 * - Animated open/close
 *
 * @param isOpen - Whether modal is visible
 * @param onClose - Callback to close modal
 * @param title - Optional header title
 * @param children - Modal body content
 * @param size - Modal size variant
 * @param showCloseButton - Whether to show X button
 * @param closeOnBackdropClick - Close when clicking backdrop
 * @param closeOnEscape - Close when pressing Escape
 * @param className - Additional CSS class
 * @param footer - Optional footer content
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  footer,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle Escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }

      // Focus trap
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [closeOnEscape, onClose]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose]
  );

  // Focus management and event listeners
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Add event listener
      document.addEventListener('keydown', handleKeyDown);

      // Focus the modal
      const timer = setTimeout(() => {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusableElements?.[0]?.focus();
      }, 0);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        clearTimeout(timer);

        // Restore focus to previous element
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  const sizeClass = {
    small: styles.modalSmall,
    medium: styles.modalMedium,
    large: styles.modalLarge,
  }[size];

  return (
    <div
      className={styles.modalBackdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={`${styles.modal} ${sizeClass} ${className || ''}`}
        role="document"
      >
        {(title || showCloseButton) && (
          <div className={styles.modalHeader}>
            {title && (
              <h2 id="modal-title" className={styles.modalTitle}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                className={styles.modalCloseButton}
                onClick={onClose}
                aria-label="Close modal"
                type="button"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className={styles.modalContent}>{children}</div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
