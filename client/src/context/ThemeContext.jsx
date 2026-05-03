import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [kidMode, setKidMode] = useState(() => localStorage.getItem('bn-kid-mode') === 'true');

  // Always force dark mode
  useEffect(() => {
    localStorage.setItem('bn-theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('bn-kid-mode', kidMode);
    if (kidMode) {
      document.documentElement.classList.add('kid-mode');
    } else {
      document.documentElement.classList.remove('kid-mode');
    }
  }, [kidMode]);

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {}, kidMode, setKidMode, isLight: false }}>
      {children}
    </ThemeContext.Provider>
  );
}