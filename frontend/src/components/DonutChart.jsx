import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import useChartColors from "../hooks/useChartColors";
import { formatCurrencyCompact } from "../utils/format";

function CustomTooltip({ active, payload, colors }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.gridline}`,
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 13,
        color: colors.textSecondary,
      }}
    >
      <div style={{ fontWeight: 600 }}>{p.label}</div>
      <div>{formatCurrencyCompact(p.value)}</div>
    </div>
  );
}

export default function DonutChart({ data, labelKey, valueKey, height = 220 }) {
  const colors = useChartColors();
  const chartData = data.map((d) => ({ label: d[labelKey], value: d[valueKey] }));
  const total = chartData.reduce((sum, d) => sum + d.value, 0) || 1;

  return (
    <div className="donut-wrap">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={colors.series[i % colors.series.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip colors={colors} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="donut-legend">
        {chartData.map((d, i) => (
          <div key={d.label} className="donut-legend-item">
            <span className="legend-swatch" style={{ background: colors.series[i % colors.series.length] }} />
            <span className="legend-label">{d.label}</span>
            <span className="legend-value">{((d.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
