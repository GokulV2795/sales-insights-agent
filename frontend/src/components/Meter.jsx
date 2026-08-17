import useChartColors from "../hooks/useChartColors";

/** A single ratio against a 0-100 limit, drawn as a radial progress ring. */
export default function Meter({ value, label, caption, size = 132, colorIndex = 0, max = 100 }) {
  const colors = useChartColors();
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value / max));
  const offset = circumference * (1 - pct);
  const color = colors.series[colorIndex];

  return (
    <div className="meter">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.gridline}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.19}
          fontWeight="700"
          fill={colors.textSecondary}
        >
          {value}%
        </text>
      </svg>
      <div className="meter-label">{label}</div>
      {caption && <div className="meter-caption">{caption}</div>}
    </div>
  );
}
