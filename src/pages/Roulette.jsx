import React, { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../context/AuthContext.jsx";

export const Roulette = () => {
  const { user, isAdmin } = useAuth();
  
  const [listType, setListType] = useState("oficial"); // 'oficial' | 'sugerencias'
  const [category, setCategory] = useState("actuales"); // 'actuales' | 'ogs'
  
  const [officialArtists, setOfficialArtists] = useState([]);
  const [suggestedArtists, setSuggestedArtists] = useState([]);
  const [currentArtist, setCurrentArtist] = useState(null);
  
  const [rolling, setRolling] = useState(false);
  const [displayArtist, setDisplayArtist] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const unsubOfficial = onSnapshot(doc(db, "globals", "officialList"), (docSnap) => {
      if (docSnap.exists()) setOfficialArtists(docSnap.data().artists || []);
    });
    const unsubSuggested = onSnapshot(doc(db, "globals", "suggestedList"), (docSnap) => {
      if (docSnap.exists()) setSuggestedArtists(docSnap.data().artists || []);
    });
    const unsubCurrent = onSnapshot(doc(db, "globals", "general"), (docSnap) => {
      if (docSnap.exists()) setCurrentArtist(docSnap.data());
    });

    return () => { unsubOfficial(); unsubSuggested(); unsubCurrent(); };
  }, []);

  const activePool = listType === "oficial" ? officialArtists : suggestedArtists;
  const filteredPool = activePool.filter(a => (category === "ogs" ? a.category === "ogs" : a.category !== "ogs"));

  const handleRoll = () => {
    if (filteredPool.length === 0) return alert("No hay artistas disponibles en esta categoría.");
    if (attempts >= 3 && !isAdmin) return alert("Has agotado tus 3 tiros de la semana.");

    setRolling(true);
    let counter = 0;
    const maxCount = 20;
    
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * filteredPool.length);
      setDisplayArtist(filteredPool[randomIndex]);
      counter++;

      if (counter >= maxCount) {
        clearInterval(interval);
        const finalWinner = filteredPool[Math.floor(Math.random() * filteredPool.length)];
        setDisplayArtist(finalWinner);
        setRolling(false);
        setAttempts(prev => prev + 1);
        
        if (isAdmin) {
          saveSelectedArtist(finalWinner);
        }
      }
    }, 80);
  };

  const saveSelectedArtist = async (artist) => {
    try {
      await setDoc(doc(db, "globals", "general"), {
        name: artist.name,
        category: artist.category || category,
        spotifyImage: artist.spotifyImage || "",
        spotifyUrl: artist.spotifyUrl || "",
        selectedBy: user.displayName || "Admin",
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error al guardar artista oficial:", error);
    }
  };

  return (
    <main className="page-container" style={{ maxWidth: "850px" }}>
      <div style={{ marginBottom: "2rem", textAlign: "left" }}>
        <p style={{ color: "var(--accent-green)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.3rem" }}>
          Selección Aleatoria
        </p>
        <h1 className="page-title">Ruleta de Artistas</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Gira la ruleta para definir el soundtrack de la semana en el grupo.
        </p>
      </div>

      {/* CONTROLES DE FILTRADO (Época y Origen) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        
        {/* Selector de Época */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.6rem", fontWeight: 700 }}>
            Época del Artista
          </label>
          <div className="segmented-control" style={{ width: "100%" }}>
            <button
              type="button"
              className={`segmented-btn ${category === "actuales" ? "active" : ""}`}
              onClick={() => setCategory("actuales")}
              style={{ flex: 1 }}
            >
              ✨ Actuales
            </button>
            <button
              type="button"
              className={`segmented-btn ${category === "ogs" ? "active" : ""}`}
              onClick={() => setCategory("ogs")}
              style={{ flex: 1 }}
            >
              🔥 OG's
            </button>
          </div>
        </div>

        {/* Selector de Origen */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.6rem", fontWeight: 700 }}>
            Origen de la Lista
          </label>
          <div className="segmented-control" style={{ width: "100%" }}>
            <button
              type="button"
              className={`segmented-btn ${listType === "oficial" ? "active" : ""}`}
              onClick={() => setListType("oficial")}
              style={{ flex: 1 }}
            >
              🛡️ Oficial ({officialArtists.length})
            </button>
            <button
              type="button"
              className={`segmented-btn ${listType === "sugerencias" ? "active" : ""}`}
              onClick={() => setListType("sugerencias")}
              style={{ flex: 1 }}
            >
              💡 Sugerencias ({suggestedArtists.length})
            </button>
          </div>
        </div>

      </div>

      {/* TARJETA CENTRAL DE LA RULETA */}
      <section className="card" style={{ textAlign: "center", padding: "3rem 2rem", position: "relative", overflow: "hidden" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          <span>Disponibles en pool: <strong style={{ color: "var(--text-main)" }}>{filteredPool.length}</strong></span>
          <span>Intentos: <strong style={{ color: "var(--text-main)" }}>{attempts} de 3</strong></span>
        </div>

        {/* VISUALIZADOR DEL ARTISTA */}
        <div style={{
          background: "var(--bg-main)",
          border: "1px solid var(--border)",
          borderRadius: "18px",
          padding: "2.5rem 1.5rem",
          marginBottom: "2rem",
          boxShadow: "inset 0 4px 20px rgba(0,0,0,0.5)",
          minHeight: "240px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative"
        }}>
          {displayArtist ? (
            <>
              {displayArtist.spotifyImage && (
                <img
                  src={displayArtist.spotifyImage}
                  alt={displayArtist.name}
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: "1rem",
                    border: "2px solid var(--accent-green)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                    animation: rolling ? "pulse 0.2s infinite alternate" : "none"
                  }}
                />
              )}
              <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
                {displayArtist.name}
              </h2>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "0.4rem" }}>
                {displayArtist.category === "ogs" ? "Categoría OG's" : "Categoría Actuales"}
              </span>
            </>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", fontStyle: "italic" }}>
              Haz clic abajo para girar la ruleta...
            </p>
          )}
        </div>

        {/* BOTÓN DE ACCIÓN PRINCIPAL */}
        <button
          type="button"
          onClick={handleRoll}
          disabled={rolling || filteredPool.length === 0 || (attempts >= 3 && !isAdmin)}
          className="btn"
          style={{
            width: "100%",
            maxWidth: "360px",
            backgroundColor: "var(--accent-green)",
            color: "#070709",
            fontWeight: 800,
            fontSize: "1rem",
            padding: "1rem 2rem",
            borderRadius: "999px",
            boxShadow: "0 8px 24px rgba(30, 215, 96, 0.25)"
          }}
        >
          {rolling ? "Girando tómbola..." : attempts === 0 ? "Girar Ruleta (1/3)" : `Girar de nuevo (${3 - attempts} restantes)`}
        </button>

        {isAdmin && displayArtist && !rolling && (
          <div style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={() => saveSelectedArtist(displayArtist)}
              className="btn"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", fontSize: "0.85rem" }}
            >
              ✨ Fijar a "{displayArtist.name}" como Artista Oficial de la Semana
            </button>
          </div>
        )}
      </section>
    </main>
  );
};