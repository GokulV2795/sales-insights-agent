import { useEffect, useState } from "react";
import { getActivityHeatmap, getDashboard, getDateBounds } from "../api/client";
import StatTile from "../components/StatTile";
import RevenueTrendChart from "../components/RevenueTrendChart";
import BreakdownBarChart from "../components/BreakdownBarChart";
import StackedCompositionBar from "../components/StackedCompositionBar";
import ActivityHeatmap from "../components/ActivityHeatmap";
import DateRangeFilter from "../components/DateRangeFilter";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
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
    Promise.all([
      getDashboard(range.start || undefined, range.end || undefined),
      getActivityHeatmap(range.start || undefined, range.end || undefined),
    ])
      .then(([dashboardData, heatmapData]) => {
        setData(dashboardData);
        setHeatmap(heatmapData);
      })
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
        <DateRangeFilter bounds={bounds} range={range} setRange={setRange} />
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

          <div className="card">
            <h2>Shopping Activity</h2>
            <p className="card-subtitle">Completed orders by day of week and hour of day</p>
            {heatmap && <ActivityHeatmap cells={heatmap} />}
          </div>

          <div className="grid-2">
            <div className="card">
              <h2>Top Products</h2>
              <BreakdownBarChart data={data.top_products} dataKey="revenue" labelKey="name" height={320} />
            </div>
            <div className="card">
              <h2>Revenue by Category</h2>
              <BreakdownBarChart data={data.category_breakdown} dataKey="revenue" labelKey="category" height={320} />
            </div>
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
