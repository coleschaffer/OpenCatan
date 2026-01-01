/**
 * DiceDistribution - Visual dice roll histogram
 *
 * Displays:
 * - Bar chart showing 2-12 distribution
 * - Expected vs actual comparison
 * - Notable streaks highlighted
 */

import React, { useMemo } from 'react';
import { getExpectedDiceDistribution } from '../../game/engine/statsTracker';
import styles from './victory.module.css';

/**
 * Props for DiceDistribution component
 */
export interface DiceDistributionProps {
  /** Count of each dice roll (2-12) */
  rollCounts: Record<number, number>;
  /** Total number of rolls */
  totalRolls: number;
  /** Whether to show expected distribution comparison */
  showExpected?: boolean;
}

/**
 * Dice numbers in order
 */
const DICE_VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Probability dots for each dice value (showing how likely)
 */
const PROBABILITY_DOTS: Record<number, number> = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};

/**
 * DiceDistribution component displays a histogram of dice rolls
 */
export const DiceDistribution: React.FC<DiceDistributionProps> = ({
  rollCounts,
  totalRolls,
  showExpected = true,
}) => {
  // Calculate max count for scaling
  const maxCount = useMemo(() => {
    let max = 0;
    DICE_VALUES.forEach((roll) => {
      const count = rollCounts[roll] || 0;
      if (count > max) max = count;
    });
    return max || 1;
  }, [rollCounts]);

  // Calculate expected distribution
  const expected = useMemo(
    () => getExpectedDiceDistribution(totalRolls),
    [totalRolls]
  );

  // Find notable statistics
  const stats = useMemo(() => {
    let mostRolled = { value: 7, count: 0 };
    let leastRolled = { value: 7, count: Infinity };
    let sevensCount = rollCounts[7] || 0;

    DICE_VALUES.forEach((roll) => {
      const count = rollCounts[roll] || 0;
      if (count > mostRolled.count) {
        mostRolled = { value: roll, count };
      }
      if (count < leastRolled.count) {
        leastRolled = { value: roll, count };
      }
    });

    // Calculate chi-squared statistic for "luck" indication
    let chiSquared = 0;
    DICE_VALUES.forEach((roll) => {
      const actual = rollCounts[roll] || 0;
      const exp = expected[roll] || 0;
      if (exp > 0) {
        chiSquared += Math.pow(actual - exp, 2) / exp;
      }
    });

    return {
      mostRolled,
      leastRolled,
      sevensCount,
      sevensPercent: totalRolls > 0 ? ((sevensCount / totalRolls) * 100).toFixed(1) : '0',
      expectedSevensPercent: '16.7', // 6/36 = 16.67%
      isUnlucky: chiSquared > 19.68, // 95% confidence level for df=10
    };
  }, [rollCounts, expected, totalRolls]);

  if (totalRolls === 0) {
    return (
      <div className={styles.diceDistributionSection}>
        <h3 className={styles.sectionTitle}>Dice Roll Distribution</h3>
        <p className={styles.noDataText}>No dice rolls recorded</p>
      </div>
    );
  }

  return (
    <div className={styles.diceDistributionSection}>
      <h3 className={styles.sectionTitle}>Dice Roll Distribution</h3>

      {/* Histogram */}
      <div className={styles.diceHistogram}>
        {DICE_VALUES.map((roll) => {
          const count = rollCounts[roll] || 0;
          const expectedCount = expected[roll] || 0;
          const barHeight = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const expectedHeight = maxCount > 0 ? (expectedCount / maxCount) * 100 : 0;
          const isSeven = roll === 7;
          const isHighest = count === stats.mostRolled.count && count > 0;
          const isAboveExpected = count > expectedCount * 1.2;
          const isBelowExpected = count < expectedCount * 0.8;

          return (
            <div key={roll} className={styles.diceBarColumn}>
              {/* Actual bar */}
              <div className={styles.diceBarContainer}>
                {/* Expected indicator line */}
                {showExpected && totalRolls > 10 && (
                  <div
                    className={styles.diceExpectedLine}
                    style={{ bottom: `${expectedHeight}%` }}
                    title={`Expected: ${expectedCount}`}
                  />
                )}

                {/* Actual bar */}
                <div
                  className={`${styles.diceBar} ${isSeven ? styles.diceBarSeven : ''} ${isHighest ? styles.diceBarHighest : ''}`}
                  style={{ height: `${barHeight}%` }}
                >
                  {/* Count label inside bar if tall enough */}
                  {barHeight > 20 && (
                    <span className={styles.diceBarCountInside}>{count}</span>
                  )}
                </div>

                {/* Count label outside bar if short */}
                {barHeight <= 20 && count > 0 && (
                  <span className={styles.diceBarCountOutside}>{count}</span>
                )}
              </div>

              {/* Dice value label */}
              <div className={`${styles.diceValueLabel} ${isSeven ? styles.diceValueLabelSeven : ''}`}>
                {roll}
              </div>

              {/* Probability dots */}
              <div className={styles.probabilityDots}>
                {Array.from({ length: PROBABILITY_DOTS[roll] }).map((_, i) => (
                  <span key={i} className={styles.probabilityDot} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {showExpected && totalRolls > 10 && (
        <div className={styles.diceLegend}>
          <div className={styles.diceLegendItem}>
            <div className={styles.diceLegendActual} />
            <span>Actual</span>
          </div>
          <div className={styles.diceLegendItem}>
            <div className={styles.diceLegendExpected} />
            <span>Expected</span>
          </div>
        </div>
      )}

      {/* Statistics summary */}
      <div className={styles.diceStats}>
        <div className={styles.diceStatItem}>
          <span className={styles.diceStatLabel}>Most Rolled</span>
          <span className={styles.diceStatValue}>
            {stats.mostRolled.value} ({stats.mostRolled.count}x)
          </span>
        </div>
        <div className={styles.diceStatItem}>
          <span className={styles.diceStatLabel}>Least Rolled</span>
          <span className={styles.diceStatValue}>
            {stats.leastRolled.value} ({stats.leastRolled.count}x)
          </span>
        </div>
        <div className={styles.diceStatItem}>
          <span className={styles.diceStatLabel}>Sevens</span>
          <span className={styles.diceStatValue}>
            {stats.sevensCount} ({stats.sevensPercent}%)
          </span>
        </div>
        <div className={styles.diceStatItem}>
          <span className={styles.diceStatLabel}>Expected 7s</span>
          <span className={styles.diceStatValue}>{stats.expectedSevensPercent}%</span>
        </div>
      </div>
    </div>
  );
};

export default DiceDistribution;
