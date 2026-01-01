/**
 * Slider - Reusable range slider component
 *
 * A styled range input for numeric settings like volume.
 */

import React, { useId } from 'react';
import styles from './ui.module.css';

export interface SliderProps {
  /** Current slider value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Step increment (default: 1) */
  step?: number;
  /** Optional label to display */
  label?: string;
  /** Whether to show the current value (default: true) */
  showValue?: boolean;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
  /** Format function for displaying value */
  formatValue?: (value: number) => string;
}

/**
 * Slider component for numeric settings
 *
 * @param value - Current value
 * @param onChange - Callback when value changes
 * @param min - Minimum value
 * @param max - Maximum value
 * @param step - Step increment
 * @param label - Optional label text
 * @param showValue - Whether to show current value
 * @param disabled - Whether slider is disabled
 * @param className - Additional CSS class
 * @param formatValue - Function to format display value
 */
export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  disabled = false,
  className,
  formatValue,
}) => {
  const id = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  // Calculate percentage for track fill
  const percentage = ((value - min) / (max - min)) * 100;

  // Format the display value
  const displayValue = formatValue ? formatValue(value) : `${value}`;

  return (
    <div className={`${styles.sliderContainer} ${className || ''}`}>
      {(label || showValue) && (
        <div className={styles.sliderHeader}>
          {label && (
            <label htmlFor={id} className={styles.sliderLabel}>
              {label}
            </label>
          )}
          {showValue && <span className={styles.sliderValue}>{displayValue}</span>}
        </div>
      )}
      <div className={styles.sliderWrapper}>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={`${styles.slider} ${disabled ? styles.sliderDisabled : ''}`}
          style={{
            background: `linear-gradient(to right, var(--color-primary) ${percentage}%, var(--color-surface-2) ${percentage}%)`,
          }}
        />
      </div>
    </div>
  );
};

export default Slider;
