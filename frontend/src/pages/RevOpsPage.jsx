import { useEffect, useState } from "react";
import { getRevOps, getDateBounds } from "../api/client";
import StatTile from "../components/StatTile";
import SimpleAreaChart from "../components/SimpleAreaChart";
import BreakdownBarChart from "../components/BreakdownBarChart";
import StackedCompositionBar from "../components/StackedCompositionBar";
import Meter from "../components/Meter";
import DataTable from "../components/DataTable";
import DateRangeFilter from "../components/DateRangeFilter";

export default function RevOpsPage() {
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
    getRevOps(range.start || undefined, range.end || undefined)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [range]);

  if (error) {
    return <div className="page-pad error-box">Failed to load RevOps data: {error}</div>;
  }

  return (
    <div className="page-pad">
      <div className="page-header">
        <h1>RevOps</h1>
        <DateRangeFilter bounds={bounds} range={range} setRange={setRange} />
      </div>

      {loading || !data ? (
        <div className="loading-box">Loading RevOps data…</div>
      ) : (
        <>
          <div className="stat-grid">
            <StatTile label="Active Customers" value={data.retention.total_active_customers.toLocaleString()} />
            <StatTile label="Repeat Customers" value={data.retention.repeat_customers.toLocaleString()} />
            <StatTile label="Avg Orders / Customer" value={data.retention.avg_orders_per_customer} />
          </div>

          <div className="grid-2">
            <div className="card">
              <h2>Retention</h2>
              <div className="meter-row">
                <Meter value={data.retention.repeat_purchase_rate_pct} label="Repeat Purchase Rate" colorIndex={3} />
              </div>
            </div>
            <div className="card">
              <h2>New Customer Acquisition</h2>
              <SimpleAreaChart
                data={data.new_customers_trend}
                dataKey="new_customers"
                valueLabel="New customers"
                formatValue={(v) => v.toLocaleString()}
                height={200}
                seriesIndex={2}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h2>Revenue by Customer Segment</h2>
              <StackedCompositionBar data={data.segment_breakdown} labelKey="segment" valueKey="revenue" />
            </div>
            <div className="card">
              <h2>Avg Order Value by Channel</h2>
              <BreakdownBarChart
                data={data.channel_performance}
                dataKey="avg_order_value"
                labelKey="channel"
                valueLabel="Avg Order Value"
                height={200}
              />
            </div>
          </div>

          <div className="card">
            <h2>Channel Performance</h2>
            <DataTable
              keyField="channel"
              rows={data.channel_performance}
              columns={[
                { key: "channel", label: "Channel" },
                { key: "orders", label: "Orders", align: "right" },
                { key: "customers", label: "Customers", align: "right" },
                {
                  key: "revenue",
                  label: "Revenue",
                  align: "right",
                  format: (r) => `$${r.revenue.toLocaleString()}`,
                },
                {
                  key: "avg_order_value",
                  label: "Avg Order Value",
                  align: "right",
                  format: (r) => `$${r.avg_order_value.toLocaleString()}`,
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
