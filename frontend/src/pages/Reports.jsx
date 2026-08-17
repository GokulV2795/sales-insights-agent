import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getCumulativeReport, getCumulativeReportPdfUrl, getDateBounds } from "../api/client";
import RevenueTrendChart from "../components/RevenueTrendChart";
import BreakdownBarChart from "../components/BreakdownBarChart";
import DonutChart from "../components/DonutChart";
import StatTile from "../components/StatTile";
import { formatCompact, formatCurrencyCompact } from "../utils/format";
import { IconCrown, IconGlobe, IconOrders, IconRevenue, IconUsers } from "../components/icons";

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
        <div>
          <h1>Cumulative Sales Report</h1>
          <p className="page-subtitle">Running totals and an AI-generated executive summary as of a chosen date.</p>
        </div>
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
            <ReactMarkdown>{report.narrative_summary}</ReactMarkdown>
            <div className="report-meta">
              As of {report.as_of} · generated {new Date(report.generated_at).toLocaleString()}
            </div>
          </div>

          <div className="stat-grid">
            <StatTile
              label="Cumulative Revenue"
              value={formatCurrencyCompact(report.kpis.total_revenue)}
              icon={IconRevenue}
              colorIndex={0}
            />
            <StatTile
              label="Cumulative Orders"
              value={formatCompact(report.kpis.total_orders)}
              icon={IconOrders}
              colorIndex={1}
            />
            <StatTile
              label="Cumulative Units"
              value={formatCompact(report.kpis.total_units)}
              icon={IconCrown}
              colorIndex={5}
            />
            <StatTile
              label="Unique Customers"
              value={formatCompact(report.kpis.unique_customers)}
              icon={IconUsers}
              colorIndex={3}
            />
          </div>

          <div className="card">
            <h2>Cumulative Revenue Over Time</h2>
            <RevenueTrendChart data={trendData} />
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-title-group" style={{ marginBottom: 14 }}>
                <span className="card-title-icon" style={{ background: "var(--badge-amber-bg)", color: "var(--series-4)" }}>
                  <IconCrown width={15} height={15} />
                </span>
                <h2>Top Products (Cumulative)</h2>
              </div>
              <BreakdownBarChart data={report.top_products_cumulative} dataKey="revenue" labelKey="name" height={320} />
            </div>
            <div className="card">
              <div className="card-title-group" style={{ marginBottom: 14 }}>
                <span className="card-title-icon" style={{ background: "var(--badge-blue-bg)", color: "var(--series-1)" }}>
                  <IconGlobe width={15} height={15} />
                </span>
                <h2>Revenue by Region (Cumulative)</h2>
              </div>
              <DonutChart data={report.region_breakdown_cumulative} labelKey="region" valueKey="revenue" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
