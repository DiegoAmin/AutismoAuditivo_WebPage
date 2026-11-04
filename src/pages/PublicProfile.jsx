import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";

export const PublicProfile = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para manejar el hover individual en cada tarjeta del grid
  const [hoveredTrackIndex, setHoveredTrackIndex] = useState(null);
  const [hoveredAlbumIndex, setHoveredAlbumIndex] = useState(null);

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

  // Función constructora para generar la "Parrilla de Vinilos" de los Tops
  const renderGrid = (items, type, hoveredIndex, setHoveredIndex) => {
    if (items.length === 0) {
      return <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontStyle: "italic" }}>Aún no hay {type} en este Top.</p>;
    }

    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "1.25rem"
      }}>
        {items.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <article
              key={idx}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                overflow: "hidden",
                position: "relative",
                aspectRatio: "1 / 1",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                transform: isHovered ? "translateY(-4px)" : "none",
                boxShadow: isHovered ? "0 12px 28px rgba(0,0,0,0.6)" : "none"
              }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* PORTADA EN ALTA CALIDAD */}
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.35s ease",
                    transform: isHovered ? "scale(1.08)" : "scale(1)"
                  }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", backgroundColor: "#111" }}>
                  {type === 'canciones' ? '🎵' : '💿'}
                </div>
              )}

              {/* MEDALLA DEL RANKING (#1, #2, etc.) */}
              <span style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                background: "var(--accent-amber)",
                color: "#000",
                padding: "0.25rem 0.65rem",
                borderRadius: "999px",
                fontSize: "0.85rem",
                fontWeight: 800,
                zIndex: 2,
                boxShadow: "0 4px 10px rgba(0,0,0,0.5)"
              }}>
                #{idx + 1}
              </span>

              {/* CRISTAL DE HOVER CON INFO Y BOTÓN DE SPOTIFY */}
              <div
                onClick={() => setHoveredIndex(isHovered ? null : idx)}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(9, 9, 11, 0.85)",
                  backdropFilter: "blur(5px)",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 0.22s ease",
                  pointerEvents: isHovered ? "auto" : "none",
                  zIndex: 3
                }}
              >
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: "0.2rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {item.name}
                </h4>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem", display: "block" }}>
                  {item.artist}
                </span>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      backgroundColor: "var(--accent-green)",
                      color: "#000",
                      padding: "0.4rem 0.9rem",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Escuchar
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <main className="page-container" style={{ maxWidth: "1050px", margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} className="btn" style={{ marginBottom: "1.5rem", padding: "0.4rem 0.8rem", fontSize: "0.85rem", backgroundColor: "transparent", border: "1px solid var(--border)" }}>
        ← Volver
      </button>

      <section className="card" style={{ padding: "2.5rem 2rem" }}>
        {/* CABECERA DEL PERFIL */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "3rem" }}>
          <div style={{ width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "var(--bg-elevated)", border: "3px solid var(--accent-blue)", overflow: "hidden", marginBottom: "1.25rem", boxShadow: "0 8px 20px rgba(0,0,0,0.5)" }}>
            <img 
              src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.username || "User"}&background=1c1c21&color=fafafa`} 
              alt="Avatar" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${profile.username || "User"}&background=1c1c21&color=fafafa`; }} 
            />
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>{profile.username || "Usuario"}</h1>
        </div>

        {/* PARRILLA DE CANCIONES */}
        <div style={{ marginBottom: "3.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Top 5 Canciones
          </h3>
          {renderGrid(topTracks, "canciones", hoveredTrackIndex, setHoveredTrackIndex)}
        </div>

        {/* PARRILLA DE ÁLBUMES */}
        <div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Top 5 Álbumes
          </h3>
          {renderGrid(topAlbums, "álbumes", hoveredAlbumIndex, setHoveredAlbumIndex)}
        </div>
      </section>
    </main>
  );
};