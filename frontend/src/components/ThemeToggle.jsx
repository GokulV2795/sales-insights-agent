import useTheme from "../hooks/useTheme";
import { IconMoon, IconSun } from "./icons";

export default function ThemeToggle() {
  const [isDark, toggle] = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
    >
      <span className="theme-toggle-icon">
        <IconSun width={13} height={13} />
      </span>
      <span className="theme-toggle-icon">
        <IconMoon width={13} height={13} />
      </span>
      <span className="theme-toggle-thumb">{isDark ? <IconMoon width={12} height={12} /> : <IconSun width={12} height={12} />}</span>
    </button>
  );
}
