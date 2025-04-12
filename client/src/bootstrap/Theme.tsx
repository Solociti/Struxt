import { createContext, useContext, useEffect, useState } from "react";

export type ThemeTypes = "dark" | "light" | "system";

/**
 * The theme context is the value that is passed to the ThemeProvider
 */
interface ThemeContextValue {
  theme: "dark" | "light";
  setTheme: (theme: ThemeTypes) => void;
}

/**
 * Get the system preferred theme
 *
 * @returns
 */
const getSystemTheme = () => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

/**
 * The theme context is used to provide the theme to the application
 */
const ThemeContext = createContext<ThemeContextValue>({
  theme: getSystemTheme(),
  setTheme: () => {},
});

/**
 * Get the stored theme from local storage
 *
 * @returns
 */
const getStoredTheme = () => {
  const storedTheme = localStorage.getItem("theme");
  if (typeof storedTheme === "string" && storedTheme) {
    return storedTheme as ThemeTypes;
  }

  return "system";
};

/**
 * Set the stored theme in local storage
 *
 * @param theme
 */
const setStoredTheme = (theme: ThemeTypes) => {
  localStorage.setItem("theme", theme);
};

/**
 * Keeps track of the currently selected theme
 *
 * @param param0
 * @returns
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeTypes>(() => getStoredTheme());
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(() =>
    getSystemTheme()
  );

  const currentTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    // update the document body to set the theme
    if (currentTheme === "dark") {
      document.body.setAttribute("data-bs-theme", "dark");
    } else {
      document.body.removeAttribute("data-bs-theme");
    }
  }, [currentTheme]);

  useEffect(() => {
    // Listen for system theme changes
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", handleSystemThemeChange);

    return () => {
      mq.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        setTheme: (theme: ThemeTypes) => {
          setStoredTheme(theme);
          setTheme(theme);
        },
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Get the current theme from the context
 *
 * @returns
 */
export function useTheme() {
  const result = useContext(ThemeContext);

  return result;
}
