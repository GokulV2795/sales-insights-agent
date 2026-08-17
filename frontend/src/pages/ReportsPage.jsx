import { useEffect, useState } from "react";
import { getCumulativeReport, getCumulativeReportPdfUrl, getDateBounds } from "../api/client";
import RevenueTrendChart from "../components/RevenueTrendChart";
import BreakdownBarChart from "../components/BreakdownBarChart";

export default function ReportsPage() {
  const [asOf, setAsOf] = useState("");
  const [bounds, setBounds] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDateBounds().then(setBounds).catch(() => {});
  }, []);

  function loadReport(dateValue) {
    setLoading(true);
    setError(null);
    getCumulativeReport(dateValue || undefined)
      .then(setReport)
      .catch((e) => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadReport(asOf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trendData = report?.cumulative_trend.map((p) => ({ period: p.period, revenue: p.cumulative_revenue, orders: p.cumulative_orders }));

  return (
    <div className="page-pad">
      <div className="page-header">
        <h1>Cumulative Sales Report</h1>
        <div className="filter-row">
          <label>
            As of
            <input
              type="date"
              min={bounds?.min_date}
              max={bounds?.max_date}
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </label>
          <button className="btn-ghost" onClick={() => loadReport(asOf)}>
            Generate
          </button>
          {report && (
            <a className="btn-ghost" href={getCumulativeReportPdfUrl(asOf || undefined)} target="_blank" rel="noreferrer">
              Download PDF
            </a>
          )}
        </div>
      </div>

      {error && <div className="error-box">Failed to generate report: {error}</div>}
      {loading || !report ? (
        <div className="loading-box">Generating cumulative report…</div>
      ) : (
        <>
          <div className="card narrative-card">
            <h2>Executive Summary</h2>
            <p>{report.narrative_summary}</p>
            <div className="report-meta">
              As of {report.as_of} · generated {new Date(report.generated_at).toLocaleString()}
            </div>
          </div>

          <div className="stat-grid">
            <div className="stat-tile">
              <div className="stat-label">Cumulative Revenue</div>
              <div className="stat-value">${report.kpis.total_revenue.toLocaleString()}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Cumulative Orders</div>
              <div className="stat-value">{report.kpis.total_orders.toLocaleString()}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Cumulative Units</div>
              <div className="stat-value">{report.kpis.total_units.toLocaleString()}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Unique Customers</div>
              <div className="stat-value">{report.kpis.unique_customers.toLocaleString()}</div>
            </div>
          </div>

          <div className="card">
            <h2>Cumulative Revenue Over Time</h2>
            <RevenueTrendChart data={trendData} />
          </div>

          <div className="grid-2">
            <div className="card">
              <h2>Top Products (Cumulative)</h2>
              <BreakdownBarChart data={report.top_products_cumulative} dataKey="revenue" labelKey="name" height={320} />
            </div>
            <div className="card">
              <h2>Revenue by Region (Cumulative)</h2>
              <BreakdownBarChart data={report.region_breakdown_cumulative} dataKey="revenue" labelKey="region" height={320} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
