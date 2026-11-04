import React, { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, collection } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FastAverageColor } from 'fast-average-color';

export const Dashboard = () => {
  const { user } = useAuth();
  const [currentArtist, setCurrentArtist] = useState(null);
  const [userProgress, setUserProgress] = useState("por_escuchar");
  const [groupProgress, setGroupProgress] = useState([]);
  const [usersData, setUsersData] = useState({});
  const [glowColor, setGlowColor] = useState('rgba(29, 185, 84, 0.12)'); // Verde sutil por defecto

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

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const map = {};
      snapshot.forEach(doc => { map[doc.id] = doc.data(); });
      setUsersData(map);
    });

    return () => { unsubArtist(); unsubProgress(); unsubUsers(); };
  }, [user, currentArtist?.name]);

  // Extracción del color dominante
  useEffect(() => {
    if (currentArtist && currentArtist.spotifyImage) {
      const fac = new FastAverageColor();
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = currentArtist.spotifyImage;
      
      img.onload = () => {
        try {
          const color = fac.getColor(img);
          // Modificamos directamente el fondo del body para que no haya cortes de caja
          document.body.style.backgroundImage = `radial-gradient(ellipse 90% 60% at 50% -10%, rgba(${color.value[0]}, ${color.value[1]}, ${color.value[2]}, 0.12), transparent)`;
          
          // Guardamos un color más fuerte solo para el resplandor detrás de la foto circular
          setGlowColor(`rgba(${color.value[0]}, ${color.value[1]}, ${color.value[2]}, 0.35)`);
          fac.destroy();
        } catch (e) {
          console.error("Error extrayendo color:", e);
        }
      };
    }

    // Limpiador: Cuando salgamos del Dashboard, regresamos el body a su estado neutral
    return () => {
      document.body.style.backgroundImage = "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(29, 185, 84, 0.08), transparent)";
    };
  }, [currentArtist?.spotifyImage]);

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
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const isArtistValid = currentArtist && currentArtist.name;

  const statusMeta = {
    por_escuchar: { label: "Pendiente", color: "var(--accent-red)", bg: "rgba(239, 68, 68, 0.12)" },
    escuchando: { label: "En progreso", color: "var(--accent-amber)", bg: "rgba(245, 158, 11, 0.12)" },
    terminado: { label: "Completado", color: "var(--accent-green)", bg: "rgba(29, 185, 84, 0.12)" }
  };

  // Variantes de animación para framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.main 
      className="page-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      // Eliminamos el backgroundImage del style local
    >
      <motion.div variants={itemVariants} initial="hidden" animate="show" style={{ marginBottom: "1.75rem", textAlign: "left" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
          Panel de seguimiento
        </p>
        <h1 className="page-title">Artista Seleccionado</h1>
      </motion.div>

      {!isArtistValid ? (
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="card" style={{ textAlign: "center", padding: "3.5rem 1.5rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>
            Aún no hay artista seleccionado. Dirígete a la Ruleta para iniciar la selección.
          </p>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          
          {/* TARJETA DEL ARTISTA */}
          <motion.section variants={itemVariants} className="card" style={{ textAlign: "center", position: "relative", overflow: "hidden" }}>
            
            {/* Efecto de resplandor intenso detrás de la foto */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '180px',
              height: '180px',
              background: glowColor,
              filter: 'blur(50px)',
              borderRadius: '50%',
              zIndex: 0,
              pointerEvents: 'none'
            }}/>

            <div style={{ marginBottom: "1.25rem", position: 'relative', zIndex: 1 }}>
              <span style={{
                display: "inline-block",
                background: currentArtist.category === "ogs" ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
                color: currentArtist.category === "ogs" ? "var(--accent-amber)" : "var(--accent-blue)",
                border: `1px solid ${currentArtist.category === "ogs" ? "rgba(245, 158, 11, 0.35)" : "rgba(59, 130, 246, 0.35)"}`,
                padding: "0.3rem 0.9rem",
                borderRadius: "999px",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "0.75rem",
                letterSpacing: "0.06em"
              }}>
                {currentArtist.category === "ogs" ? "Categoría OG's" : "Categoría Actuales"}
              </span>
            </div>

            {currentArtist.spotifyImage && (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                style={{ marginBottom: "1.25rem", position: 'relative', zIndex: 1, display: 'inline-block' }}
              >
                <img
                  src={currentArtist.spotifyImage}
                  alt={currentArtist.name}
                  style={{
                    width: "clamp(140px, 35vw, 190px)",
                    height: "clamp(140px, 35vw, 190px)",
                    objectFit: "cover",
                    borderRadius: "50%",
                    border: "2px solid var(--border)",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.6)"
                  }}
                />
              </motion.div>
            )}

            <h2 className="artist-hero-name" style={{ position: 'relative', zIndex: 1 }}>{currentArtist.name}</h2>

            <motion.a
              whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.95 }}
              href={currentArtist.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(currentArtist.name)}/artists`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                backgroundColor: "var(--accent-green)",
                color: "#000",
                padding: "0.85rem 1.75rem",
                borderRadius: "999px",
                fontWeight: 700,
                fontSize: "0.95rem",
                position: 'relative',
                zIndex: 1
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Abrir en Spotify
            </motion.a>
          </motion.section>

          {/* ESTADO PERSONAL Y DEL GRUPO */}
          <motion.section variants={itemVariants} className="card" style={{ marginTop: "1.5rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.25rem" }}>Estado personal</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Actualiza tu avance semanal con este artista</p>

            <div className="status-grid">
              {Object.entries(statusMeta).map(([key, meta]) => {
                const isSelected = userProgress === key;
                return (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={key}
                    onClick={() => handleUpdateProgress(key)}
                    className="btn"
                    style={{
                      backgroundColor: isSelected ? meta.bg : "var(--bg-main)",
                      borderColor: isSelected ? meta.color : "var(--border)",
                      color: isSelected ? meta.color : "var(--text-muted)",
                      justifyContent: "center",
                      transition: "background-color 0.2s, border-color 0.2s"
                    }}
                  >
                    <span className="dot" style={{ backgroundColor: meta.color }} />
                    {meta.label}
                  </motion.button>
                );
              })}
            </div>

            <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
              <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Actividad del grupo ({groupProgress.length})
              </h4>

              {groupProgress.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Sin registros para esta semana.</p>
              ) : (
                <motion.ul 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}
                >
                  <AnimatePresence>
                    {groupProgress.map(friend => {
                      const meta = statusMeta[friend.status] || statusMeta.por_escuchar;
                      const profile = usersData[friend.id]; 
                      const finalName = profile?.username || friend.displayName;
                      const finalPhoto = profile?.photoURL || null;

                      return (
                        <motion.li
                          key={friend.id}
                          variants={itemVariants}
                          layout
                          initial="hidden"
                          animate="show"
                          exit={{ opacity: 0, x: -20 }}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "var(--bg-main)",
                            border: "1px solid var(--border)",
                            padding: "0.75rem 1rem",
                            borderRadius: "10px",
                            gap: "0.5rem"
                          }}
                        >
                          <Link to={`/user/${friend.id}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "inherit" }}>
                            {finalPhoto ? (
                              <img src={finalPhoto} alt="" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${finalName}&background=1c1c21&color=fafafa`; }} />
                            ) : (
                              <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", border: "1px solid var(--border)" }}>👽</div>
                            )}
                            <span style={{ fontWeight: 500, fontSize: "0.92rem", transition: "color 0.2s" }} onMouseOver={(e) => e.target.style.color = "var(--accent-blue)"} onMouseOut={(e) => e.target.style.color = "var(--text-main)"}>
                              {finalName}
                            </span>
                          </Link>
                          
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            fontSize: "0.78rem",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "999px",
                            fontWeight: 600,
                            backgroundColor: meta.bg,
                            color: meta.color
                          }}>
                            <span className="dot" style={{ backgroundColor: meta.color }} />
                            {meta.label}
                          </span>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </motion.main>
  );
};