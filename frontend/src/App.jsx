import { NavLink, Route, HashRouter, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ProductPerformancePage from "./pages/ProductPerformancePage";
import FinancePage from "./pages/FinancePage";
import RevOpsPage from "./pages/RevOpsPage";
import ReportsPage from "./pages/ReportsPage";
import ChatWidget from "./components/ChatWidget";
import ThemeToggle from "./components/ThemeToggle";
import { IconDashboard, IconFinance, IconProduct, IconReports, IconRevOps } from "./components/icons";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: IconDashboard, end: true },
  { to: "/product", label: "Product", icon: IconProduct },
  { to: "/finance", label: "Finance", icon: IconFinance },
  { to: "/revops", label: "RevOps", icon: IconRevOps },
  { to: "/reports", label: "Reports", icon: IconReports },
];

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-mark" />
            <span>Sales Insights</span>
          </div>
          <div className="sidebar-theme-row">
            <span>Theme</span>
            <ThemeToggle />
          </div>
          <nav>
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? "active" : "")}>
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-footer">
            <svg viewBox="0 0 160 90" className="sidebar-illustration" aria-hidden="true">
              <rect x="14" y="62" width="16" height="20" rx="3" className="illus-bar illus-bar-1" />
              <rect x="42" y="50" width="16" height="32" rx="3" className="illus-bar illus-bar-2" />
              <rect x="70" y="56" width="16" height="26" rx="3" className="illus-bar illus-bar-3" />
              <rect x="98" y="38" width="16" height="44" rx="3" className="illus-bar illus-bar-4" />
              <rect x="126" y="24" width="16" height="58" rx="3" className="illus-bar illus-bar-5" />
              <polyline points="22,54 50,42 78,48 106,30 134,16" className="illus-trend" />
              <circle cx="134" cy="16" r="4.5" className="illus-dot" />
            </svg>
            <span>Powered by LangChain + OpenRouter</span>
          </div>
        </aside>
        <main>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/product" element={<ProductPerformancePage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/revops" element={<RevOpsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </main>
        <ChatWidget />
      </div>
    </HashRouter>
  );
}
