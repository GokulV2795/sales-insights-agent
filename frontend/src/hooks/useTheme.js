import { useEffect, useState } from "react";
import { getIsDark, subscribeTheme, toggleTheme } from "./theme";

export default function useTheme() {
  const [isDark, setIsDark] = useState(getIsDark);
  useEffect(() => subscribeTheme(() => setIsDark(getIsDark())), []);
  return [isDark, toggleTheme];
}
