import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import useChartColors from "../hooks/useChartColors";

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
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
      <div>Revenue: ${p.revenue.toLocaleString()}</div>
      <div>Margin: {p.margin_pct}%</div>
      <div>Units sold: {p.units_sold.toLocaleString()}</div>
    </div>
  );
}

/** Revenue (x) vs margin % (y), bubble size = units sold. One hue — bubbles are the same series. */
export default function ScatterBubbleChart({ data, height = 320 }) {
  const colors = useChartColors();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 12, right: 20, left: 0, bottom: 4 }}>
        <CartesianGrid stroke={colors.gridline} />
        <XAxis
          type="number"
          dataKey="revenue"
          name="Revenue"
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fill: colors.textMuted, fontSize: 12 }}
          axisLine={{ stroke: colors.axis }}
          tickLine={false}
        />
        <YAxis
          type="number"
          dataKey="margin_pct"
          name="Margin %"
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: colors.textMuted, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <ZAxis type="number" dataKey="units_sold" range={[80, 900]} />
        <Tooltip content={<CustomTooltip colors={colors} />} cursor={{ stroke: colors.gridline }} />
        <Scatter data={data} fill={colors.series[0]} fillOpacity={0.65} stroke={colors.series[0]} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
