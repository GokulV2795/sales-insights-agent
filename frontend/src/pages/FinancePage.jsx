import { useEffect, useState } from "react";
import { getFinance, getDateBounds } from "../api/client";
import StatTile from "../components/StatTile";
import MultiLineTrendChart from "../components/MultiLineTrendChart";
import StackedCompositionBar from "../components/StackedCompositionBar";
import Meter from "../components/Meter";
import DateRangeFilter from "../components/DateRangeFilter";

const TREND_SERIES = [
  { key: "revenue", label: "Revenue" },
  { key: "cogs", label: "COGS" },
  { key: "gross_profit", label: "Gross Profit" },
];

export default function FinancePage() {
  const [data, setData] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [range, setRange] = useState({ start: "", end: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDateBounds().then(setBounds).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getFinance(range.start || undefined, range.end || undefined)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [range]);

  if (error) {
    return <div className="page-pad error-box">Failed to load finance data: {error}</div>;
  }

  return (
    <div className="page-pad">
      <div className="page-header">
        <h1>Finance</h1>
        <DateRangeFilter bounds={bounds} range={range} setRange={setRange} />
      </div>

      {loading || !data ? (
        <div className="loading-box">Loading finance data…</div>
      ) : (
        <>
          <div className="stat-grid">
            <StatTile label="Revenue" value={`$${data.summary.revenue.toLocaleString()}`} />
            <StatTile label="COGS" value={`$${data.summary.cogs.toLocaleString()}`} />
            <StatTile label="Gross Profit" value={`$${data.summary.gross_profit.toLocaleString()}`} />
            <StatTile label="Refunded Revenue" value={`$${data.summary.refunded_revenue.toLocaleString()}`} />
          </div>

          <div className="grid-2">
            <div className="card">
              <h2>Profitability</h2>
              <div className="meter-row">
                <Meter value={data.summary.gross_margin_pct} label="Gross Margin" colorIndex={2} />
                <Meter value={data.summary.discount_pct_of_revenue} label="Discount Rate" colorIndex={1} />
              </div>
            </div>
            <div className="card">
              <h2>Revenue, COGS & Gross Profit Trend</h2>
              <MultiLineTrendChart data={data.trend} height={240} series={TREND_SERIES} />
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h2>Revenue by Region</h2>
              <StackedCompositionBar data={data.region_breakdown} labelKey="region" valueKey="revenue" />
            </div>
            <div className="card">
              <h2>Revenue by Channel</h2>
              <StackedCompositionBar data={data.channel_breakdown} labelKey="channel" valueKey="revenue" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
