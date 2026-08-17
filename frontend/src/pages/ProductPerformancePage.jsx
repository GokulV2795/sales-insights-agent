import { useEffect, useState } from "react";
import { getProductPerformance, getDateBounds } from "../api/client";
import StatTile from "../components/StatTile";
import BreakdownBarChart from "../components/BreakdownBarChart";
import DonutChart from "../components/DonutChart";
import ScatterBubbleChart from "../components/ScatterBubbleChart";
import DataTable from "../components/DataTable";
import DateRangeFilter from "../components/DateRangeFilter";
import { formatCurrencyCompact } from "../utils/format";
import { IconCrown, IconGrid, IconRefresh, IconRevenue, IconTag } from "../components/icons";

export default function ProductPerformancePage() {
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
    getProductPerformance(range.start || undefined, range.end || undefined)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [range]);

  if (error) {
    return <div className="page-pad error-box">Failed to load product performance: {error}</div>;
  }

  return (
    <div className="page-pad">
      <div className="page-header">
        <div>
          <h1>Product Performance</h1>
          <p className="page-subtitle">Revenue, margin, and discount impact across the catalog.</p>
        </div>
        <DateRangeFilter bounds={bounds} range={range} setRange={setRange} />
      </div>

      {loading || !data ? (
        <div className="loading-box">Loading product performance…</div>
      ) : (
        <>
          <div className="stat-grid">
            <StatTile
              label="Gross Revenue"
              value={formatCurrencyCompact(data.discount_impact.gross_revenue)}
              icon={IconRevenue}
              colorIndex={0}
            />
            <StatTile
              label="Discount Given"
              value={formatCurrencyCompact(data.discount_impact.discount_given)}
              icon={IconTag}
              colorIndex={2}
            />
            <StatTile
              label="Discount % of Revenue"
              value={`${data.discount_impact.discount_pct_of_revenue}%`}
              icon={IconRefresh}
              colorIndex={4}
            />
            <StatTile
              label="Avg Discount Applied"
              value={`${data.discount_impact.avg_discount_pct}%`}
              icon={IconRefresh}
              colorIndex={5}
            />
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-title-group" style={{ marginBottom: 14 }}>
                <span className="card-title-icon" style={{ background: "var(--badge-amber-bg)", color: "var(--series-4)" }}>
                  <IconCrown width={15} height={15} />
                </span>
                <h2>Top Products by Revenue</h2>
              </div>
              <BreakdownBarChart data={data.top_products} dataKey="revenue" labelKey="name" height={320} />
            </div>
            <div className="card">
              <div className="card-title-group" style={{ marginBottom: 14 }}>
                <span className="card-title-icon" style={{ background: "var(--badge-violet-bg)", color: "var(--badge-violet-fg)" }}>
                  <IconGrid width={15} height={15} />
                </span>
                <h2>Revenue by Category</h2>
              </div>
              <DonutChart data={data.category_breakdown} labelKey="category" valueKey="revenue" />
            </div>
          </div>

          <div className="card">
            <h2>Margin vs Revenue</h2>
            <p className="card-subtitle">Each bubble is a product — size shows units sold</p>
            <ScatterBubbleChart data={data.product_margins} />
          </div>

          <div className="card">
            <h2>Product Profitability</h2>
            <DataTable
              keyField="name"
              rows={data.product_margins}
              columns={[
                { key: "name", label: "Product" },
                { key: "category", label: "Category" },
                { key: "units_sold", label: "Units Sold", align: "right" },
                {
                  key: "revenue",
                  label: "Revenue",
                  align: "right",
                  format: (r) => `$${r.revenue.toLocaleString()}`,
                },
                {
                  key: "gross_profit",
                  label: "Gross Profit",
                  align: "right",
                  format: (r) => `$${r.gross_profit.toLocaleString()}`,
                },
                {
                  key: "margin_pct",
                  label: "Margin %",
                  align: "right",
                  format: (r) => (
                    <span className={r.margin_pct >= 55 ? "text-good" : r.margin_pct < 40 ? "text-bad" : undefined}>
                      {r.margin_pct}%
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
