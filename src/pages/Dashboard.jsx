import React, { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, collection } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../context/AuthContext.jsx";

export const Dashboard = () => {
  const { user } = useAuth();
  const [currentArtist, setCurrentArtist] = useState(null);
  const [userProgress, setUserProgress] = useState("por_escuchar"); 
  const [groupProgress, setGroupProgress] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsubArtist = onSnapshot(doc(db, "globals", "general"), (docSnap) => {
      if (docSnap.exists()) setCurrentArtist(docSnap.data());
    });

    const unsubProgress = onSnapshot(collection(db, "progress"), (snapshot) => {
      const progressData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const currentWeekProgress = progressData.filter(p => p.artistName === currentArtist?.name);
      setGroupProgress(currentWeekProgress);
      const myProgress = currentWeekProgress.find(p => p.id === user.uid);
      setUserProgress(myProgress ? myProgress.status : "por_escuchar");
    });

    return () => { unsubArtist(); unsubProgress(); };
  }, [user, currentArtist?.name]);

  const handleUpdateProgress = async (status) => {
    if (!user || !currentArtist?.name) return;
    try {
      await setDoc(doc(db, "progress", user.uid), {
        displayName: user.displayName,
        status: status,
        artistName: currentArtist.name,
        updatedAt: new Date()
      });
      setUserProgress(status);
    } catch (error) { console.error("Error:", error); }
  };

  const isArtistValid = currentArtist && currentArtist.name;

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h2 style={{ color: "#aaa" }}>Bienvenido, {user?.displayName}</h2>
      <h1 style={{ fontSize: "2.5rem", margin: "30px 0 10px 0" }}>Artista de la Semana 🏆</h1>
      
      {!isArtistValid ? (
        <div style={{ padding: "40px", background: "#222", borderRadius: "15px", marginTop: "20px" }}>
          <h3>Aún no hay artista seleccionado. ¡Vayan a girar la Ruleta! 🎡</h3>
        </div>
      ) : (
        <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "15px", padding: "40px", marginTop: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          
          <div style={{ marginBottom: "20px" }}>
            <span style={{ background: currentArtist.category === "ogs" ? "#ffcc00" : "#2196F3", color: currentArtist.category === "ogs" ? "black" : "white", padding: "5px 15px", borderRadius: "20px", fontWeight: "bold", textTransform: "uppercase", fontSize: "0.9rem" }}>
              {currentArtist.category}
            </span>
          </div>

          {/* AQUÍ ESTÁ LA MAGIA DE LA FOTO */}
          {currentArtist.spotifyImage && (
            <img 
              src={currentArtist.spotifyImage} 
              alt={currentArtist.name} 
              style={{ width: "200px", height: "200px", objectFit: "cover", borderRadius: "50%", boxShadow: "0 10px 25px rgba(0,0,0,0.8)", marginBottom: "20px" }}
            />
          )}
          
          <h2 style={{ fontSize: "4rem", margin: "0 0 30px 0" }}>{currentArtist.name}</h2>
          
          {/* AQUÍ ESTÁ EL LINK DINÁMICO */}
          <a 
            href={currentArtist.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(currentArtist.name)}/artists`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ display: "inline-block", background: "#1DB954", color: "white", padding: "12px 30px", borderRadius: "30px", textDecoration: "none", fontWeight: "bold", fontSize: "1.2rem", transition: "transform 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Escuchar en Spotify 🎧
          </a>
        </div>
      )}

      {isArtistValid && (
        <div style={{ marginTop: "50px", background: "#222", padding: "30px", borderRadius: "15px" }}>
          <h3>¿Cómo vas esta semana?</h3>
          <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginTop: "20px", flexWrap: "wrap" }}>
            <button onClick={() => handleUpdateProgress("por_escuchar")} style={{ padding: "10px 20px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", background: userProgress === "por_escuchar" ? "#f44336" : "#444", color: "white" }}>🥱 Por escuchar</button>
            <button onClick={() => handleUpdateProgress("escuchando")} style={{ padding: "10px 20px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", background: userProgress === "escuchando" ? "#ffcc00" : "#444", color: userProgress === "escuchando" ? "black" : "white" }}>🎧 Escuchando</button>
            <button onClick={() => handleUpdateProgress("terminado")} style={{ padding: "10px 20px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", background: userProgress === "terminado" ? "#4CAF50" : "#444", color: "white" }}>✅ Terminado</button>
          </div>

          <div style={{ marginTop: "40px", textAlign: "left", background: "#111", padding: "20px", borderRadius: "10px" }}>
            <h4 style={{ margin: "0 0 15px 0", borderBottom: "1px solid #333", paddingBottom: "10px" }}>Progreso del Grupo:</h4>
            {groupProgress.length === 0 ? (
              <p style={{ color: "#666", margin: 0 }}>Nadie ha marcado su progreso aún...</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {groupProgress.map(friend => (
                  <li key={friend.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#222", padding: "10px 15px", borderRadius: "5px" }}>
                    <span>{friend.displayName}</span>
                    <span style={{ fontSize: "0.85rem", padding: "4px 10px", borderRadius: "12px", fontWeight: "bold", background: friend.status === "terminado" ? "#4CAF50" : friend.status === "escuchando" ? "#ffcc00" : "#f44336", color: friend.status === "escuchando" ? "black" : "white" }}>
                      {friend.status === "terminado" ? "Terminado" : friend.status === "escuchando" ? "Escuchando" : "Por escuchar"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};