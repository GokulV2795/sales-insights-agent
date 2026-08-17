import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getActivityHeatmap, getDashboard, getDateBounds } from "../api/client";
import StatTile from "../components/StatTile";
import RevenueTrendChart from "../components/RevenueTrendChart";
import BreakdownBarChart from "../components/BreakdownBarChart";
import DonutChart from "../components/DonutChart";
import MiniSparkline from "../components/MiniSparkline";
import ActivityHeatmap from "../components/ActivityHeatmap";
import DateRangeFilter from "../components/DateRangeFilter";
import useChartColors from "../hooks/useChartColors";
import { formatCompact, formatCurrencyCompact } from "../utils/format";
import {
  IconChannel,
  IconCrown,
  IconGlobe,
  IconGrid,
  IconOrders,
  IconRefresh,
  IconRevenue,
  IconTag,
  IconTrend,
  IconUsers,
} from "../components/icons";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [range, setRange] = useState({ start: "", end: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const colors = useChartColors();

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

  const sparklineData = data?.revenue_trend?.slice(-8).map((p) => ({ period: p.period, revenue: p.revenue }));

  return (
    <div className="page-pad">
      <div className="page-header">
        <div>
          <h1>Sales Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening with your sales.</p>
        </div>
        <DateRangeFilter bounds={bounds} range={range} setRange={setRange} />
      </div>

      {loading || !data ? (
        <div className="loading-box">Loading dashboard…</div>
      ) : (
        <>
          <div className="stat-grid">
            <StatTile
              label="Total Revenue"
              value={formatCurrencyCompact(data.kpis.total_revenue)}
              icon={IconRevenue}
              colorIndex={0}
              delta={`${Math.abs(data.kpis.revenue_mom_growth_pct)}%`}
              deltaGood={data.kpis.revenue_mom_growth_pct >= 0}
            />
            <StatTile
              label="Total Orders"
              value={formatCompact(data.kpis.total_orders)}
              icon={IconOrders}
              colorIndex={1}
              delta={`${Math.abs(data.kpis.orders_mom_growth_pct)}%`}
              deltaGood={data.kpis.orders_mom_growth_pct >= 0}
            />
            <StatTile
              label="Avg Order Value"
              value={`$${data.kpis.avg_order_value.toLocaleString()}`}
              icon={IconTag}
              colorIndex={2}
              delta={`${Math.abs(data.kpis.aov_mom_growth_pct)}%`}
              deltaGood={data.kpis.aov_mom_growth_pct >= 0}
            />
            <StatTile
              label="Unique Customers"
              value={formatCompact(data.kpis.unique_customers)}
              icon={IconUsers}
              colorIndex={3}
              delta={`${Math.abs(data.kpis.customers_mom_growth_pct)}%`}
              deltaGood={data.kpis.customers_mom_growth_pct >= 0}
            />
          </div>

          <div className="stat-grid stat-grid-wide">
            <StatTile
              label="Refund Rate"
              value={`${data.kpis.refund_rate_pct}%`}
              icon={IconRefresh}
              colorIndex={4}
              delta={`${Math.abs(data.kpis.refund_rate_mom_delta_pp)}%`}
              deltaGood={data.kpis.refund_rate_mom_delta_pp <= 0}
            />
            <StatTile
              label="MoM Revenue Growth"
              value={`${data.kpis.revenue_mom_growth_pct}%`}
              icon={IconTrend}
              colorIndex={5}
              delta={`${Math.abs(data.kpis.revenue_mom_growth_pct)}%`}
              deltaGood={data.kpis.revenue_mom_growth_pct >= 0}
              wide
            >
              <MiniSparkline
                data={sparklineData}
                dataKey="revenue"
                color={data.kpis.revenue_mom_growth_pct >= 0 ? colors.series[2] : "var(--danger)"}
              />
            </StatTile>
          </div>

          <div className="card">
            <div className="card-row">
              <h2>Revenue Trend</h2>
              <span className="select-fake">Monthly ⌄</span>
            </div>
            <div className="chart-legend-row">
              <span className="legend-swatch" style={{ background: colors.series[0] }} />
              Revenue (USD)
            </div>
            <RevenueTrendChart data={data.revenue_trend} />
          </div>

          <div className="card">
            <h2>Shopping Activity</h2>
            <p className="card-subtitle">Completed orders by day of week and hour of day</p>
            {heatmap && <ActivityHeatmap cells={heatmap} />}
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-row">
                <div className="card-title-group">
                  <span className="card-title-icon" style={{ background: "var(--badge-amber-bg)", color: "var(--series-4)" }}>
                    <IconCrown width={15} height={15} />
                  </span>
                  <h2>Top Products</h2>
                </div>
                <Link className="card-link" to="/product">
                  View all
                </Link>
              </div>
              <BreakdownBarChart data={data.top_products} dataKey="revenue" labelKey="name" height={320} />
            </div>
            <div className="card">
              <div className="card-row">
                <div className="card-title-group">
                  <span className="card-title-icon" style={{ background: "var(--badge-violet-bg)", color: "var(--badge-violet-fg)" }}>
                    <IconGrid width={15} height={15} />
                  </span>
                  <h2>Revenue by Category</h2>
                </div>
                <Link className="card-link" to="/product">
                  View all
                </Link>
              </div>
              <BreakdownBarChart data={data.category_breakdown} dataKey="revenue" labelKey="category" height={320} />
            </div>
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
