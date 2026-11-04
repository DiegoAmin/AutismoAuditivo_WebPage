import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../context/AuthContext.jsx";
import { motion, AnimatePresence } from "framer-motion";

export const Lists = () => {
  const { user, isAdmin } = useAuth();

  const [artists, setArtists] = useState([]);
  const [activeTab, setActiveTab] = useState("actuales"); // 'actuales' | 'ogs'
  const [newStatus, setNewStatus] = useState(isAdmin ? "official" : "suggestion");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lectura en tiempo real de la colección raíz 'artists'
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "artists"), (snapshot) => {
      const artistData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setArtists(artistData);
    });
    return () => unsubscribe();
  }, []);

  // Autocompletado de Spotify al escribir
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/spotify?searchArtist=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (Array.isArray(data)) setSearchResults(data);
      } catch (err) {
        console.error("Error buscando en Spotify:", err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtrado por época y orden alfabético
  const currentArtists = artists.filter(a => a.category === activeTab);
  const sortByAlphabet = (a, b) => (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" });

  const oficialList = currentArtists.filter(a => a.status === "official").sort(sortByAlphabet);
  const sugerenciaList = currentArtists.filter(a => a.status === "suggestion").sort(sortByAlphabet);
  const historialList = currentArtists.filter(a => a.status === "history").sort(sortByAlphabet);

  const handleAddArtist = async (e) => {
    e.preventDefault();
    const artistName = selectedArtist ? selectedArtist.name : searchQuery.trim();
    if (!artistName || !user) return;

    const finalStatus = isAdmin ? newStatus : "suggestion";

    if (finalStatus === "official" && oficialList.length >= 70) {
      alert("La Lista Oficial ya alcanzó el límite máximo de 70 artistas.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "artists"), {
        name: artistName,
        category: activeTab,
        status: finalStatus,
        addedBy: user.displayName || user.uid,
        spotifyImage: selectedArtist?.image || null,
        spotifyUrl: selectedArtist?.url || null
      });
      setSelectedArtist(null);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error al agregar artista:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArtist = async (id, name) => {
    if (!isAdmin) return;
    if (!window.confirm(`¿Eliminar a "${name}" de la base de datos?`)) return;

    try {
      await deleteDoc(doc(db, "artists", id));
    } catch (error) {
      console.error("Error al eliminar artista:", error);
    }
  };

  const columns = [
    {
      title: "Lista Oficial",
      items: oficialList,
      maxLimit: 70,
      adminOnly: true,
      color: "var(--accent-blue)"
    },
    {
      title: "Sugerencias",
      items: sugerenciaList,
      adminOnly: false,
      color: "var(--accent-amber)"
    },
    {
      title: "Historial",
      items: historialList,
      adminOnly: true,
      color: "var(--accent-green)",
      muted: true
    }
  ];

  return (
    <motion.main
      className="page-container"
      style={{ maxWidth: "1200px" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* CABECERA + TABS DE ÉPOCA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Archivo Central
          </p>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Base de Datos</h1>
        </div>

        <div style={{ width: "260px", maxWidth: "100%" }}>
          <div className="segmented-control" style={{ width: "100%", display: "flex" }}>
            <button
              type="button"
              className={`segmented-btn ${activeTab === "actuales" ? "active" : ""}`}
              onClick={() => setActiveTab("actuales")}
              style={{ flex: 1 }}
            >
              Actuales
            </button>
            <button
              type="button"
              className={`segmented-btn ${activeTab === "ogs" ? "active" : ""}`}
              onClick={() => setActiveTab("ogs")}
              style={{ flex: 1 }}
            >
              OG's
            </button>
          </div>
        </div>
      </div>

      {/* FORMULARIO DE AGREGAR */}
      <section className="card" style={{ marginBottom: "2.5rem", padding: "1.5rem 2rem" }}>
        <form onSubmit={handleAddArtist} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
          
          {/* BUSCADOR DE ARTISTAS CON SPOTIFY AUTOCOMPLETE */}
          <div style={{ flex: "1 1 320px", position: "relative" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Nombre del Artista
            </label>

            <AnimatePresence mode="wait">
              {selectedArtist ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--accent-green)",
                    padding: "0.55rem 1rem",
                    borderRadius: "10px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {selectedArtist.image && (
                      <img src={selectedArtist.image} alt="" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                    )}
                    <strong style={{ fontSize: "0.9rem" }}>{selectedArtist.name}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedArtist(null); setSearchQuery(""); }}
                    style={{ background: "none", border: "none", color: "var(--accent-red)", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}
                  >
                    Quitar
                  </button>
                </motion.div>
              ) : (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={`Agregar a ${activeTab === "actuales" ? "Actuales" : "OG's"}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: "100%", padding: "0.65rem 1rem" }}
                  />
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          zIndex: 30,
                          marginTop: "4px",
                          maxHeight: "200px",
                          overflowY: "auto",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.6)"
                        }}
                      >
                        {searchResults.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setSelectedArtist(item);
                              setSearchQuery("");
                              setSearchResults([]);
                            }}
                            style={{
                              padding: "0.5rem 1rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              cursor: "pointer",
                              borderBottom: "1px solid var(--border)"
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            {item.image && (
                              <img src={item.image} alt="" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                            )}
                            <strong style={{ fontSize: "0.85rem" }}>{item.name}</strong>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SELECTOR DE DESTINO (STATUS) */}
          <div style={{ flex: "1 1 220px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Destino
            </label>
            <select
              value={isAdmin ? newStatus : "suggestion"}
              onChange={(e) => setNewStatus(e.target.value)}
              className="input-field"
              style={{ width: "100%", padding: "0.65rem 1rem", cursor: "pointer" }}
              disabled={!isAdmin}
            >
              {isAdmin && <option value="official">Lista Oficial ({oficialList.length}/70)</option>}
              <option value="suggestion">Sugerencias</option>
              {isAdmin && <option value="history">Historial</option>}
            </select>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isSubmitting || (!selectedArtist && !searchQuery.trim())}
            className="btn"
            style={{
              backgroundColor: "var(--text-main)",
              color: "#000",
              fontWeight: 700,
              height: "44px",
              padding: "0 1.5rem",
              flex: "0 1 auto"
            }}
          >
            {isSubmitting ? "..." : "Agregar"}
          </motion.button>
        </form>

        {!isAdmin && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.75rem" }}>
            * Como usuario estándar, tus aportes se envían automáticamente a Sugerencias.
          </p>
        )}
      </section>

      {/* TABLERO DE 3 COLUMNAS: OFICIAL | SUGERENCIAS | HISTORIAL */}
      <div className="lists-board">
        {columns.map((col) => (
          <div key={col.title} className="board-column">
            <div className="board-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1rem" }}>{col.icon}</span>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                  {col.title}
                </h3>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  background: "rgba(255,255,255,0.08)",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "999px",
                  fontWeight: 600,
                  color: col.maxLimit && col.items.length >= col.maxLimit ? "var(--accent-red)" : "var(--text-main)"
                }}
              >
                {col.maxLimit ? `${col.items.length} / ${col.maxLimit}` : col.items.length}
              </span>
            </div>

            <ul className="board-list">
              <AnimatePresence>
                {col.items.map((artist) => (
                  <motion.li
                    key={artist.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    layout
                    className="board-item"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                      {artist.spotifyImage ? (
                        <img
                          src={artist.spotifyImage}
                          alt=""
                          style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
                          onError={(e) => {
                            e.target.style.display = "none";
                            if (e.target.nextSibling) e.target.nextSibling.style.display = "inline";
                          }}
                        />
                      ) : null}
                      <span style={{ fontSize: "1.1rem", display: artist.spotifyImage ? "none" : "inline" }}>
                        🎤
                      </span>
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontWeight: col.muted ? 400 : 500,
                          color: col.muted ? "var(--text-muted)" : "var(--text-main)"
                        }}
                      >
                        {artist.name}
                      </span>
                    </div>

                    {(!col.adminOnly || isAdmin) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteArtist(artist.id, artist.name)}
                        className="delete-btn"
                        title="Eliminar"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>

              {col.items.length === 0 && (
                <p style={{ padding: "1.5rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Sin artistas registrados
                </p>
              )}
            </ul>
          </div>
        ))}
      </div>
    </motion.main>
  );
};