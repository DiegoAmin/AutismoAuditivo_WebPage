import React, { useState, useEffect } from "react";
import { collection, onSnapshot, setDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../context/AuthContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { FastAverageColor } from "fast-average-color";

export const Roulette = () => {
  const { isAdmin } = useAuth();

  const [artists, setArtists] = useState([]);
  const [category, setCategory] = useState("actuales"); // 'actuales' | 'ogs'
  const [listType, setListType] = useState("official"); // 'official' | 'suggestion'

  const [isSpinning, setIsSpinning] = useState(false);
  const [displayedArtist, setDisplayedArtist] = useState(null);
  const [winner, setWinner] = useState(null);
  const [spinCount, setSpinCount] = useState(0);
  const [isCrowning, setIsCrowning] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  
  // Colores reactivos
  const [glowColor, setGlowColor] = useState("var(--accent-green)");
  const [glowBg, setGlowBg] = useState("rgba(30, 215, 96, 0.15)");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "artists"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArtists(data);
    });
    return () => unsubscribe();
  }, []);

  const rouletteCandidates = artists.filter(
    a => a.category === category && a.status === listType
  );

  const handleConfigChange = (type, val) => {
    if (isSpinning) return;
    if (type === "category") setCategory(val);
    if (type === "listType") setListType(val);
    resetRoulette();
  };

  const resetRoulette = () => {
    setSpinCount(0);
    setWinner(null);
    setDisplayedArtist(null);
    setStatusMessage(null);
    setGlowColor("var(--accent-green)");
    setGlowBg("rgba(30, 215, 96, 0.15)");
    document.body.style.backgroundImage = "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(29, 185, 84, 0.08), transparent)";
  };

  // Efecto de color explosivo al sacar al Ganador
  useEffect(() => {
    if (winner && winner.spotifyImage) {
      const fac = new FastAverageColor();
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = winner.spotifyImage;

      img.onload = () => {
        try {
          const color = fac.getColor(img);
          const [r, g, b] = color.value;
          setGlowColor(`rgb(${r}, ${g}, ${b})`);
          setGlowBg(`rgba(${r}, ${g}, ${b}, 0.25)`);
          
          // Estallido al fondo
          document.body.style.backgroundImage = `radial-gradient(ellipse 95% 75% at 50% -10%, rgba(${r}, ${g}, ${b}, 0.2), transparent)`;
          fac.destroy();
        } catch (e) {
          console.error("Error al extraer color:", e);
        }
      };
    }
  }, [winner]);

  // Animación de Suspenso (Aceleración y Frenado)
  const spin = () => {
    if (!isAdmin) return;
    if (rouletteCandidates.length === 0) {
      setStatusMessage("No hay artistas registrados en este grupo.");
      return;
    }

    setStatusMessage(null);
    setIsSpinning(true);
    setWinner(null);
    setGlowColor("var(--border)");
    setGlowBg("transparent");
    
    document.body.style.backgroundImage = "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 255, 255, 0.03), transparent)";

    const maxTicks = 45; 
    let currentTick = 0;
    let delay = 40; 

    const tick = () => {
      const randomIdx = Math.floor(Math.random() * rouletteCandidates.length);
      setDisplayedArtist(rouletteCandidates[randomIdx]);
      currentTick++;

      if (currentTick >= maxTicks) {
        // Tiro final
        const landedArtist = rouletteCandidates[Math.floor(Math.random() * rouletteCandidates.length)];
        setDisplayedArtist(landedArtist);
        setSpinCount(prev => {
          const nextCount = prev + 1;
          if (nextCount === 3) setWinner(landedArtist);
          else setGlowColor("var(--text-main)"); // Color neutro si es descarte
          return nextCount;
        });
        setIsSpinning(false);
      } else {
        // Lógica de frenado dramático
        if (currentTick > maxTicks - 5) delay += 80;
        else if (currentTick > maxTicks - 10) delay += 40;
        else if (currentTick > maxTicks - 15) delay += 15;
        
        setTimeout(tick, delay);
      }
    };

    tick();
  };

  const setArtistOfTheWeek = async () => {
    if (!winner || !isAdmin) return;
    setIsCrowning(true);
    setStatusMessage(null);

    try {
      let finalImg = winner.spotifyImage || null;
      let finalUrl = winner.spotifyUrl || null;

      if (!finalImg) {
        try {
          const res = await fetch(`/api/spotify?artist=${encodeURIComponent(winner.name.trim())}`);
          const data = await res.json();
          if (data && data.image) {
            finalImg = data.image;
            finalUrl = data.url;
          }
        } catch (err) {
          console.error("Error buscando fallback en Spotify:", err);
        }
      }

      await setDoc(doc(db, "globals", "general"), {
        name: winner.name.trim(),
        category: winner.category,
        spotifyUrl: finalUrl || `https://open.spotify.com/search/${encodeURIComponent(winner.name.trim())}/artists`,
        spotifyImage: finalImg,
        updatedAt: new Date()
      });

      setStatusMessage(`✨ "${winner.name}" ha sido fijado como el Artista de la Semana.`);
    } catch (error) {
      console.error("Error al coronar al artista:", error);
      setStatusMessage("Error al guardar en Firestore.");
    } finally {
      setIsCrowning(false);
    }
  };

  const promoteToOfficial = async () => {
    if (!winner || !isAdmin) return;
    try {
      await updateDoc(doc(db, "artists", winner.id), { status: "official" });
      setStatusMessage(`🚀 ${winner.name} fue promovido a la Lista Oficial.`);
    } catch (error) {
      console.error("Error al promover artista:", error);
    }
  };

  return (
    <motion.main
      className="page-container"
      style={{ maxWidth: "800px" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
          Selección Aleatoria
        </p>
        <h1 className="page-title" style={{ marginBottom: "0.3rem" }}>Ruleta de Artistas</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Gira para definir la banda o proyecto sonoro de la semana.
        </p>
      </div>

      {!isAdmin && (
        <div style={{ padding: "0.85rem 1.25rem", backgroundColor: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "12px", color: "var(--accent-amber)", marginBottom: "1.5rem", fontSize: "0.85rem", fontWeight: 600 }}>
          Modo Espectador: Solo los administradores pueden tirar la ruleta oficial.
        </div>
      )}

      {/* CONTROLES DE ÉPOCA Y ORIGEN */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        <div className="card" style={{ padding: "1.2rem" }}>
          <label style={{ display: "block", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.6rem", fontWeight: 700 }}>
            Época
          </label>
          <div className="segmented-control" style={{ width: "100%", display: "flex" }}>
            <button
              type="button"
              disabled={isSpinning}
              className={`segmented-btn ${category === "actuales" ? "active" : ""}`}
              onClick={() => handleConfigChange("category", "actuales")}
              style={{ flex: 1 }}
            >
              Actuales
            </button>
            <button
              type="button"
              disabled={isSpinning}
              className={`segmented-btn ${category === "ogs" ? "active" : ""}`}
              onClick={() => handleConfigChange("category", "ogs")}
              style={{ flex: 1 }}
            >
              OG's
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: "1.2rem" }}>
          <label style={{ display: "block", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.6rem", fontWeight: 700 }}>
            Origen de Lista
          </label>
          <div className="segmented-control" style={{ width: "100%", display: "flex" }}>
            <button
              type="button"
              disabled={isSpinning}
              className={`segmented-btn ${listType === "official" ? "active" : ""}`}
              onClick={() => handleConfigChange("listType", "official")}
              style={{ flex: 1 }}
            >
              Oficial
            </button>
            <button
              type="button"
              disabled={isSpinning}
              className={`segmented-btn ${listType === "suggestion" ? "active" : ""}`}
              onClick={() => handleConfigChange("listType", "suggestion")}
              style={{ flex: 1 }}
            >
              Sugerencias
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: "0.85rem 1.25rem", marginBottom: "1.5rem", borderRadius: "10px", backgroundColor: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", color: "#93c5fd", fontSize: "0.9rem" }}
        >
          {statusMessage}
        </motion.div>
      )}

      {/* SECCIÓN PRINCIPAL DE LA RULETA */}
      <section className="card" style={{ textAlign: "center", padding: "2.75rem 1.5rem", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          <span>Disponibles: <strong style={{ color: "var(--text-main)" }}>{rouletteCandidates.length}</strong></span>
          <span>Intento: <strong style={{ color: "var(--text-main)" }}>{spinCount} de 3</strong></span>
        </div>

        {/* CONTENEDOR DEL ARTISTA SELECCIONADO */}
        <motion.div
          animate={{ boxShadow: winner ? `0 0 45px ${glowBg}` : "inset 0 4px 20px rgba(0,0,0,0.5)", borderColor: glowColor }}
          transition={{ duration: 0.5 }}
          style={{
            background: "var(--bg-main)",
            border: `1px solid ${glowColor}`,
            borderRadius: "18px",
            padding: "2.5rem 1.5rem",
            marginBottom: "2rem",
            minHeight: "220px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}
        >
          {displayedArtist ? (
            <>
              {displayedArtist.spotifyImage ? (
                <motion.img
                  key={displayedArtist.id || displayedArtist.name}
                  src={displayedArtist.spotifyImage}
                  alt={displayedArtist.name}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: isSpinning ? [1, 1.08, 1] : 1, opacity: 1 }}
                  transition={{ duration: isSpinning ? 0.15 : 0.3, repeat: isSpinning ? Infinity : 0 }}
                  style={{
                    width: "110px",
                    height: "110px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: "1rem",
                    border: `2px solid ${glowColor}`,
                    boxShadow: winner ? `0 10px 35px ${glowBg}` : "0 10px 25px rgba(0,0,0,0.6)"
                  }}
                />
              ) : (
                <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🎤</div>
              )}

              <motion.h2 
                animate={{ color: glowColor }}
                style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 800, margin: 0 }}
              >
                {displayedArtist.name}
              </motion.h2>
            </>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", fontStyle: "italic", margin: 0 }}>
              Presiona el botón para tirar la ruleta...
            </p>
          )}

          {spinCount > 0 && spinCount < 3 && !isSpinning && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.75rem", marginBottom: 0 }}>
              {spinCount === 1 ? "1er descarte completado." : "2do descarte completado. ¡El siguiente tiro es el definitivo!"}
            </p>
          )}
        </motion.div>

        {/* BOTON DE TIRAR (Visible si no hay ganador aún) */}
        {!winner && isAdmin && spinCount < 3 && (
          <button
            onClick={spin}
            disabled={isSpinning || rouletteCandidates.length === 0}
            className="btn"
            style={{
              width: "100%",
              backgroundColor: "var(--text-main)",
              color: "#000",
              fontWeight: 800,
              padding: "1rem",
              fontSize: "1.1rem",
              borderRadius: "999px",
              justifyContent: "center",
              boxShadow: "0 8px 25px rgba(255,255,255,0.15)"
            }}
          >
            {isSpinning ? "Girando..." : spinCount === 0 ? "Tirar Ruleta (1/3)" : spinCount === 1 ? "Tirar Ruleta (2/3)" : "Tiro Final (3/3)"}
          </button>
        )}

        {/* ACCIONES DEL GANADOR */}
        {winner && isAdmin && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            
            {listType === "suggestion" && (
              <button
                type="button"
                onClick={promoteToOfficial}
                className="btn"
                style={{ width: "100%", justifyContent: "center", backgroundColor: "transparent", border: "1px solid var(--border)", color: "#fff", padding: "0.75rem" }}
              >
                Mover a Lista Oficial
              </button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={setArtistOfTheWeek}
              disabled={isCrowning}
              className="btn"
              style={{ width: "100%", backgroundColor: glowColor, color: "#000", fontWeight: 800, padding: "0.85rem", borderRadius: "999px", boxShadow: `0 6px 20px ${glowBg}` }}
            >
              {isCrowning ? "Sincronizando..." : "Coronar como Artista de la Semana"}
            </motion.button>

            <button
              type="button"
              onClick={resetRoulette}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline", marginTop: "0.25rem" }}
            >
              Reiniciar ruleta
            </button>
          </motion.div>
        )}
      </section>
    </motion.main>
  );
};