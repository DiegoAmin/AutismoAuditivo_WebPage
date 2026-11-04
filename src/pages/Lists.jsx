import React, { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../context/AuthContext.jsx";
import { motion, AnimatePresence } from "framer-motion";

export const Lists = () => {
  const { isAdmin } = useAuth();
  
  const [officialArtists, setOfficialArtists] = useState([]);
  const [suggestedArtists, setSuggestedArtists] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  
  const [destination, setDestination] = useState("oficial"); // 'oficial' | 'sugerencias'
  const [category, setCategory] = useState("actuales"); // 'actuales' | 'ogs'
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubOfficial = onSnapshot(doc(db, "globals", "officialList"), (docSnap) => {
      if (docSnap.exists()) setOfficialArtists(docSnap.data().artists || []);
    });
    const unsubSuggested = onSnapshot(doc(db, "globals", "suggestedList"), (docSnap) => {
      if (docSnap.exists()) setSuggestedArtists(docSnap.data().artists || []);
    });
    return () => { unsubOfficial(); unsubSuggested(); };
  }, []);

  // Búsqueda en Spotify
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
      } catch (err) { console.error("Error buscando en Spotify:", err); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddArtist = async (e) => {
    e.preventDefault();
    if (!selectedArtist) return alert("Selecciona un artista de la búsqueda primero.");
    if (destination === "oficial" && officialArtists.length >= 70) return alert("La lista oficial ya está llena (70/70).");

    setIsSubmitting(true);
    try {
      const docRef = doc(db, "globals", destination === "oficial" ? "officialList" : "suggestedList");
      await updateDoc(docRef, {
        artists: arrayUnion({
          id: selectedArtist.id,
          name: selectedArtist.name,
          spotifyImage: selectedArtist.image || "",
          spotifyUrl: selectedArtist.url || "",
          category: category,
          addedAt: new Date().toISOString()
        })
      });
      setSelectedArtist(null);
      setSearchQuery("");
    } catch (error) {
      console.error("Error al agregar artista:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArtist = async (listType, artist) => {
    if (!isAdmin) return alert("Solo los administradores pueden borrar artistas de la base de datos.");
    const artistName = typeof artist === "string" ? artist : artist.name;
    if (!window.confirm(`¿Eliminar a ${artistName} de la lista?`)) return;

    try {
      const docRef = doc(db, "globals", listType === "oficial" ? "officialList" : "suggestedList");
      await updateDoc(docRef, {
        artists: arrayRemove(artist)
      });
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  // Función para soportar tanto strings viejos como objetos nuevos
  const getCategory = (a) => typeof a === "string" ? "actuales" : (a.category || "actuales");

  const ogsCount = officialArtists.filter(a => getCategory(a) === "ogs").length + suggestedArtists.filter(a => getCategory(a) === "ogs").length;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <motion.main 
      className="page-container"
      style={{ maxWidth: "1200px" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginBottom: "2rem" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Archivo Central</p>
        <h1 className="page-title">Base de Datos</h1>
      </motion.div>

      {/* PANEL DE CONTROL PARA AGREGAR ARTISTAS */}
      {isAdmin && (
        <motion.section initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ marginBottom: "2.5rem", padding: "1.5rem 2rem" }}>
          <form onSubmit={handleAddArtist} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
            
            <div style={{ flex: "1 1 300px", position: "relative" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Buscar Artista</label>
              
              <AnimatePresence mode="wait">
                {selectedArtist ? (
                  <motion.div key="selected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-elevated)", border: "1px solid var(--accent-green)", padding: "0.55rem 1rem", borderRadius: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {selectedArtist.image && <img src={selectedArtist.image} alt="" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />}
                      <strong style={{ fontSize: "0.9rem" }}>{selectedArtist.name}</strong>
                    </div>
                    <button type="button" onClick={() => setSelectedArtist(null)} style={{ background: "none", border: "none", color: "var(--accent-red)", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>Quitar</button>
                  </motion.div>
                ) : (
                  <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <input type="text" className="input-field" placeholder="Escribe el nombre del artista..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "0.65rem 1rem" }} />
                    <AnimatePresence>
                      {searchResults.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", zIndex: 30, marginTop: "4px", maxHeight: "200px", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.6)" }}>
                          {searchResults.map((item, idx) => (
                            <div key={idx} onClick={() => { setSelectedArtist(item); setSearchQuery(""); setSearchResults([]); }} style={{ padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", borderBottom: "1px solid var(--border)" }} onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-elevated)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                              {item.image && <img src={item.image} alt="" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />}
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

            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Época</label>
              <div className="segmented-control" style={{ width: "100%", display: "flex" }}>
                <button type="button" className={`segmented-btn ${category === "actuales" ? "active" : ""}`} onClick={() => setCategory("actuales")} style={{ flex: 1 }}>✨ Actuales</button>
                <button type="button" className={`segmented-btn ${category === "ogs" ? "active" : ""}`} onClick={() => setCategory("ogs")} style={{ flex: 1 }}>🔥 OG's</button>
              </div>
            </div>

            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Destino</label>
              <div className="segmented-control" style={{ width: "100%", display: "flex" }}>
                <button type="button" className={`segmented-btn ${destination === "oficial" ? "active" : ""}`} onClick={() => setDestination("oficial")} style={{ flex: 1 }}>Oficial</button>
                <button type="button" className={`segmented-btn ${destination === "sugerencias" ? "active" : ""}`} onClick={() => setDestination("sugerencias")} style={{ flex: 1 }}>Sugerencias</button>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} type="submit" disabled={isSubmitting || !selectedArtist} className="btn" style={{ backgroundColor: "var(--text-main)", color: "#000", fontWeight: 700, height: "42px", flex: "0 1 auto" }}>
              {isSubmitting ? "..." : "Agregar"}
            </motion.button>
          </form>
        </motion.section>
      )}

      {/* TABLERO DE 3 COLUMNAS */}
      <div className="lists-board">
        
        {/* COLUMNA 1: LISTA OFICIAL */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="board-column">
          <div className="board-header">
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>🛡️ Lista Oficial</h3>
            <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.1)", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: 600, color: officialArtists.length >= 70 ? "var(--accent-red)" : "var(--text-main)" }}>
              {officialArtists.length} / 70
            </span>
          </div>
          <ul className="board-list">
            <AnimatePresence>
              {officialArtists.filter(a => getCategory(a) !== "ogs").map((artist, idx) => {
                const isString = typeof artist === "string";
                const name = isString ? artist : artist.name;
                const img = isString ? null : artist.spotifyImage;
                const key = `${name}-${idx}`;

                return (
                  <motion.li key={key} variants={itemVariants} initial="hidden" animate="show" exit="exit" layout className="board-item">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                      {img ? <img src={img} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.1rem" }}>🎤</span>}
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>{name}</span>
                    </div>
                    {isAdmin && (
                      <button type="button" onClick={() => handleDeleteArtist("oficial", artist)} className="delete-btn" title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {officialArtists.filter(a => getCategory(a) !== "ogs").length === 0 && <p style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Vacío</p>}
          </ul>
        </motion.div>

        {/* COLUMNA 2: SUGERENCIAS */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="board-column">
          <div className="board-header">
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>💡 Sugerencias</h3>
            <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.1)", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: 600 }}>{suggestedArtists.filter(a => getCategory(a) !== "ogs").length}</span>
          </div>
          <ul className="board-list">
            <AnimatePresence>
              {suggestedArtists.filter(a => getCategory(a) !== "ogs").map((artist, idx) => {
                const isString = typeof artist === "string";
                const name = isString ? artist : artist.name;
                const img = isString ? null : artist.spotifyImage;
                const key = `${name}-${idx}`;

                return (
                  <motion.li key={key} variants={itemVariants} initial="hidden" animate="show" exit="exit" layout className="board-item">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                      {img ? <img src={img} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.1rem" }}>🎤</span>}
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>{name}</span>
                    </div>
                    {isAdmin && (
                      <button type="button" onClick={() => handleDeleteArtist("sugerencias", artist)} className="delete-btn" title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {suggestedArtists.filter(a => getCategory(a) !== "ogs").length === 0 && <p style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Vacío</p>}
          </ul>
        </motion.div>

        {/* COLUMNA 3: OG's */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="board-column">
          <div className="board-header">
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>🔥 Categoría OG's</h3>
            <span style={{ fontSize: "0.75rem", background: "rgba(245, 158, 11, 0.15)", color: "var(--accent-amber)", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: 600 }}>{ogsCount}</span>
          </div>
          <ul className="board-list">
            <AnimatePresence>
              {[...officialArtists, ...suggestedArtists].filter(a => getCategory(a) === "ogs").map((artist, idx) => {
                const isString = typeof artist === "string";
                const name = isString ? artist : artist.name;
                const img = isString ? null : artist.spotifyImage;
                const key = `${name}-${idx}`;
                
                // Revisamos si viene de oficial (ya sea string u objeto)
                const isOfficial = officialArtists.some(oa => (typeof oa === "string" ? oa : oa.name) === name);

                return (
                  <motion.li key={key} variants={itemVariants} initial="hidden" animate="show" exit="exit" layout className="board-item">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                      {img ? <img src={img} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.1rem" }}>🎤</span>}
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500, fontSize: "0.85rem", lineHeight: 1.2 }}>{name}</span>
                        <span style={{ fontSize: "0.65rem", color: isOfficial ? "var(--accent-green)" : "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{isOfficial ? "Oficial" : "Sugerencia"}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button type="button" onClick={() => handleDeleteArtist(isOfficial ? "oficial" : "sugerencias", artist)} className="delete-btn" title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {ogsCount === 0 && <p style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Vacío</p>}
          </ul>
        </motion.div>

      </div>
    </motion.main>
  );
};