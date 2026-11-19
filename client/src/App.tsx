import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Report from "./pages/Report.js";
import Responder from "./pages/Responder.js";
import Admin from "./pages/Admin.js";

/**
 * Top navigation bar across all views.
 */
function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-3) var(--space-4)",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <Link
        to="/report"
        style={{
          fontWeight: 700,
          fontSize: "var(--font-size-lg)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
        }}
      >
        <span>🛡️</span> CampusShield
      </Link>
      <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--font-size-sm)" }}>
        <Link to="/report" style={{ fontWeight: 600 }}>
          Report
        </Link>
        <Link to="/responder" style={{ fontWeight: 600 }}>
          Responder
        </Link>
        <Link to="/admin" style={{ fontWeight: 600 }}>
          Admin
        </Link>
      </div>
    </nav>
  );
}

/**
 * Emergency disclaimer footer rendered on every page.
 */
function EmergencyFooter() {
  return (
    <footer
      style={{
        textAlign: "center",
        padding: "var(--space-4)",
        fontSize: "var(--font-size-sm)",
        color: "var(--color-text-muted)",
        borderTop: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        marginTop: "auto",
      }}
    >
      Prototype. In a real emergency call 112.
    </footer>
  );
}

/**
 * Main application shell with routing and shared footer.
 */
export function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          background: "var(--color-bg)",
        }}
      >
        <Navbar />
        <main style={{ flex: 1, paddingBottom: "var(--space-8)" }}>
          <Routes>
            <Route path="/report" element={<Report />} />
            <Route path="/responder" element={<Responder />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/report" replace />} />
          </Routes>
        </main>
        <EmergencyFooter />
      </div>
    </BrowserRouter>
  );
}
