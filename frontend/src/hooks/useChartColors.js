import { useEffect, useState } from "react";
import { getIsDark, subscribeTheme } from "./theme";

const LIGHT = {
  series: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"],
  gridline: "#e1e0d9",
  axis: "#c3c2b7",
  textMuted: "#898781",
  textSecondary: "#52514e",
  surface: "#fcfcfb",
  seqStart: "#cde2fb",
  seqEnd: "#104281",
};

const DARK = {
  series: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300"],
  gridline: "#2c2c2a",
  axis: "#383835",
  textMuted: "#898781",
  textSecondary: "#c3c2b7",
  surface: "#1a1a19",
  seqStart: "#1c5cab",
  seqEnd: "#0d366b",
};

export default function useChartColors() {
  const [isDark, setIsDark] = useState(getIsDark);

  useEffect(() => subscribeTheme(() => setIsDark(getIsDark())), []);

  return isDark ? DARK : LIGHT;
}
