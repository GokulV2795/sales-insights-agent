import useChartColors from "../hooks/useChartColors";

/** A single 100%-stacked horizontal bar for part-to-whole composition, with a legend. */
export default function StackedCompositionBar({ data, labelKey, valueKey }) {
  const colors = useChartColors();
  const total = data.reduce((sum, d) => sum + d[valueKey], 0) || 1;

  return (
    <div className="composition-bar-wrap">
      <div className="composition-bar">
        {data.map((d, i) => {
          const pct = (d[valueKey] / total) * 100;
          return (
            <div
              key={d[labelKey]}
              className="composition-segment"
              style={{ width: `${pct}%`, background: colors.series[i % colors.series.length] }}
              title={`${d[labelKey]}: ${pct.toFixed(1)}%`}
            />
          );
        })}
      </div>
      <div className="composition-legend">
        {data.map((d, i) => {
          const pct = (d[valueKey] / total) * 100;
          return (
            <div key={d[labelKey]} className="composition-legend-item">
              <span className="legend-swatch" style={{ background: colors.series[i % colors.series.length] }} />
              <span className="legend-label">{d[labelKey]}</span>
              <span className="legend-value">{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
