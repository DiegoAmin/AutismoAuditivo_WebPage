import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../context/AuthContext.jsx";

export const Lists = () => {
  const { user } = useAuth();
  const [artists, setArtists] = useState([]);
  const [newName, setNewName] = useState("");
  
  // Estados para navegación
  const [activeTab, setActiveTab] = useState("ogs"); // ogs, actuales
  const [newStatus, setNewStatus] = useState("official"); // official, suggestion, history

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "artists"), (snapshot) => {
      const artistData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArtists(artistData);
    });
    return () => unsubscribe();
  }, []);

  const handleAddArtist = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !user) return;
    try {
      await addDoc(collection(db, "artists"), {
        name: newName,
        category: activeTab,
        status: newStatus,
        addedBy: user.displayName || user.uid
      });
      setNewName("");
    } catch (error) {
      console.error("Error al agregar artista:", error);
    }
  };

  const handleDeleteArtist = async (id) => {
    const confirmacion = window.confirm("¿Seguro que quieres eliminar a este artista de la base de datos?");
    if (!confirmacion) return;
    try {
      await deleteDoc(doc(db, "artists", id));
    } catch (error) {
      console.error("Error al eliminar artista:", error);
    }
  };

  // Filtrado de las listas
  const currentArtists = artists.filter(a => a.category === activeTab);
  const oficialList = currentArtists.filter(a => a.status === "official");
  const sugerenciaList = currentArtists.filter(a => a.status === "suggestion");
  const pasaronList = currentArtists.filter(a => a.status === "history");

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Encabezado y Pestañas */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1>Base de Datos 📊</h1>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
          <button 
            onClick={() => setActiveTab("ogs")}
            style={{ padding: "10px 40px", fontSize: "1.2rem", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer", backgroundColor: activeTab === "ogs" ? "#ffcc00" : "#444", color: activeTab === "ogs" ? "black" : "white" }}
          >
            OG's
          </button>
          <button 
            onClick={() => setActiveTab("actuales")}
            style={{ padding: "10px 40px", fontSize: "1.2rem", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer", backgroundColor: activeTab === "actuales" ? "#2196F3" : "#444", color: "white" }}
          >
            Actuales
          </button>
        </div>
      </div>

      {/* Formulario de Agregar (Limpio y directo) */}
      <div style={{ background: "#222", padding: "20px", borderRadius: "10px", marginBottom: "30px" }}>
        <form onSubmit={handleAddArtist} style={{ display: "flex", gap: "10px" }}>
          <input type="text" placeholder={`Nuevo artista en ${activeTab.toUpperCase()}...`} value={newName} onChange={(e) => setNewName(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "5px", border: "none" }} />
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ padding: "10px", borderRadius: "5px" }}>
            <option value="official">Añadir a Lista Oficial</option>
            <option value="suggestion">Añadir a Sugerencias</option>
            <option value="history">Añadir a Ya Pasaron</option>
          </select>
          <button type="submit" style={{ padding: "10px 20px", background: "#4CAF50", color: "white", border: "none", cursor: "pointer", borderRadius: "5px", fontWeight: "bold" }}>Agregar</button>
        </form>
      </div>

      {/* 3 Columnas Estilo Google Sheets */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
        
        {/* Columna 1: Oficial */}
        <div style={{ border: "1px solid #555", borderRadius: "10px", backgroundColor: "#1a1a1a" }}>
          <h3 style={{ margin: 0, padding: "15px", backgroundColor: "#333", borderTopLeftRadius: "10px", borderTopRightRadius: "10px", borderBottom: "2px solid #2196F3", textAlign: "center" }}>LISTA OFICIAL</h3>
          <ul style={{ listStyle: "none", padding: "10px", margin: 0 }}>
            {oficialList.map(a => (
              <li key={a.id} style={{ padding: "8px", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{a.name}</span>
                <button onClick={() => handleDeleteArtist(a.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#666", fontWeight: "bold", padding: "0 5px" }} title="Eliminar">✕</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 2: Sugerencia */}
        <div style={{ border: "1px solid #555", borderRadius: "10px", backgroundColor: "#1a1a1a" }}>
          <h3 style={{ margin: 0, padding: "15px", backgroundColor: "#333", borderTopLeftRadius: "10px", borderTopRightRadius: "10px", borderBottom: "2px solid #ffcc00", textAlign: "center" }}>SUGERENCIA</h3>
          <ul style={{ listStyle: "none", padding: "10px", margin: 0 }}>
            {sugerenciaList.map(a => (
              <li key={a.id} style={{ padding: "8px", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{a.name}</span>
                <button onClick={() => handleDeleteArtist(a.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#666", fontWeight: "bold", padding: "0 5px" }} title="Eliminar">✕</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 3: Ya Pasaron */}
        <div style={{ border: "1px solid #555", borderRadius: "10px", backgroundColor: "#1a1a1a" }}>
          <h3 style={{ margin: 0, padding: "15px", backgroundColor: "#333", borderTopLeftRadius: "10px", borderTopRightRadius: "10px", borderBottom: "2px solid #4CAF50", textAlign: "center" }}>YA PASARON</h3>
          <ul style={{ listStyle: "none", padding: "10px", margin: 0 }}>
            {pasaronList.map(a => (
              <li key={a.id} style={{ padding: "8px", borderBottom: "1px solid #333", color: "#888", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{a.name}</span>
                <button onClick={() => handleDeleteArtist(a.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#666", fontWeight: "bold", padding: "0 5px" }} title="Eliminar">✕</button>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
};