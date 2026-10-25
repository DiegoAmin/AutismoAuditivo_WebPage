import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { Landing } from "./pages/Landing.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Roulette } from "./pages/Roulette.jsx";
import { Lists } from "./pages/Lists.jsx";
import { Reviews } from "./pages/Reviews.jsx"; 
import { Profile } from "./pages/Profile.jsx";
import { Recommendations } from "./pages/Recommendations.jsx";

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
};

const Navigation = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <header className="navbar">
      <nav className="nav-links">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Dashboard
        </NavLink>
        <NavLink to="/roulette" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Ruleta
        </NavLink>
        <NavLink to="/reviews" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Opiniones
        </NavLink>
        <NavLink to="/muro" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Joyitas
        </NavLink>
        <NavLink to="/lists" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Base de Datos
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Mi Perfil
        </NavLink>
      </nav>
      <div className="nav-user">
        <span className="user-name">{user.displayName || "Usuario"}</span>
        <button
          onClick={logout}
          className="btn"
          style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;