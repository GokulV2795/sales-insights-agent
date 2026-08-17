export default function DateRangeFilter({ bounds, range, setRange }) {
  return (
    <div className="filter-row">
      <label>
        From
        <input
          type="date"
          min={bounds?.min_date}
          max={bounds?.max_date}
          value={range.start}
          onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
        />
      </label>
      <label>
        To
        <input
          type="date"
          min={bounds?.min_date}
          max={bounds?.max_date}
          value={range.end}
          onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
        />
      </label>
      {(range.start || range.end) && (
        <button className="btn-ghost" onClick={() => setRange({ start: "", end: "" })}>
          Clear
        </button>
      )}
    </div>
  );
}
