import { useEffect, useState } from "react";
import { getFinance, getDateBounds } from "../api/client";
import StatTile from "../components/StatTile";
import MultiLineTrendChart from "../components/MultiLineTrendChart";
import DonutChart from "../components/DonutChart";
import Meter from "../components/Meter";
import DateRangeFilter from "../components/DateRangeFilter";
import { formatCurrencyCompact } from "../utils/format";
import { IconChannel, IconFinance, IconGlobe, IconRefresh, IconRevenue } from "../components/icons";

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
        <div>
          <h1>Finance</h1>
          <p className="page-subtitle">Revenue, cost of goods, and profitability over time.</p>
        </div>
        <DateRangeFilter bounds={bounds} range={range} setRange={setRange} />
      </div>

      {loading || !data ? (
        <div className="loading-box">Loading finance data…</div>
      ) : (
        <>
          <div className="stat-grid">
            <StatTile label="Revenue" value={formatCurrencyCompact(data.summary.revenue)} icon={IconRevenue} colorIndex={0} />
            <StatTile label="COGS" value={formatCurrencyCompact(data.summary.cogs)} icon={IconFinance} colorIndex={2} />
            <StatTile
              label="Gross Profit"
              value={formatCurrencyCompact(data.summary.gross_profit)}
              icon={IconFinance}
              colorIndex={1}
            />
            <StatTile
              label="Refunded Revenue"
              value={formatCurrencyCompact(data.summary.refunded_revenue)}
              icon={IconRefresh}
              colorIndex={4}
            />
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
              <div className="card-title-group" style={{ marginBottom: 14 }}>
                <span className="card-title-icon" style={{ background: "var(--badge-blue-bg)", color: "var(--series-1)" }}>
                  <IconGlobe width={15} height={15} />
                </span>
                <h2>Revenue by Region</h2>
              </div>
              <DonutChart data={data.region_breakdown} labelKey="region" valueKey="revenue" />
            </div>
            <div className="card">
              <div className="card-title-group" style={{ marginBottom: 14 }}>
                <span className="card-title-icon" style={{ background: "var(--badge-green-bg)", color: "var(--series-3)" }}>
                  <IconChannel width={15} height={15} />
                </span>
                <h2>Revenue by Channel</h2>
              </div>
              <DonutChart data={data.channel_breakdown} labelKey="channel" valueKey="revenue" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
