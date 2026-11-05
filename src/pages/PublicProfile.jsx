import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { motion } from "framer-motion";
import { FastAverageColor } from "fast-average-color";

export const PublicProfile = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [hoveredTrackIndex, setHoveredTrackIndex] = useState(null);
  const [hoveredAlbumIndex, setHoveredAlbumIndex] = useState(null);
  
  // Estado para el color reactivo del BANGER
  const [glowColor, setGlowColor] = useState("rgba(245, 158, 11, 1)");
  const [glowBg, setGlowBg] = useState("rgba(245, 158, 11, 0.12)");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    if (uid) fetchProfile();
  }, [uid]);

  const showcaseTrack = profile?.showcaseTrack;
  const topTracks = profile?.topTracks || [];
  const topAlbums = profile?.topAlbums || [];

  // Extracción del color dominante del BANGER
  useEffect(() => {
    if (showcaseTrack && showcaseTrack.image) {
      const fac = new FastAverageColor();
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = showcaseTrack.image;

      img.onload = () => {
        try {
          const color = fac.getColor(img);
          const [r, g, b] = color.value;
          
          document.body.style.backgroundImage = `radial-gradient(ellipse 95% 65% at 50% -10%, rgba(${r}, ${g}, ${b}, 0.16), transparent)`;
          setGlowColor(`rgb(${r}, ${g}, ${b})`);
          setGlowBg(`rgba(${r}, ${g}, ${b}, 0.15)`);
          
          fac.destroy();
        } catch (e) {
          console.error("Error al extraer color de la rola:", e);
        }
      };
    }

    return () => {
      document.body.style.backgroundImage = "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(29, 185, 84, 0.08), transparent)";
    };
  }, [showcaseTrack?.image]);

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>Buscando en la base de datos... 👽</div>;

  if (!profile) return (
    <div className="page-container" style={{ textAlign: "center", padding: "4rem" }}>
      <h2>Perfil no encontrado</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Este compa aún no ha configurado su perfil.</p>
      <button onClick={() => navigate(-1)} className="btn">Regresar</button>
    </div>
  );

  const renderGrid = (items, type, hoveredIndex, setHoveredIndex) => {
    if (items.length === 0) {
      return <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontStyle: "italic" }}>Aún no hay {type} en este Top.</p>;
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: "1.25rem" }}>
        {items.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <motion.article
              key={idx}
              whileHover={{ y: -6 }}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                overflow: "hidden",
                position: "relative",
                aspectRatio: "1 / 1",
                boxShadow: isHovered ? `0 16px 30px ${glowBg}` : "none"
              }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.35s ease", transform: isHovered ? "scale(1.08)" : "scale(1)" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", backgroundColor: "#111" }}>{type === 'canciones' ? '🎵' : '💿'}</div>
              )}

              <span style={{ position: "absolute", top: "10px", left: "10px", background: glowColor, color: "#000", padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 800, zIndex: 2 }}>
                #{idx + 1}
              </span>

              <div
                onClick={() => setHoveredIndex(isHovered ? null : idx)}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(9, 9, 11, 0.88)",
                  backdropFilter: "blur(6px)",
                  borderRadius: "14px", 
                  padding: "0.85rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 0.2s ease",
                  pointerEvents: isHovered ? "auto" : "none",
                  zIndex: 3
                }}
              >
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", marginBottom: "0.2rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.name}</h4>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.8rem" }}>{item.artist}</span>

                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn" style={{ backgroundColor: glowColor, color: "#000", padding: "0.35rem 0.8rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700 }}>
                    Escuchar
                  </a>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    );
  };

  return (
    <motion.main 
      className="page-container" 
      style={{ maxWidth: "1050px", margin: "0 auto" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button onClick={() => navigate(-1)} className="btn" style={{ marginBottom: "1.5rem", padding: "0.4rem 0.85rem", fontSize: "0.85rem", backgroundColor: "transparent", border: "1px solid var(--border)" }}>
        ← Volver
      </button>

      <section className="card" style={{ position: "relative", overflow: "hidden", padding: 0, border: `1px solid ${glowBg}`, boxShadow: `0 20px 50px -15px ${glowBg}` }}>
        
        {/* BANNER DIFUMINADO AL FONDO */}
        {showcaseTrack?.image && (
          <div 
            style={{
              position: "absolute",
              top: "-40px",
              left: "-40px",
              right: "-40px",
              height: "550px",
              backgroundImage: `url(${showcaseTrack.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(25px)",
              opacity: 0.45,
              zIndex: 0,
              maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 95%)",
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 95%)"
            }}
          />
        )}

        {/* CONTENIDO DE LA TARJETA */}
        <div style={{ padding: "2.5rem 2rem", position: "relative", zIndex: 1 }}>
          
          {/* CABECERA (AVATAR Y NOMBRE) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2.5rem" }}>
            <div style={{ width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "var(--bg-elevated)", border: `3px solid ${glowColor}`, overflow: "hidden", marginBottom: "1.25rem", boxShadow: `0 10px 30px ${glowBg}` }}>
              <img 
                src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.username || "User"}&background=1c1c21&color=fafafa`} 
                alt="Avatar" 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${profile.username || "User"}&background=1c1c21&color=fafafa`; }} 
              />
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>{profile.username || "Usuario"}</h1>
          </div>

          {/* SHOWCASE TRACK DESTACADO (BANGER) */}
          {showcaseTrack && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: `linear-gradient(135deg, ${glowBg} 0%, rgba(18, 18, 23, 0.95) 100%)`,
                border: `1px solid ${glowColor}`,
                borderRadius: "20px",
                padding: "1.25rem",
                marginBottom: "3rem",
                display: "flex",
                flexDirection: "column", 
                gap: "1rem",
                boxShadow: `0 12px 30px ${glowBg}`
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", width: "100%" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {showcaseTrack.image && (
                    <img
                      src={showcaseTrack.image}
                      alt=""
                      style={{ width: "70px", height: "70px", borderRadius: "10px", objectFit: "cover", boxShadow: `0 8px 20px rgba(0,0,0,0.6)`, border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  )}
                  <span style={{ position: "absolute", bottom: "-4px", right: "-4px", background: glowColor, borderRadius: "50%", padding: "3px", fontSize: "0.7rem", display: "flex" }}>🔥</span>
                </div>
                
                <div style={{ minWidth: 0, flex: 1 }}>
                  {/* TÍTULO Y ECUALIZADOR ANIMADO */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, color: glowColor }}>
                      BANGER
                    </span>
                    
                    {/* Barras de Ecualizador (Framer Motion) */}
                    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "10px" }}>
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: ["30%", "100%", "40%", "80%", "30%"] }}
                          transition={{ repeat: Infinity, duration: 0.7 + (i * 0.15), ease: "linear" }}
                          style={{ width: "3px", backgroundColor: glowColor, borderRadius: "2px" }}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 0.15rem 0", wordBreak: "break-word", lineHeight: 1.2 }}>{showcaseTrack.name}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{showcaseTrack.artist}</p>
                </div>
              </div>

              {showcaseTrack.url && (
                <a
                  href={showcaseTrack.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    backgroundColor: glowColor,
                    color: "#000",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    padding: "0.6rem 1rem",
                    borderRadius: "999px",
                    width: "100%",
                    justifyContent: "center",
                    boxShadow: `0 6px 18px ${glowBg}`
                  }}
                >
                  Escuchar en Spotify
                </a>
              )}
            </motion.div>
          )}

          {/* PARRILLAS */}
          <div style={{ marginBottom: "3.5rem" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "1.25rem" }}>Top 5 Canciones</h3>
            {renderGrid(topTracks, "canciones", hoveredTrackIndex, setHoveredTrackIndex)}
          </div>

          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "1.25rem" }}>Top 5 Álbumes</h3>
            {renderGrid(topAlbums, "álbumes", hoveredAlbumIndex, setHoveredAlbumIndex)}
          </div>

        </div>
      </section>
    </motion.main>
  );
};