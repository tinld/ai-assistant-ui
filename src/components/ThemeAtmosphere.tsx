import React, { useEffect, useRef, useState } from 'react';

type ThemeMode = 'light' | 'dark';
type ThemeTransitionDirection = 'light-to-dark' | 'dark-to-light';

interface ThemeAtmosphereProps {
  theme: ThemeMode;
}

const CLASS_APPLY_DELAY_MS = 180;
const TRANSITION_DURATION_MS = 1080;

const applyThemeClass = (theme: ThemeMode): void => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.dataset.theme = theme;
};

export const ThemeAtmosphere: React.FC<ThemeAtmosphereProps> = ({ theme }) => {
  const previousThemeRef = useRef<ThemeMode>(theme);
  const [direction, setDirection] = useState<ThemeTransitionDirection | null>(null);

  useEffect(() => {
    const previousTheme = previousThemeRef.current;
    if (previousTheme === theme) {
      applyThemeClass(theme);
      return;
    }

    const nextDirection: ThemeTransitionDirection = previousTheme === 'light' ? 'light-to-dark' : 'dark-to-light';
    const root = document.documentElement;

    setDirection(nextDirection);
    root.classList.add('theme-transitioning');
    root.dataset.themeShift = nextDirection;

    const applyTimer = window.setTimeout(() => {
      applyThemeClass(theme);
    }, CLASS_APPLY_DELAY_MS);

    const cleanupTimer = window.setTimeout(() => {
      root.classList.remove('theme-transitioning');
      delete root.dataset.themeShift;
      previousThemeRef.current = theme;
      setDirection(null);
    }, TRANSITION_DURATION_MS);

    return () => {
      window.clearTimeout(applyTimer);
      window.clearTimeout(cleanupTimer);
      root.classList.remove('theme-transitioning');
      delete root.dataset.themeShift;
      applyThemeClass(theme);
      previousThemeRef.current = theme;
    };
  }, [theme]);

  return (
    <div
      className={`theme-atmosphere ${direction ? `theme-atmosphere--${direction}` : ''}`}
      aria-hidden="true"
    />
  );
};
