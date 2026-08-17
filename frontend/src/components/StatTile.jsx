export default function StatTile({ label, value, delta, deltaGood }) {
  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {delta !== undefined && delta !== null && (
        <div className={`stat-delta ${deltaGood ? "good" : "bad"}`}>
          {deltaGood ? "▲" : "▼"} {delta}
        </div>
      )}
    </div>
  );
}
