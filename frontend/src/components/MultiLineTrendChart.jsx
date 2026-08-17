import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useChartColors from "../hooks/useChartColors";

function formatCurrency(v) {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`;
  return `$${v}`;
}

function CustomTooltip({ active, payload, label, colors, series }) {
  if (!active || !payload || !payload.length) return null;
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
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {series.map((s, i) => {
        const point = payload.find((p) => p.dataKey === s.key);
        if (!point) return null;
        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.series[i], display: "inline-block" }} />
            {s.label}: ${point.value.toLocaleString()}
          </div>
        );
      })}
    </div>
  );
}

/** series: [{ key: "revenue", label: "Revenue" }, ...] — plotted on one shared $ axis. */
export default function MultiLineTrendChart({ data, series, height = 300 }) {
  const colors = useChartColors();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={colors.gridline} vertical={false} />
        <XAxis
          dataKey="period"
          tick={{ fill: colors.textMuted, fontSize: 12 }}
          axisLine={{ stroke: colors.axis }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatCurrency}
          tick={{ fill: colors.textMuted, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip colors={colors} series={series} />} />
        <Legend
          verticalAlign="top"
          height={32}
          formatter={(value) => <span style={{ color: colors.textSecondary, fontSize: 12 }}>{value}</span>}
        />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={colors.series[i]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
