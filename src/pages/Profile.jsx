import React, { useState, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../context/AuthContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { Reorder } from "framer-motion";

export const Profile = () => {
  const { user } = useAuth();

  const [username, setUsername] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // Showcase Track (Himno)
  const [showcaseTrack, setShowcaseTrack] = useState(null);
  const [showcaseQuery, setShowcaseQuery] = useState("");
  const [showcaseResults, setShowcaseResults] = useState([]);

  // Tops (Top 5)
  const [topTracks, setTopTracks] = useState([]);
  const [topAlbums, setTopAlbums] = useState([]);

  const [trackQuery, setTrackQuery] = useState("");
  const [trackResults, setTrackResults] = useState([]);

  const [albumQuery, setAlbumQuery] = useState("");
  const [albumResults, setAlbumResults] = useState([]);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUsername(data.username || user.displayName || "");
          setPhotoUrl(data.photoURL || user.photoURL || "");
          setShowcaseTrack(data.showcaseTrack || null);
          setTopTracks(data.topTracks || []);
          setTopAlbums(data.topAlbums || []);
        } else {
          setUsername(user.displayName || "");
          setPhotoUrl(user.photoURL || "");
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Buscador de Showcase Track
  useEffect(() => {
    if (!showcaseQuery.trim() || showcaseQuery.length < 2) { setShowcaseResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/spotify?searchTrack=${encodeURIComponent(showcaseQuery)}`);
        const data = await res.json();
        if (Array.isArray(data)) setShowcaseResults(data);
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(timer);
  }, [showcaseQuery]);

  // Buscador de Tops
  useEffect(() => {
    if (!trackQuery.trim() || trackQuery.length < 2) { setTrackResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/spotify?searchTrack=${encodeURIComponent(trackQuery)}`);
        const data = await res.json();
        if (Array.isArray(data)) setTrackResults(data);
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(timer);
  }, [trackQuery]);

  useEffect(() => {
    if (!albumQuery.trim() || albumQuery.length < 2) { setAlbumResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/spotify?searchAlbum=${encodeURIComponent(albumQuery)}`);
        const data = await res.json();
        if (Array.isArray(data)) setAlbumResults(data);
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(timer);
  }, [albumQuery]);

  const handleAddTrack = (track) => {
    if (topTracks.length >= 5) return alert("Solo puedes tener 5 rolas en tu Top.");
    if (topTracks.some(t => t.name === track.name && t.artist === track.artist)) return;
    setTopTracks([...topTracks, track]);
    setTrackQuery("");
    setTrackResults([]);
  };

  const handleAddAlbum = (album) => {
    if (topAlbums.length >= 5) return alert("Solo puedes tener 5 álbumes en tu Top.");
    if (topAlbums.some(a => a.name === album.name && a.artist === album.artist)) return;
    setTopAlbums([...topAlbums, album]);
    setAlbumQuery("");
    setAlbumResults([]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setMessage("");

    try {
      await updateProfile(user, {
        displayName: username.trim(),
        photoURL: photoUrl.trim()
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        username: username.trim(),
        photoURL: photoUrl.trim(),
        showcaseTrack: showcaseTrack,
        topTracks: topTracks,
        topAlbums: topAlbums,
        updatedAt: new Date()
      }, { merge: true });

      setMessage("¡Perfil guardado con éxito! 🔥");
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setMessage("Error al guardar.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(""), 3500);
    }
  };

  if (!user || isLoading) return <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Cargando perfil...</div>;

  return (
    <motion.main
      className="page-container"
      style={{ maxWidth: "760px", margin: "0 auto" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div style={{ marginBottom: "2rem", textAlign: "left" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Identidad</p>
        <h1 className="page-title" style={{ marginBottom: "0.25rem" }}>Tu Perfil</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Presume tus gustos y define tu himno sonoro.</p>
      </div>

      <section className="card" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2.5rem" }}>
          <div style={{ width: "105px", height: "105px", borderRadius: "50%", backgroundColor: "var(--bg-elevated)", border: "2px solid var(--accent-blue)", overflow: "hidden", marginBottom: "1rem", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${username || "User"}&background=1c1c21&color=fafafa`; }} />
            ) : (
              <span style={{ fontSize: "2.5rem" }}>👽</span>
            )}
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>{username || "Sin nombre"}</h2>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{user.email}</span>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600 }}>Nombre de Usuario</label>
              <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%" }} required />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600 }}>URL de Foto de Perfil</label>
              <input type="url" className="input-field" placeholder="https://..." value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} style={{ width: "100%" }} />
            </div>
          </div>

          {/* SHOWCASE TRACK (HIMNO) */}
          <div style={{ marginBottom: "2.5rem", padding: "1.5rem", backgroundColor: "var(--bg-main)", borderRadius: "16px", border: "1px solid var(--accent-amber)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "var(--accent-amber)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  BANGER
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "0.25rem 0 0 0" }}>La canción que encabezará tu perfil público.</p>
              </div>
            </div>

            {showcaseTrack ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-card)", border: "1px solid var(--border)", padding: "0.75rem 1rem", borderRadius: "12px", marginTop: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  {showcaseTrack.image && <img src={showcaseTrack.image} alt="" style={{ width: "45px", height: "45px", borderRadius: "8px", objectFit: "cover" }} />}
                  <div>
                    <strong style={{ fontSize: "0.95rem", display: "block" }}>{showcaseTrack.name}</strong>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{showcaseTrack.artist}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setShowcaseTrack(null)} style={{ background: "none", border: "none", color: "var(--accent-red)", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>Quitar</button>
              </div>
            ) : (
              <div style={{ position: "relative", marginTop: "1rem" }}>
                <input type="text" className="input-field" placeholder="Busca tu himno en Spotify..." value={showcaseQuery} onChange={(e) => setShowcaseQuery(e.target.value)} style={{ width: "100%" }} />
                <AnimatePresence>
                  {showcaseResults.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", zIndex: 30, marginTop: "4px", maxHeight: "200px", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.6)" }}>
                      {showcaseResults.map((t, idx) => (
                        <div key={idx} onClick={() => { setShowcaseTrack(t); setShowcaseQuery(""); setShowcaseResults([]); }} style={{ padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", borderBottom: "1px solid var(--border)" }} onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-elevated)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                          {t.image && <img src={t.image} alt="" style={{ width: "32px", height: "32px", borderRadius: "4px", objectFit: "cover" }} />}
                          <div style={{ fontSize: "0.85rem" }}><strong>{t.name}</strong> <span style={{ color: "var(--text-muted)" }}>({t.artist})</span></div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* TOP 5 CANCIONES CON DRAG & DROP */}
          <div style={{ marginTop: "1rem" }}>
            <Reorder.Group
              axis="y"
              values={topSongs}
              onReorder={setTopSongs}
              style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}
            >
              {topSongs.map((song, index) => (
                <Reorder.Item
                  key={song.id || `${song.name}-${index}`}
                  value={song}
                  whileDrag={{ scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.5)", zIndex: 10 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "0.6rem 0.85rem",
                    cursor: "grab",
                    userSelect: "none",
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                    <span style={{ color: "var(--accent-amber)", fontWeight: 800, fontSize: "0.85rem", width: "18px", textAlign: "center" }}>
                      {index + 1}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", opacity: 0.6, cursor: "grab" }}>
                      ⋮⋮
                    </span>
                    {song.image && (
                      <img
                        src={song.image}
                        alt=""
                        style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
                      />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {song.name}
                      </p>
                      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTopSongs(topSongs.filter((_, i) => i !== index))}
                    style={{ background: "none", border: "none", color: "var(--accent-red)", cursor: "pointer", fontSize: "1.1rem", padding: "0.2rem 0.4rem" }}
                  >
                    ✕
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

          {/* TOP 5 ÁLBUMES CON DRAG & DROP */}
          <div style={{ marginTop: "1rem" }}>
            <Reorder.Group
              axis="y"
              values={topAlbums}
              onReorder={setTopAlbums}
              style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}
            >
              {topAlbums.map((album, index) => (
                <Reorder.Item
                  key={album.id || `${album.name}-${index}`}
                  value={album}
                  whileDrag={{ scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.5)", zIndex: 10 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "0.6rem 0.85rem",
                    cursor: "grab",
                    userSelect: "none",
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                    <span style={{ color: "var(--accent-amber)", fontWeight: 800, fontSize: "0.85rem", width: "18px", textAlign: "center" }}>
                      {index + 1}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", opacity: 0.6, cursor: "grab" }}>
                      ⋮⋮
                    </span>
                    {album.image && (
                      <img
                        src={album.image}
                        alt=""
                        style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
                      />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {album.name}
                      </p>
                      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {album.artist}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTopAlbums(topAlbums.filter((_, i) => i !== index))}
                    style={{ background: "none", border: "none", color: "var(--accent-red)", cursor: "pointer", fontSize: "1.1rem", padding: "0.2rem 0.4rem" }}
                  >
                    ✕
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isSaving} className="btn" style={{ width: "100%", backgroundColor: "var(--accent-green)", color: "#000", fontWeight: 800, padding: "1rem", borderRadius: "999px" }}>
            {isSaving ? "Guardando en la nube..." : "Guardar Perfil"}
          </motion.button>

          {message && <p style={{ textAlign: "center", marginTop: "1rem", color: "var(--accent-green)", fontWeight: 700 }}>{message}</p>}
        </form>
      </section>
    </motion.main>
  );
};