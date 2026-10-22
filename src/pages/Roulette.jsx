import React, { useState, useEffect } from "react";
import { collection, onSnapshot, setDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";

export const Roulette = () => {
  const [artists, setArtists] = useState([]);
  const [category, setCategory] = useState("actuales");
  const [listType, setListType] = useState("official");

  const [isSpinning, setIsSpinning] = useState(false);
  const [displayedName, setDisplayedName] = useState("—");
  const [winner, setWinner] = useState(null);
  const [spinCount, setSpinCount] = useState(0);
  const [isCrowning, setIsCrowning] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "artists"), (snapshot) => {
      const artistData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setArtists(artistData);
    });
    return () => unsubscribe();
  }, []);

  const rouletteCandidates = artists.filter(a => a.category === category && a.status === listType);

  const spin = () => {
    if (rouletteCandidates.length === 0) {
      setStatusMessage("No hay artistas registrados en esta combinación.");
      return;
    }
    setStatusMessage(null);
    setIsSpinning(true);
    setWinner(null);
    let ticks = 0;

    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * rouletteCandidates.length);
      setDisplayedName(rouletteCandidates[randomIdx].name);
      ticks++;

      if (ticks >= 40) {
        clearInterval(interval);
        const landedArtist = rouletteCandidates[Math.floor(Math.random() * rouletteCandidates.length)];
        setDisplayedName(landedArtist.name);
        setSpinCount(prev => {
          if (prev + 1 === 3) setWinner(landedArtist);
          return prev + 1;
        });
        setIsSpinning(false);
      }
    }, 75);
  };

  const setArtistOfTheWeek = async () => {
    if (!winner) return;
    setIsCrowning(true);
    setStatusMessage(null);

    try {
      let spotifyUrl = "";
      let spotifyImage = null;
      const cleanName = winner.name.trim();

      try {
        const res = await fetch(`/api/spotify?artist=${encodeURIComponent(cleanName)}`);
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (res.ok && data.url) {
            spotifyUrl = data.url;
            spotifyImage = data.image || null;
          }
        } catch (jsonErr) {
          console.error("Respuesta no válida de API:", text.substring(0, 100));
        }
      } catch (err) {
        console.error("Error de red contactando Spotify API:", err);
      }

      await setDoc(doc(db, "globals", "general"), {
        name: cleanName,
        category: winner.category,
        spotifyUrl: spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(cleanName)}/artists`,
        spotifyImage: spotifyImage
      });

      resetRoulette();
      setStatusMessage(`${cleanName} fue asignado como Artista de la Semana.`);
    } catch (error) {
      console.error("Error al coronar al artista:", error);
    } finally {
      setIsCrowning(false);
    }
  };

  const promoteToOfficial = async () => {
    if (!winner) return;
    try {
      await updateDoc(doc(db, "artists", winner.id), { status: "official" });
      const promotedName = winner.name;
      resetRoulette();
      setStatusMessage(`${promotedName} fue movido a la Lista Oficial.`);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleConfigChange = (type, value) => {
    if (type === "category") setCategory(value);
    if (type === "listType") setListType(value);
    resetRoulette();
  };

  const resetRoulette = () => {
    setSpinCount(0);
    setWinner(null);
    setDisplayedName("—");
    setStatusMessage(null);
  };

  return (
    <main className="page-container">
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
          Selección aleatoria
        </p>
        <h1 className="page-title">Ruleta de Artistas</h1>
      </div>

      <div className="control-grid">
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>
            ÉPOCA
          </label>
          <div className="segmented-control">
            <button
              onClick={() => handleConfigChange("category", "ogs")}
              disabled={isSpinning}
              className="segmented-btn"
              style={{
                backgroundColor: category === "ogs" ? "var(--accent-amber)" : "transparent",
                color: category === "ogs" ? "#000" : "var(--text-muted)"
              }}
            >
              OG's
            </button>
            <button
              onClick={() => handleConfigChange("category", "actuales")}
              disabled={isSpinning}
              className="segmented-btn"
              style={{
                backgroundColor: category === "actuales" ? "var(--accent-blue)" : "transparent",
                color: category === "actuales" ? "#fff" : "var(--text-muted)"
              }}
            >
              Actuales
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>
            ORIGEN DE LISTA
          </label>
          <div className="segmented-control">
            <button
              onClick={() => handleConfigChange("listType", "official")}
              disabled={isSpinning}
              className="segmented-btn"
              style={{
                backgroundColor: listType === "official" ? "var(--bg-elevated)" : "transparent",
                color: listType === "official" ? "var(--text-main)" : "var(--text-muted)"
              }}
            >
              Oficial
            </button>
            <button
              onClick={() => handleConfigChange("listType", "suggestion")}
              disabled={isSpinning}
              className="segmented-btn"
              style={{
                backgroundColor: listType === "suggestion" ? "var(--bg-elevated)" : "transparent",
                color: listType === "suggestion" ? "var(--text-main)" : "var(--text-muted)"
              }}
            >
              Sugerencias
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div style={{
          padding: "0.85rem 1rem",
          marginBottom: "1.25rem",
          borderRadius: "10px",
          backgroundColor: "rgba(59, 130, 246, 0.12)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          color: "#93c5fd",
          fontSize: "0.9rem"
        }}>
          {statusMessage}
        </div>
      )}

      <section className="card" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          <span>{rouletteCandidates.length} artistas disponibles</span>
          <span>Intento {spinCount} de 3</span>
        </div>

        <div style={{
          background: "var(--bg-main)",
          border: `1px solid ${winner ? "var(--accent-green)" : "var(--border)"}`,
          borderRadius: "12px",
          padding: "3.5rem 1.25rem",
          marginBottom: "1.5rem",
          minHeight: "180px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <h2 className="artist-hero-name" style={{ margin: 0, color: winner ? "var(--accent-green)" : "var(--text-main)" }}>
            {displayedName}
          </h2>
          {spinCount > 0 && spinCount < 3 && !isSpinning && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.75rem" }}>
              {spinCount === 1 ? "Primer descarte completado." : "Segundo descarte completado. El siguiente tiro es definitivo."}
            </p>
          )}
        </div>

        {spinCount < 3 && (
          <button
            onClick={spin}
            disabled={isSpinning}
            className="btn"
            style={{
              width: "100%",
              maxWidth: "360px",
              padding: "1rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: spinCount === 2 ? "var(--accent-red)" : "var(--accent-blue)",
              color: "#fff"
            }}
          >
            {isSpinning ? "Seleccionando..." : spinCount === 0 ? "Iniciar primer tiro (1/3)" : spinCount === 1 ? "Girar segundo tiro (2/3)" : "Ejecutar tiro definitivo (3/3)"}
          </button>
        )}

        {winner && !isSpinning && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", maxWidth: "400px", margin: "0 auto" }}>
            <p style={{ color: "var(--accent-green)", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Seleccionado definitivo
            </p>

            {listType === "suggestion" && (
              <button
                onClick={promoteToOfficial}
                className="btn"
                style={{ width: "100%", backgroundColor: "var(--accent-purple)", color: "#fff" }}
              >
                Mover a Lista Oficial
              </button>
            )}

            <button
              onClick={setArtistOfTheWeek}
              disabled={isCrowning}
              className="btn"
              style={{
                width: "100%",
                backgroundColor: "var(--accent-amber)",
                color: "#000",
                fontWeight: 700
              }}
            >
              {isCrowning ? "Sincronizando con Spotify..." : "Asignar como Artista de la Semana"}
            </button>

            <button
              onClick={resetRoulette}
              style={{
                marginTop: "0.5rem",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "0.85rem",
                textDecoration: "underline"
              }}
            >
              Reiniciar ruleta
            </button>
          </div>
        )}
      </section>
    </main>
  );
};