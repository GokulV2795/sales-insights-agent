import { useEffect, useState } from "react";
import { getDashboard, getDateBounds } from "../api/client";
import StatTile from "../components/StatTile";
import RevenueTrendChart from "../components/RevenueTrendChart";
import BreakdownBarChart from "../components/BreakdownBarChart";

export default function DashboardPage() {
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
    getDashboard(range.start || undefined, range.end || undefined)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [range]);

  if (error) {
    return <div className="page-pad error-box">Failed to load dashboard: {error}</div>;
  }

  return (
    <div className="page-pad">
      <div className="page-header">
        <h1>Sales Dashboard</h1>
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
      </div>

      {loading || !data ? (
        <div className="loading-box">Loading dashboard…</div>
      ) : (
        <>
          <div className="stat-grid">
            <StatTile label="Total Revenue" value={`$${data.kpis.total_revenue.toLocaleString()}`} />
            <StatTile label="Total Orders" value={data.kpis.total_orders.toLocaleString()} />
            <StatTile label="Avg Order Value" value={`$${data.kpis.avg_order_value.toLocaleString()}`} />
            <StatTile label="Unique Customers" value={data.kpis.unique_customers.toLocaleString()} />
            <StatTile
              label="MoM Revenue Growth"
              value={`${data.kpis.revenue_mom_growth_pct}%`}
              delta={`${Math.abs(data.kpis.revenue_mom_growth_pct)}%`}
              deltaGood={data.kpis.revenue_mom_growth_pct >= 0}
            />
            <StatTile label="Refund Rate" value={`${data.kpis.refund_rate_pct}%`} />
          </div>

          <div className="card">
            <h2>Revenue Trend</h2>
            <RevenueTrendChart data={data.revenue_trend} />
          </div>

          <div className="grid-2">
            <div className="card">
              <h2>Top Products</h2>
              <BreakdownBarChart data={data.top_products} dataKey="revenue" labelKey="name" height={320} />
            </div>
            <div className="card">
              <h2>Revenue by Region</h2>
              <BreakdownBarChart data={data.region_breakdown} dataKey="revenue" labelKey="region" height={320} />
            </div>
            <div className="card">
              <h2>Revenue by Category</h2>
              <BreakdownBarChart data={data.category_breakdown} dataKey="revenue" labelKey="category" height={280} />
            </div>
            <div className="card">
              <h2>Revenue by Channel</h2>
              <BreakdownBarChart data={data.channel_breakdown} dataKey="revenue" labelKey="channel" height={220} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
