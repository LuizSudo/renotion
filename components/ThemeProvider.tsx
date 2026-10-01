"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme store
let themeStore: { theme: Theme; resolvedTheme: "light" | "dark" } = {
  theme: "system",
  resolvedTheme: "light",
};

const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((callback) => callback());
}

function getThemeSnapshot() {
  return themeStore;
}

function getThemeServerSnapshot() {
  return { theme: "system" as Theme, resolvedTheme: "light" as const };
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  const { theme, resolvedTheme } = snapshot;
  
  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    let resolved: "light" | "dark";
    if (newTheme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      resolved = newTheme;
    }
    themeStore = { theme: newTheme, resolvedTheme: resolved };
    notifySubscribers();
  };

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Fallback for static generation
    return { theme: "system" as Theme, resolvedTheme: "light" as "light" | "dark", setTheme: () => {} };
  }
  return context;
}