import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Roulette } from "./pages/Roulette";
import { Lists } from "./pages/Lists";
import { useAuth } from "./context/AuthContext";

// Componente del Menú de Navegación
const Navigation = () => {
  const { user, logout } = useAuth();
  
  // Si no hay usuario logueado, no mostramos el menú (pantalla Landing)
  if (!user) return null; 

  return (
    <nav style={{ 
      background: "#111", 
      padding: "15px 30px", 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      borderBottom: "2px solid #333",
      marginBottom: "20px"
    }}>
      <div style={{ display: "flex", gap: "25px" }}>
        <Link to="/dashboard" style={{ color: "#2196F3", textDecoration: "none", fontWeight: "bold", fontSize: "1.2rem" }}>
          🏠 Dashboard
        </Link>
        <Link to="/roulette" style={{ color: "#ffcc00", textDecoration: "none", fontWeight: "bold", fontSize: "1.2rem" }}>
          🎡 Ruleta
        </Link>
        <Link to="/lists" style={{ color: "#4CAF50", textDecoration: "none", fontWeight: "bold", fontSize: "1.2rem" }}>
          🗃️ Base de Datos
        </Link>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <span style={{ color: "#aaa", fontSize: "0.9rem" }}>{user.displayName}</span>
        <button 
          onClick={logout} 
          style={{ background: "#f44336", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
        >
          Salir
        </button>
      </div>
    </nav>
  );
};

function App() {
  return (
    <BrowserRouter>
      {/* El menú va afuera de las rutas para que siempre esté visible */}
      <Navigation />
      
      <Routes>
        {/* Rutas */}
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/roulette" element={<Roulette />} />
        <Route path="/lists" element={<Lists />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;