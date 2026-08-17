import { NavLink, Route, HashRouter, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import ReportsPage from "./pages/ReportsPage";

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">Sales Insights</div>
          <nav>
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
              Dashboard
            </NavLink>
            <NavLink to="/chat" className={({ isActive }) => (isActive ? "active" : "")}>
              Assistant
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => (isActive ? "active" : "")}>
              Reports
            </NavLink>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
