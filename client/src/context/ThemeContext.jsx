import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [theme, setTheme]   = useState(() => localStorage.getItem('bn-theme') || 'dark');
  const [kidMode, setKidMode] = useState(() => localStorage.getItem('bn-kid-mode') === 'true');

  useEffect(() => {
    localStorage.setItem('bn-theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('bn-kid-mode', kidMode);
    if (kidMode) {
      document.documentElement.classList.add('kid-mode');
    } else {
      document.documentElement.classList.remove('kid-mode');
    }
  }, [kidMode]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, kidMode, setKidMode, isLight: theme === 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}
