import React, { useState, useEffect } from "react";
import { collection, onSnapshot, setDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";

export const Roulette = () => {
  const [artists, setArtists] = useState([]);
  
  // Controles de las 4 Ruletas
  const [category, setCategory] = useState("actuales"); 
  const [listType, setListType] = useState("official"); 
  
  // Estados de la ruleta
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayedName, setDisplayedName] = useState("?");
  const [winner, setWinner] = useState(null);
  const [spinCount, setSpinCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "artists"), (snapshot) => {
      const artistData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArtists(artistData);
    });
    return () => unsubscribe();
  }, []);

  const rouletteCandidates = artists.filter(a => 
    a.category === category && a.status === listType
  );

  const spin = () => {
    if (rouletteCandidates.length === 0) {
      alert(`No hay artistas disponibles en esta lista.`);
      return;
    }

    setIsSpinning(true);
    setWinner(null);

    let ticks = 0;
    const maxTicks = 40; 
    
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * rouletteCandidates.length);
      setDisplayedName(rouletteCandidates[randomIdx].name);
      ticks++;

      if (ticks >= maxTicks) {
        clearInterval(interval);
        
        const landedArtist = rouletteCandidates[Math.floor(Math.random() * rouletteCandidates.length)];
        setDisplayedName(landedArtist.name);
        
        const newCount = spinCount + 1;
        setSpinCount(newCount);

        if (newCount === 3) {
          setWinner(landedArtist);
        }
        
        setIsSpinning(false);
      }
    }, 75); 
  };

  const setArtistOfTheWeek = async () => {
    if (!winner) return;
    try {
      await setDoc(doc(db, "globals", "general"), {
        name: winner.name,
        category: winner.category
      });
      alert(`🎉 ¡${winner.name} coronado con éxito! Ve al Dashboard para revisarlo.`);
      resetRoulette();
    } catch (error) {
      console.error("Error al coronar al artista:", error);
    }
  };

  // NUEVA FUNCIÓN: Ascender de Sugerencias a Oficial
  const promoteToOfficial = async () => {
    if (!winner) return;
    try {
      await updateDoc(doc(db, "artists", winner.id), {
        status: "official"
      });
      alert(`🚀 ¡${winner.name} ha sido ascendido a la Lista Oficial de ${winner.category.toUpperCase()}!`);
      resetRoulette();
    } catch (error) {
      console.error("Error al promover al artista:", error);
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
    setDisplayedName("?");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "15px" }}>La Ruleta del Autismo 🎡</h1>

      <div style={{ background: "#222", padding: "20px", borderRadius: "15px", marginBottom: "30px", display: "flex", flexDirection: "column", gap: "15px" }}>
        
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <span style={{ color: "#aaa", alignSelf: "center", marginRight: "10px", fontWeight: "bold" }}>Época:</span>
          <button 
            onClick={() => handleConfigChange("category", "ogs")} disabled={isSpinning}
            style={{ padding: "8px 25px", fontSize: "1rem", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: isSpinning ? "not-allowed" : "pointer", backgroundColor: category === "ogs" ? "#ffcc00" : "#444", color: category === "ogs" ? "black" : "white", opacity: isSpinning ? 0.5 : 1 }}
          >
            OG's
          </button>
          <button 
            onClick={() => handleConfigChange("category", "actuales")} disabled={isSpinning}
            style={{ padding: "8px 25px", fontSize: "1rem", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: isSpinning ? "not-allowed" : "pointer", backgroundColor: category === "actuales" ? "#2196F3" : "#444", color: "white", opacity: isSpinning ? 0.5 : 1 }}
          >
            Actuales
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <span style={{ color: "#aaa", alignSelf: "center", marginRight: "10px", fontWeight: "bold" }}>Tipo:</span>
          <button 
            onClick={() => handleConfigChange("listType", "official")} disabled={isSpinning}
            style={{ padding: "8px 25px", fontSize: "1rem", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: isSpinning ? "not-allowed" : "pointer", backgroundColor: listType === "official" ? "#4CAF50" : "#444", color: "white", opacity: isSpinning ? 0.5 : 1 }}
          >
            Lista Oficial
          </button>
          <button 
            onClick={() => handleConfigChange("listType", "suggestion")} disabled={isSpinning}
            style={{ padding: "8px 25px", fontSize: "1rem", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: isSpinning ? "not-allowed" : "pointer", backgroundColor: listType === "suggestion" ? "#9c27b0" : "#444", color: "white", opacity: isSpinning ? 0.5 : 1 }}
          >
            Sugerencias
          </button>
        </div>

      </div>

      <p style={{ color: "#888", marginBottom: "20px" }}>
        Participan {rouletteCandidates.length} artistas en esta ruleta.
      </p>

      <div style={{ height: "30px", marginBottom: "10px", color: "#aaa", fontSize: "1.2rem", fontStyle: "italic" }}>
        {spinCount === 1 && !isSpinning && `¡Uf! ${displayedName} se salvó esta vez...`}
        {spinCount === 2 && !isSpinning && `¡${displayedName} a punto de caer! Se viene el tiro final...`}
      </div>

      <div style={{ background: "#1a1a1a", border: `2px solid ${category === "ogs" ? "#ffcc00" : "#2196F3"}`, borderRadius: "20px", padding: "60px 20px", marginBottom: "30px", minHeight: "200px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
        <h2 style={{ 
          fontSize: displayedName === "?" ? "6rem" : "4rem", 
          margin: 0, 
          color: winner ? "#4CAF50" : (spinCount > 0 ? "#fff" : "#fff"),
          transition: "color 0.3s ease",
          wordBreak: "break-word"
        }}>
          {displayedName}
        </h2>
      </div>

      {spinCount < 3 && (
        <button 
          onClick={spin} 
          disabled={isSpinning}
          style={{ padding: "15px 50px", fontSize: "1.5rem", fontWeight: "bold", background: isSpinning ? "#555" : (spinCount === 2 ? "#f44336" : "#2196F3"), color: "white", border: "none", borderRadius: "30px", cursor: isSpinning ? "not-allowed" : "pointer", transition: "transform 0.1s" }}
          onMouseDown={(e) => !isSpinning && (e.currentTarget.style.transform = "scale(0.95)")}
          onMouseUp={(e) => !isSpinning && (e.currentTarget.style.transform = "scale(1)")}
        >
          {isSpinning ? "Girando..." : spinCount === 0 ? "🎲 PRIMER TIRO (1/3)" : spinCount === 1 ? "🎲 SEGUNDO TIRO (2/3)" : "🔥 TIRO FINAL (3/3) 🔥"}
        </button>
      )}

      {/* Pantalla del ganador final con controles adaptables */}
      {winner && !isSpinning && (
        <div style={{ animation: "fadeIn 0.5s ease", display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
          <h3 style={{ color: "#4CAF50", fontSize: "1.8rem", margin: "0 0 10px 0" }}>¡EL GANADOR DEFINITIVO!</h3>
          
          {/* Botón extra EXCLUSIVO para sugerencias */}
          {listType === "suggestion" && (
            <button 
              onClick={promoteToOfficial}
              style={{ width: "100%", maxWidth: "400px", padding: "15px 20px", fontSize: "1.1rem", fontWeight: "bold", background: "#9c27b0", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", boxShadow: "0 4px 15px rgba(156, 39, 176, 0.4)" }}
            >
              ⬆️ Ascender a Lista Oficial
            </button>
          )}

          {/* Botón de coronar siempre disponible */}
          <button 
            onClick={setArtistOfTheWeek}
            style={{ width: "100%", maxWidth: "400px", padding: "15px 20px", fontSize: "1.1rem", fontWeight: "bold", background: "#ffcc00", color: "black", border: "none", borderRadius: "10px", cursor: "pointer", boxShadow: "0 4px 15px rgba(255, 204, 0, 0.4)" }}
          >
            🏆 Coronar como Artista de la Semana
          </button>
          
          <button 
            onClick={resetRoulette}
            style={{ marginTop: "10px", background: "none", border: "none", color: "#aaa", textDecoration: "underline", cursor: "pointer", fontSize: "1rem" }}
          >
            Abortar misión y volver a empezar (nadie vio nada 👀)
          </button>
        </div>
      )}

    </div>
  );
};