/**
 * Tabs - Reusable tabbed interface component
 *
 * A styled tabs component for organizing content into multiple panels.
 */

import React, { useState, useId } from 'react';
import styles from './ui.module.css';

export interface Tab {
  /** Unique identifier for the tab */
  id: string;
  /** Display label for the tab */
  label: string;
  /** Content to render when tab is active */
  content: React.ReactNode;
  /** Optional icon to display before label */
  icon?: React.ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
}

export interface TabsProps {
  /** Array of tab definitions */
  tabs: Tab[];
  /** Currently active tab ID (controlled) */
  activeTab?: string;
  /** Callback when active tab changes */
  onChange?: (tabId: string) => void;
  /** Additional class name for the container */
  className?: string;
  /** Tab list alignment */
  align?: 'left' | 'center' | 'stretch';
}

/**
 * Tabs component for organizing content into panels
 *
 * @param tabs - Array of tab definitions
 * @param activeTab - Currently active tab ID
 * @param onChange - Callback when tab changes
 * @param className - Additional CSS class
 * @param align - Tab alignment
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab: controlledActiveTab,
  onChange,
  className,
  align = 'left',
}) => {
  const id = useId();
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id || '');

  // Use controlled or internal state
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab?.disabled) return;

    if (onChange) {
      onChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, tabIndex: number) => {
    const enabledTabs = tabs.filter((t) => !t.disabled);
    const currentEnabledIndex = enabledTabs.findIndex((t) => t.id === tabs[tabIndex].id);

    let nextIndex: number | undefined;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentEnabledIndex > 0 ? currentEnabledIndex - 1 : enabledTabs.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = currentEnabledIndex < enabledTabs.length - 1 ? currentEnabledIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = enabledTabs.length - 1;
        break;
    }

    if (nextIndex !== undefined) {
      const nextTab = enabledTabs[nextIndex];
      handleTabClick(nextTab.id);
      // Focus the next tab button
      const button = document.getElementById(`${id}-tab-${nextTab.id}`);
      button?.focus();
    }
  };

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={`${styles.tabsContainer} ${className || ''}`}>
      <div
        className={`${styles.tabList} ${styles[`tabList${align.charAt(0).toUpperCase() + align.slice(1)}`]}`}
        role="tablist"
        aria-label="Settings tabs"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`${id}-tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${id}-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            disabled={tab.disabled}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''} ${tab.disabled ? styles.tabDisabled : ''}`}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div
        id={`${id}-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${activeTab}`}
        className={styles.tabPanel}
      >
        {activeContent}
      </div>
    </div>
  );
};

export default Tabs;
