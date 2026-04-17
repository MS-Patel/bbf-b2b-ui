import { useEffect } from "react";
import { useUiStore } from "@/stores/ui-store";

/**
 * Applies persisted theme to <html> on mount.
 * Mount once at the top of the app shell.
 */
export function ThemeApplier() {
  const theme = useUiStore((s) => s.theme);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);
  return null;
}
