import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useChartColors from "../hooks/useChartColors";

function CustomTooltip({ active, payload, label, colors, valueLabel, formatValue }) {
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
      <div>
        {valueLabel}: {formatValue(payload[0].value)}
      </div>
    </div>
  );
}

export default function SimpleAreaChart({
  data,
  dataKey,
  labelKey = "period",
  valueLabel = "Value",
  formatValue = (v) => v.toLocaleString(),
  height = 260,
  seriesIndex = 0,
}) {
  const colors = useChartColors();
  const gradientId = `simpleAreaFill-${dataKey}`;
  const color = colors.series[seriesIndex];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.gridline} vertical={false} />
        <XAxis
          dataKey={labelKey}
          tick={{ fill: colors.textMuted, fontSize: 12 }}
          axisLine={{ stroke: colors.axis }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: colors.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<CustomTooltip colors={colors} valueLabel={valueLabel} formatValue={formatValue} />} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
