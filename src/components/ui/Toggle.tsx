/**
 * Toggle - Reusable toggle switch component
 *
 * A styled toggle switch for boolean settings.
 */

import React from 'react';
import styles from './ui.module.css';

export interface ToggleProps {
  /** Whether the toggle is checked/on */
  checked: boolean;
  /** Callback when toggle state changes */
  onChange: (checked: boolean) => void;
  /** Optional label to display next to the toggle */
  label?: string;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** ID for the input element (for accessibility) */
  id?: string;
  /** Additional class name */
  className?: string;
}

/**
 * Toggle switch component for boolean settings
 *
 * @param checked - Current toggle state
 * @param onChange - Callback when state changes
 * @param label - Optional label text
 * @param disabled - Whether toggle is disabled
 * @param id - Optional ID for the input
 * @param className - Additional CSS class
 */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  className,
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <div className={`${styles.toggleContainer} ${className || ''}`}>
      {label && (
        <label htmlFor={id} className={styles.toggleLabel}>
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`${styles.toggle} ${checked ? styles.toggleOn : ''} ${disabled ? styles.toggleDisabled : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.toggleThumb} />
      </button>
    </div>
  );
};

export default Toggle;
