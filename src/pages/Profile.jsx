import React, { useState, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../context/AuthContext.jsx";

export const Profile = () => {
  const { user } = useAuth();
  
  // Estados de datos básicos
  const [username, setUsername] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  
  // Estados para los Tops (máximo 5)
  const [topTracks, setTopTracks] = useState([]);
  const [topAlbums, setTopAlbums] = useState([]);

  // Estados para el buscador de Canciones
  const [trackQuery, setTrackQuery] = useState("");
  const [trackResults, setTrackResults] = useState([]);

  // Estados para el buscador de Álbumes
  const [albumQuery, setAlbumQuery] = useState("");
  const [albumResults, setAlbumResults] = useState([]);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 1. Cargar datos desde Firestore al entrar
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

  // 2. Buscador en vivo de Canciones
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

  // 3. Buscador en vivo de Álbumes
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

  // --- Funciones para manejar los Tops ---
  const handleAddTrack = (track) => {
    if (topTracks.length >= 5) return alert("¡Límite alcanzado! Solo puedes tener 5 rolas en tu Top.");
    if (topTracks.some(t => t.name === track.name && t.artist === track.artist)) return;
    setTopTracks([...topTracks, track]);
    setTrackQuery("");
    setTrackResults([]);
  };

  const handleRemoveTrack = (index) => {
    setTopTracks(topTracks.filter((_, i) => i !== index));
  };

  const handleAddAlbum = (album) => {
    if (topAlbums.length >= 5) return alert("¡Límite alcanzado! Solo puedes tener 5 álbumes en tu Top.");
    if (topAlbums.some(a => a.name === album.name && a.artist === album.artist)) return;
    setTopAlbums([...topAlbums, album]);
    setAlbumQuery("");
    setAlbumResults([]);
  };

  const handleRemoveAlbum = (index) => {
    setTopAlbums(topAlbums.filter((_, i) => i !== index));
  };

  // --- Guardar todo en Firebase ---
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
        topTracks: topTracks,
        topAlbums: topAlbums,
        updatedAt: new Date()
      }, { merge: true });

      setMessage("¡Perfil y Tops guardados al puro centavo! 🔥");
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setMessage("Error al guardar. Checa la consola.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(""), 3500);
    }
  };

  if (!user || isLoading) return <div style={{ textAlign: "center", padding: "3rem" }}>Cargando perfil...</div>;

  return (
    <main className="page-container" style={{ maxWidth: "700px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.75rem", textAlign: "center" }}>
        <h1 className="page-title">Tu Perfil</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Personaliza tu identidad y presume tus gustos.
        </p>
      </div>

      <section className="card" style={{ padding: "2rem" }}>
        {/* CABECERA VISUAL */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
          <div style={{ width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "var(--bg-elevated)", border: "2px solid var(--accent-blue)", overflow: "hidden", marginBottom: "1rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${username || "User"}&background=1c1c21&color=fafafa`; }} />
            ) : (
              <span style={{ fontSize: "2.5rem" }}>👽</span>
            )}
          </div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{username || "Sin nombre"}</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{user.email}</span>
        </div>

        <form onSubmit={handleSave}>
          {/* DATOS BÁSICOS */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
              Nombre de Usuario
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej. ElGuti99"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%" }}
              required
            />
          </div>

          <div style={{ marginBottom: "2.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
              URL de tu Foto
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="Pega el link de una imagen..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          {/* TOP 5 CANCIONES */}
          <div style={{ marginBottom: "2.5rem", padding: "1.5rem", backgroundColor: "var(--bg-main)", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>🎵 Top Canciones</h3>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: topTracks.length === 5 ? "var(--accent-amber)" : "var(--text-muted)" }}>
                {topTracks.length} / 5
              </span>
            </div>
            
            {topTracks.length < 5 && (
              <div style={{ position: "relative", marginBottom: "1rem" }}>
                <input type="text" className="input-field" placeholder="Busca una canción..." value={trackQuery} onChange={(e) => setTrackQuery(e.target.value)} style={{ width: "100%" }} />
                {trackResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", zIndex: 10, marginTop: "4px", maxHeight: "200px", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.6)" }}>
                    {trackResults.map((t, idx) => (
                      <div key={idx} onClick={() => addTrack(t)} style={{ padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", borderBottom: "1px solid var(--border)" }} onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-elevated)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                        {t.image && <img src={t.image} alt="" style={{ width: "30px", height: "30px", borderRadius: "4px", objectFit: "cover" }} />}
                        <div style={{ fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <strong>{t.name}</strong> <span style={{ color: "var(--text-muted)" }}>({t.artist})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {topTracks.map((t, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-card)", border: "1px solid var(--border)", padding: "0.5rem 0.75rem", borderRadius: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-muted)", width: "15px" }}>{idx + 1}</span>
                    {t.image && <img src={t.image} alt="" style={{ width: "30px", height: "30px", borderRadius: "4px", objectFit: "cover" }} />}
                    <div>
                      <strong style={{ display: "block", marginBottom: "0.1rem" }}>{t.name}</strong>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{t.artist}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemoveTrack(idx)} style={{ background: "none", border: "none", color: "var(--accent-red)", cursor: "pointer", padding: "0.25rem" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))}
              {topTracks.length === 0 && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", margin: "1rem 0" }}>No has agregado rolas a tu Top.</p>}
            </div>
          </div>

          {/* TOP 5 ÁLBUMES */}
          <div style={{ marginBottom: "2.5rem", padding: "1.5rem", backgroundColor: "var(--bg-main)", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>💿 Top Álbumes</h3>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: topAlbums.length === 5 ? "var(--accent-amber)" : "var(--text-muted)" }}>
                {topAlbums.length} / 5
              </span>
            </div>
            
            {topAlbums.length < 5 && (
              <div style={{ position: "relative", marginBottom: "1rem" }}>
                <input type="text" className="input-field" placeholder="Busca un álbum..." value={albumQuery} onChange={(e) => setAlbumQuery(e.target.value)} style={{ width: "100%" }} />
                {albumResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", zIndex: 10, marginTop: "4px", maxHeight: "200px", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.6)" }}>
                    {albumResults.map((a, idx) => (
                      <div key={idx} onClick={() => handleAddAlbum(a)} style={{ padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", borderBottom: "1px solid var(--border)" }} onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-elevated)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                        {a.image && <img src={a.image} alt="" style={{ width: "30px", height: "30px", borderRadius: "4px", objectFit: "cover" }} />}
                        <div style={{ fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <strong>{a.name}</strong> <span style={{ color: "var(--text-muted)" }}>({a.artist})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {topAlbums.map((a, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-card)", border: "1px solid var(--border)", padding: "0.5rem 0.75rem", borderRadius: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-muted)", width: "15px" }}>{idx + 1}</span>
                    {a.image && <img src={a.image} alt="" style={{ width: "30px", height: "30px", borderRadius: "4px", objectFit: "cover" }} />}
                    <div>
                      <strong style={{ display: "block", marginBottom: "0.1rem" }}>{a.name}</strong>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{a.artist}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemoveAlbum(idx)} style={{ background: "none", border: "none", color: "var(--accent-red)", cursor: "pointer", padding: "0.25rem" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))}
              {topAlbums.length === 0 && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", margin: "1rem 0" }}>No has agregado álbumes a tu Top.</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="btn"
            style={{ width: "100%", backgroundColor: "var(--accent-green)", color: "#000", fontWeight: 700, padding: "0.85rem" }}
          >
            {isSaving ? "Guardando en la nube..." : "Guardar Perfil"}
          </button>

          {message && (
            <p style={{ textAlign: "center", marginTop: "1rem", color: message.includes("Error") ? "var(--accent-red)" : "var(--accent-green)", fontSize: "0.9rem", fontWeight: 600 }}>
              {message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
};