import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useChartColors from "../hooks/useChartColors";

function formatCurrency(v) {
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
  return `$${v}`;
}

function CustomTooltip({ active, payload, label, colors }) {
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
      <div>Revenue: ${payload[0].value.toLocaleString()}</div>
      {payload[0].payload.orders !== undefined && <div>Orders: {payload[0].payload.orders.toLocaleString()}</div>}
    </div>
  );
}

export default function RevenueTrendChart({ data }) {
  const colors = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.series[0]} stopOpacity={0.28} />
            <stop offset="100%" stopColor={colors.series[0]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
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
        <Tooltip content={<CustomTooltip colors={colors} />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={colors.series[0]}
          strokeWidth={2}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
