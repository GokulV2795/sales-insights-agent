import { NavLink, Route, HashRouter, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ProductPerformancePage from "./pages/ProductPerformancePage";
import FinancePage from "./pages/FinancePage";
import RevOpsPage from "./pages/RevOpsPage";
import ReportsPage from "./pages/ReportsPage";
import ChatWidget from "./components/ChatWidget";
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
              <path d="M0 70 L35 30 L60 55 L90 15 L130 55 L160 40 L160 90 L0 90 Z" className="illus-back" />
              <path d="M0 78 L45 48 L75 68 L110 38 L160 58 L160 90 L0 90 Z" className="illus-front" />
              <circle cx="122" cy="20" r="7" className="illus-dot" />
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
