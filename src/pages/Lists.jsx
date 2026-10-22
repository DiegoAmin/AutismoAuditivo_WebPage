import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../context/AuthContext.jsx";

export const Lists = () => {
  const { user } = useAuth();
  const [artists, setArtists] = useState([]);
  const [newName, setNewName] = useState("");

  const [activeTab, setActiveTab] = useState("ogs");
  const [newStatus, setNewStatus] = useState("official");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "artists"), (snapshot) => {
      const artistData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setArtists(artistData);
    });
    return () => unsubscribe();
  }, []);

  const handleAddArtist = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !user) return;
    try {
      await addDoc(collection(db, "artists"), {
        name: newName.trim(),
        category: activeTab,
        status: newStatus,
        addedBy: user.displayName || user.uid
      });
      setNewName("");
    } catch (error) {
      console.error("Error al agregar artista:", error);
    }
  };

  const handleDeleteArtist = async (id, name) => {
    const confirmacion = window.confirm(`¿Eliminar a "${name}" de la base de datos?`);
    if (!confirmacion) return;
    try {
      await deleteDoc(doc(db, "artists", id));
    } catch (error) {
      console.error("Error al eliminar artista:", error);
    }
  };

  const currentArtists = artists.filter(a => a.category === activeTab);
  const oficialList = currentArtists.filter(a => a.status === "official");
  const sugerenciaList = currentArtists.filter(a => a.status === "suggestion");
  const pasaronList = currentArtists.filter(a => a.status === "history");

  const columns = [
    { title: "Lista Oficial", items: oficialList, color: "var(--accent-blue)", muted: false },
    { title: "Sugerencias", items: sugerenciaList, color: "var(--accent-amber)", muted: false },
    { title: "Historial", items: pasaronList, color: "var(--accent-green)", muted: true }
  ];

  return (
    <main className="page-container" style={{ maxWidth: "1080px" }}>
      {/* Encabezado y Selector de Época */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "1.75rem"
      }}>
        <div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Catálogo general
          </p>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Base de Datos</h1>
        </div>

        <div style={{ width: "260px", maxWidth: "100%" }}>
          <div className="segmented-control">
            <button
              type="button"
              onClick={() => setActiveTab("ogs")}
              className="segmented-btn"
              style={{
                backgroundColor: activeTab === "ogs" ? "var(--accent-amber)" : "transparent",
                color: activeTab === "ogs" ? "#000" : "var(--text-muted)"
              }}
            >
              OG's
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("actuales")}
              className="segmented-btn"
              style={{
                backgroundColor: activeTab === "actuales" ? "var(--accent-blue)" : "transparent",
                color: activeTab === "actuales" ? "#fff" : "var(--text-muted)"
              }}
            >
              Actuales
            </button>
          </div>
        </div>
      </div>

      {/* Formulario para agregar artista */}
      <section className="card" style={{ padding: "1.25rem", marginBottom: "1.75rem" }}>
        <form onSubmit={handleAddArtist} className="form-row" style={{ marginBottom: 0 }}>
          <input
            type="text"
            className="input-field"
            placeholder={`Agregar artista a ${activeTab === "ogs" ? "OG's" : "Actuales"}...`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: 1 }}
          />
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="input-field"
            style={{ cursor: "pointer", minWidth: "190px" }}
          >
            <option value="official">Destino: Lista Oficial</option>
            <option value="suggestion">Destino: Sugerencias</option>
            <option value="history">Destino: Historial</option>
          </select>
          <button
            type="submit"
            className="btn"
            style={{
              backgroundColor: "var(--text-main)",
              color: "#09090b",
              fontWeight: 700,
              padding: "0.75rem 1.5rem"
            }}
          >
            Agregar
          </button>
        </form>
      </section>

      {/* Tablero de 3 Columnas */}
      <section className="lists-board">
        {columns.map((col) => (
          <div key={col.title} className="board-column">
            <div className="board-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="dot" style={{ backgroundColor: col.color }} />
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {col.title}
                </h3>
              </div>
              <span style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                backgroundColor: "var(--bg-elevated)",
                padding: "0.15rem 0.55rem",
                borderRadius: "999px"
              }}>
                {col.items.length}
              </span>
            </div>

            {col.items.length === 0 ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Sin artistas registrados
              </div>
            ) : (
              <ul className="board-list">
                {col.items.map((a) => (
                  <li key={a.id} className="board-item">
                    <span style={{
                      color: col.muted ? "var(--text-muted)" : "var(--text-main)",
                      fontWeight: col.muted ? 400 : 500,
                      wordBreak: "break-word",
                      paddingRight: "0.5rem"
                    }}>
                      {a.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteArtist(a.id, a.name)}
                      className="delete-btn"
                      title="Eliminar registro"
                      aria-label={`Eliminar ${a.name}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>
    </main>
  );
};