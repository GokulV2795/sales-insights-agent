import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useChartColors from "../hooks/useChartColors";
import { formatCompact } from "../utils/format";

function CustomTooltip({ active, payload, colors, valueLabel, valuePrefix }) {
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
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.label}</div>
      <div>
        {valueLabel}: {valuePrefix}
        {p.value.toLocaleString()}
      </div>
    </div>
  );
}

function defaultTickFormat(v) {
  return Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`;
}

export default function BreakdownBarChart({
  data,
  dataKey,
  labelKey,
  valueLabel = "Revenue",
  valuePrefix = "$",
  height = 280,
  tickFormatter,
  showValueLabels = true,
}) {
  const colors = useChartColors();
  const chartData = data.map((d) => ({ label: d[labelKey], value: d[dataKey] }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: showValueLabels ? 48 : 24, left: 8, bottom: 4 }}>
        <CartesianGrid stroke={colors.gridline} horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={tickFormatter || defaultTickFormat}
          tick={{ fill: colors.textMuted, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: colors.textSecondary, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip
          content={<CustomTooltip colors={colors} valueLabel={valueLabel} valuePrefix={valuePrefix} />}
          cursor={{ fill: colors.gridline, opacity: 0.4 }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={colors.series[0]} />
          ))}
          {showValueLabels && (
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v) => `${valuePrefix}${formatCompact(v)}`}
              style={{ fill: colors.textSecondary, fontSize: 12, fontWeight: 600 }}
            />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
