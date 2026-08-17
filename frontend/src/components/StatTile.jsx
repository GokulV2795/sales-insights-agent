const BADGE_COLORS = [
  { bg: "var(--badge-blue-bg)", fg: "var(--series-1)" },
  { bg: "var(--badge-green-bg)", fg: "var(--series-3)" },
  { bg: "var(--badge-orange-bg)", fg: "var(--series-2)" },
  { bg: "var(--badge-violet-bg)", fg: "var(--badge-violet-fg)" },
  { bg: "var(--badge-pink-bg)", fg: "var(--series-5)" },
  { bg: "var(--badge-amber-bg)", fg: "var(--series-4)" },
];

export default function StatTile({
  label,
  value,
  delta,
  deltaGood,
  deltaSuffix = "vs last month",
  icon: Icon,
  colorIndex = 0,
  wide = false,
  children,
}) {
  const badge = BADGE_COLORS[colorIndex % BADGE_COLORS.length];

  return (
    <div className={`stat-tile ${wide ? "stat-tile-wide" : ""}`}>
      <div className="stat-tile-main">
        <div className="stat-tile-header">
          {Icon && (
            <span className="stat-icon-badge" style={{ background: badge.bg, color: badge.fg }}>
              <Icon width={16} height={16} />
            </span>
          )}
          <span className="stat-label">{label}</span>
        </div>
        <div className="stat-value">{value}</div>
        {delta !== undefined && delta !== null && (
          <div className={`stat-delta ${deltaGood ? "good" : "bad"}`}>
            {deltaGood ? "↗" : "↘"} {delta}
            <span className="stat-delta-suffix"> {deltaSuffix}</span>
          </div>
        )}
      </div>
      {wide && children && <div className="stat-tile-spark">{children}</div>}
    </div>
  );
}
