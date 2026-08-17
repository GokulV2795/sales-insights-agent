import { useEffect, useState } from "react";
import { getProductPerformance, getDateBounds } from "../api/client";
import StatTile from "../components/StatTile";
import BreakdownBarChart from "../components/BreakdownBarChart";
import StackedCompositionBar from "../components/StackedCompositionBar";
import ScatterBubbleChart from "../components/ScatterBubbleChart";
import DataTable from "../components/DataTable";
import DateRangeFilter from "../components/DateRangeFilter";

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
        <h1>Product Performance</h1>
        <DateRangeFilter bounds={bounds} range={range} setRange={setRange} />
      </div>

      {loading || !data ? (
        <div className="loading-box">Loading product performance…</div>
      ) : (
        <>
          <div className="stat-grid">
            <StatTile label="Gross Revenue" value={`$${data.discount_impact.gross_revenue.toLocaleString()}`} />
            <StatTile label="Discount Given" value={`$${data.discount_impact.discount_given.toLocaleString()}`} />
            <StatTile label="Discount % of Revenue" value={`${data.discount_impact.discount_pct_of_revenue}%`} />
            <StatTile label="Avg Discount Applied" value={`${data.discount_impact.avg_discount_pct}%`} />
          </div>

          <div className="grid-2">
            <div className="card">
              <h2>Top Products by Revenue</h2>
              <BreakdownBarChart data={data.top_products} dataKey="revenue" labelKey="name" height={320} />
            </div>
            <div className="card">
              <h2>Revenue by Category</h2>
              <StackedCompositionBar data={data.category_breakdown} labelKey="category" valueKey="revenue" />
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
