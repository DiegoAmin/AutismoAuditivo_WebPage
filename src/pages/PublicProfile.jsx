import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";

export const PublicProfile = () => {
  const { uid } = useParams(); // Leemos el ID de la URL
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (error) {
        console.error("Error al cargar perfil público:", error);
      } finally {
        setLoading(false);
      }
    };
    if (uid) fetchProfile();
  }, [uid]);

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>Buscando en la base de datos... 👽</div>;

  if (!profile) return (
    <div className="page-container" style={{ textAlign: "center", padding: "4rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>Perfil no encontrado</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Este compa aún no ha configurado su perfil.</p>
      <button onClick={() => navigate(-1)} className="btn" style={{ backgroundColor: "var(--bg-elevated)" }}>Regresar</button>
    </div>
  );

  const topTracks = profile.topTracks || [];
  const topAlbums = profile.topAlbums || [];

  return (
    <main className="page-container" style={{ maxWidth: "700px", margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} className="btn" style={{ marginBottom: "1.5rem", padding: "0.4rem 0.8rem", fontSize: "0.85rem", backgroundColor: "transparent", border: "1px solid var(--border)" }}>
        ← Volver
      </button>

      <section className="card" style={{ padding: "2.5rem 2rem" }}>
        {/* CABECERA VISUAL */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "3rem" }}>
          <div style={{ width: "110px", height: "110px", borderRadius: "50%", backgroundColor: "var(--bg-elevated)", border: "3px solid var(--accent-blue)", overflow: "hidden", marginBottom: "1.25rem" }}>
            <img 
              src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.username || "User"}&background=1c1c21&color=fafafa`} 
              alt="Avatar" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${profile.username || "User"}&background=1c1c21&color=fafafa`; }} 
            />
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0 }}>{profile.username || "Usuario"}</h1>
        </div>

        {/* TOP 5 CANCIONES (Solo lectura) */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🎵 Top Canciones
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {topTracks.length > 0 ? topTracks.map((t, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", background: "var(--bg-main)", border: "1px solid var(--border)", padding: "0.5rem 0.75rem", borderRadius: "8px" }}>
                <span style={{ fontWeight: 800, color: "var(--accent-amber)", width: "25px", fontSize: "1rem" }}>{idx + 1}</span>
                {t.image && <img src={t.image} alt="" style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover", marginRight: "1rem" }} />}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <strong style={{ display: "block", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</strong>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{t.artist}</span>
                </div>
                {t.url && (
                  <a href={t.url} target="_blank" rel="noopener noreferrer" style={{ padding: "0.5rem", color: "var(--accent-green)", display: "flex", alignItems: "center" }} title="Escuchar en Spotify">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                  </a>
                )}
              </div>
            )) : <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>Aún no hay rolas en este Top.</p>}
          </div>
        </div>

        {/* TOP 5 ÁLBUMES (Solo lectura) */}
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            💿 Top Álbumes
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {topAlbums.length > 0 ? topAlbums.map((a, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", background: "var(--bg-main)", border: "1px solid var(--border)", padding: "0.5rem 0.75rem", borderRadius: "8px" }}>
                <span style={{ fontWeight: 800, color: "var(--accent-amber)", width: "25px", fontSize: "1rem" }}>{idx + 1}</span>
                {a.image && <img src={a.image} alt="" style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover", marginRight: "1rem" }} />}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <strong style={{ display: "block", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</strong>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{a.artist}</span>
                </div>
                {a.url && (
                  <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ padding: "0.5rem", color: "var(--accent-green)", display: "flex", alignItems: "center" }} title="Escuchar en Spotify">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                  </a>
                )}
              </div>
            )) : <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>Aún no hay álbumes en este Top.</p>}
          </div>
        </div>
      </section>
    </main>
  );
};