import { useMemo, useState } from "react";
import useChartColors from "../hooks/useChartColors";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ActivityHeatmap({ cells }) {
  const colors = useChartColors();
  const [hovered, setHovered] = useState(null);

  const grid = useMemo(() => {
    const map = new Map();
    let max = 1;
    for (const c of cells) {
      map.set(`${c.weekday}-${c.hour}`, c.orders);
      if (c.orders > max) max = c.orders;
    }
    return { map, max };
  }, [cells]);

  function intensity(count) {
    const t = count / grid.max;
    if (t <= 0) return colors.surface;
    // interpolate between seqStart (light) and seqEnd (dark)
    return t < 0.34 ? colors.seqStart : t < 0.67 ? colors.series[0] : colors.seqEnd;
  }

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-grid">
        <div className="heatmap-corner" />
        {HOURS.filter((h) => h % 3 === 0).map((h) => (
          <div key={h} className="heatmap-hour-label" style={{ gridColumn: `span 3` }}>
            {h}:00
          </div>
        ))}
        {WEEKDAYS.map((day, wIdx) => (
          <div className="heatmap-row" key={day}>
            <div className="heatmap-day-label">{day}</div>
            {HOURS.map((h) => {
              const count = grid.map.get(`${wIdx}-${h}`) || 0;
              return (
                <div
                  key={h}
                  className="heatmap-cell"
                  style={{ background: intensity(count) }}
                  onMouseEnter={() => setHovered({ day, hour: h, count })}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="heatmap-footer">
        <div className="heatmap-legend">
          <span>Fewer orders</span>
          <span className="heatmap-swatch" style={{ background: colors.seqStart }} />
          <span className="heatmap-swatch" style={{ background: colors.series[0] }} />
          <span className="heatmap-swatch" style={{ background: colors.seqEnd }} />
          <span>More orders</span>
        </div>
        {hovered && (
          <div className="heatmap-tooltip">
            {hovered.day} {hovered.hour}:00 — {hovered.count.toLocaleString()} orders
          </div>
        )}
      </div>
    </div>
  );
}
