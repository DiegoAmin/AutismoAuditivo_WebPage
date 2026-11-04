import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { Landing } from "./pages/Landing.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Roulette } from "./pages/Roulette.jsx";
import { Lists } from "./pages/Lists.jsx";
import { Reviews } from "./pages/Reviews.jsx"; 
import { Profile } from "./pages/Profile.jsx";
import { Recommendations } from "./pages/Recommendations.jsx";
import { PublicProfile } from "./pages/PublicProfile.jsx";

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
};

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Inicio",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  {
    to: "/roulette",
    label: "Ruleta",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  },
  {
    to: "/reviews",
    label: "Foro",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    to: "/muro",
    label: "Bangers",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  },
  {
    to: "/lists",
    label: "Archivo",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    )
  }
];

const Navigation = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <>
      <header className="topbar">
        <Link to="/dashboard" className="brand-logo">
          <img src="/AA_logo.svg" alt="AA" className="brand-img" />
          <span className="brand-text">Autismo Auditivo</span>
        </Link>

        {/* Navegación Desktop (oculta en móvil) */}
        <nav className="desktop-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `desktop-nav-link ${isActive ? "active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Usuario + Perfil + Logout */}
        <div className="nav-user">
          <NavLink to="/profile" className={({ isActive }) => `profile-pill ${isActive ? "active" : ""}`}>
            <img
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || "U"}&background=1c1c21&color=fafafa`}
              alt=""
              className="profile-pill-avatar"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${user.displayName || "U"}&background=1c1c21&color=fafafa`;
              }}
            />
            <span className="profile-pill-name">{user.displayName || "Perfil"}</span>
          </NavLink>

          <button onClick={logout} className="logout-icon-btn" title="Cerrar sesión">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Bottom Tab Bar (Solo visible en celular) */}
      <nav className="mobile-bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `mobile-tab ${isActive ? "active" : ""}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/roulette" element={<PrivateRoute><Roulette /></PrivateRoute>} />
          <Route path="/reviews" element={<PrivateRoute><Reviews /></PrivateRoute>} /> 
          <Route path="/muro" element={<PrivateRoute><Recommendations /></PrivateRoute>} />
          <Route path="/lists" element={<PrivateRoute><Lists /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/user/:uid" element={<PrivateRoute><PublicProfile /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;