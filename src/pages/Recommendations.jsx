import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../context/AuthContext.jsx";
import EmojiPicker from "emoji-picker-react";

const VIBE_TAGS = [
  { id: "obra_maestra", label: "🤯 Obra maestra", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
  { id: "deep_vibes", label: "🚬 Deep vibes", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" },
  { id: "energia", label: "⚡ Energía pura", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
  { id: "chill", label: "🌊 Chill / Flotar", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
  { id: "joya_oculta", label: "💎 Joya oculta", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
  { id: "en_loop", label: "🔁 En loop", color: "#ec4899", bg: "rgba(236, 72, 153, 0.15)" }
];

export const Recommendations = () => {
  const { user, isAdmin } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [usersData, setUsersData] = useState({});

  // Estados del formulario
  const [recType, setRecType] = useState("album"); // 'album' | 'track'
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pitch, setPitch] = useState("");
  const [selectedTag, setSelectedTag] = useState(VIBE_TAGS[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de UI y Filtros
  const [activeFilter, setActiveFilter] = useState("all");
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [emojiPickerRecId, setEmojiPickerRecId] = useState(null);

  useEffect(() => {
    if (!user) return;

    const unsubRecs = onSnapshot(collection(db, "recommendations"), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRecommendations(data);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const map = {};
      snapshot.forEach(d => { map[d.id] = d.data(); });
      setUsersData(map);
    });

    return () => { unsubRecs(); unsubUsers(); };
  }, [user]);

  // Buscador de Spotify (Álbum o Canción)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const param = recType === "album" ? "searchAlbum" : "searchTrack";
        const res = await fetch(`/api/spotify?${param}=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (Array.isArray(data)) setSearchResults(data);
      } catch (err) {
        console.error("Error buscando en Spotify:", err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, recType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !selectedItem || !pitch.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "recommendations"), {
        type: recType,
        itemName: selectedItem.name,
        artistName: selectedItem.artist,
        imageUrl: selectedItem.image || "",
        spotifyUrl: selectedItem.url || "",
        pitch: pitch.trim().slice(0, 220),
        tag: selectedTag,
        userId: user.uid,
        userName: user.displayName || "Usuario",
        reactions: {},
        createdAt: new Date()
      });

      setSelectedItem(null);
      setSearchQuery("");
      setPitch("");
    } catch (error) {
      console.error("Error al publicar recomendación:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Quitar esta joyita del muro?")) return;
    try {
      await deleteDoc(doc(db, "recommendations", id));
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const handleReaction = async (recId, emojiObject, currentReactions = {}) => {
    if (!user) return;
    const emoji = emojiObject.emoji;
    const recRef = doc(db, "recommendations", recId);
    let updated = { ...currentReactions };
    const userList = updated[emoji] || [];

    if (userList.includes(user.uid)) {
      updated[emoji] = userList.filter(uid => uid !== user.uid);
      if (updated[emoji].length === 0) delete updated[emoji];
    } else {
      updated[emoji] = [...userList, user.uid];
    }

    try {
      await updateDoc(recRef, { reactions: updated });
      setEmojiPickerRecId(null);
    } catch (error) {
      console.error("Error en reacción:", error);
    }
  };

  const filteredRecs = activeFilter === "all"
    ? recommendations
    : recommendations.filter(r => r.tag === activeFilter);

  return (
    <main className="page-container" style={{ maxWidth: "1050px" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
          Comunidad Libre
        </p>
        <h1 className="page-title" style={{ marginBottom: "0.25rem" }}>Muro de Joyitas</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Recomienda un álbum o una rola que traigas clavada en la cabeza.
        </p>
      </div>

      {/* FORMULARIO PARA SOLTAR UNA RECOMENDACIÓN */}
      <section className="card" style={{ marginBottom: "2.25rem" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <button
              type="button"
              onClick={() => { setRecType("album"); setSelectedItem(null); setSearchQuery(""); }}
              className="btn"
              style={{
                flex: 1,
                justifyContent: "center",
                backgroundColor: recType === "album" ? "var(--text-main)" : "var(--bg-main)",
                color: recType === "album" ? "#09090b" : "var(--text-muted)",
                border: "1px solid var(--border)",
                fontWeight: 700
              }}
            >
              💿 Recomendar Álbum
            </button>
            <button
              type="button"
              onClick={() => { setRecType("track"); setSelectedItem(null); setSearchQuery(""); }}
              className="btn"
              style={{
                flex: 1,
                justifyContent: "center",
                backgroundColor: recType === "track" ? "var(--text-main)" : "var(--bg-main)",
                color: recType === "track" ? "#09090b" : "var(--text-muted)",
                border: "1px solid var(--border)",
                fontWeight: 700
              }}
            >
              🎵 Recomendar Canción
            </button>
          </div>

          {/* Buscador o Item Seleccionado */}
          <div style={{ marginBottom: "1.25rem" }}>
            {selectedItem ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-main)", border: "1px solid var(--accent-green)", padding: "0.75rem 1rem", borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  {selectedItem.image && (
                    <img src={selectedItem.image} alt="" style={{ width: "48px", height: "48px", borderRadius: "6px", objectFit: "cover" }} />
                  )}
                  <div>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--accent-green)", fontWeight: 700, display: "block" }}>
                      {recType === "album" ? "💿 Álbum" : "🎵 Canción"}
                    </span>
                    <strong style={{ fontSize: "0.95rem" }}>{selectedItem.name}</strong>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "block" }}>{selectedItem.artist}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedItem(null)} style={{ background: "none", border: "none", color: "var(--accent-red)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                  Cambiar
                </button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={recType === "album" ? "Busca el álbum en Spotify (ej. Alive 2007)..." : "Busca la canción en Spotify..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%" }}
                />
                {searchResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", zIndex: 30, marginTop: "4px", maxHeight: "220px", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.6)" }}>
                    {searchResults.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => { setSelectedItem(item); setSearchQuery(""); setSearchResults([]); }}
                        style={{ padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                        onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
                        onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        {item.image && <img src={item.image} alt="" style={{ width: "36px", height: "36px", borderRadius: "4px", objectFit: "cover" }} />}
                        <div style={{ fontSize: "0.85rem" }}>
                          <strong>{item.name}</strong> <span style={{ color: "var(--text-muted)" }}>— {item.artist}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pitch de recomendación */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>¿Por qué la raza tiene que escuchar esto?</label>
              <span style={{ fontSize: "0.75rem", color: pitch.length > 200 ? "var(--accent-red)" : "var(--text-muted)" }}>{pitch.length}/220</span>
            </div>
            <textarea
              className="textarea-field"
              placeholder="Ej. Transición brutal en el minuto 2:10, ideal para programar de madrugada..."
              value={pitch}
              maxLength={220}
              onChange={(e) => setPitch(e.target.value)}
              style={{ minHeight: "75px" }}
              required
            />
          </div>

          {/* Selector de Vibra (Tag) */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Etiqueta de vibra</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {VIBE_TAGS.map(t => {
                const isSelected = selectedTag === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTag(t.id)}
                    style={{
                      background: isSelected ? t.bg : "var(--bg-main)",
                      border: `1px solid ${isSelected ? t.color : "var(--border)"}`,
                      color: isSelected ? t.color : "var(--text-muted)",
                      padding: "0.4rem 0.85rem",
                      borderRadius: "999px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={isSubmitting || !selectedItem || !pitch.trim()}
              className="btn"
              style={{ backgroundColor: "var(--accent-green)", color: "#000", fontWeight: 700, padding: "0.75rem 1.5rem" }}
            >
              {isSubmitting ? "Subiendo al muro..." : "Colgar en el Muro"}
            </button>
          </div>
        </form>
      </section>

      {/* FILTROS DEL MURO */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          style={{
            background: activeFilter === "all" ? "var(--text-main)" : "var(--bg-card)",
            color: activeFilter === "all" ? "#09090b" : "var(--text-muted)",
            border: "1px solid var(--border)",
            padding: "0.35rem 0.9rem",
            borderRadius: "999px",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Todas ({recommendations.length})
        </button>
        {VIBE_TAGS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveFilter(t.id)}
            style={{
              background: activeFilter === t.id ? t.bg : "var(--bg-card)",
              color: activeFilter === t.id ? t.color : "var(--text-muted)",
              border: `1px solid ${activeFilter === t.id ? t.color : "var(--border)"}`,
              padding: "0.35rem 0.85rem",
              borderRadius: "999px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* PARRILLA DE VINILOS (GRID) */}
      {filteredRecs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3.5rem" }}>
          <p style={{ color: "var(--text-muted)" }}>Aún no hay recomendaciones en esta categoría. ¡Sé el primero en soltar una joyita!</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1.35rem"
        }}>
          {filteredRecs.map(rec => {
            const tagObj = VIBE_TAGS.find(t => t.id === rec.tag) || VIBE_TAGS[0];
            const authorProfile = usersData[rec.userId];
            const authorName = authorProfile?.username || rec.userName;
            const authorPhoto = authorProfile?.photoURL || null;
            const isHovered = hoveredCardId === rec.id;
            const reactions = rec.reactions || {};
            const isPickingEmoji = emojiPickerRecId === rec.id;

            return (
              <article
                key={rec.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  overflow: "visible",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  transform: isHovered ? "translateY(-4px)" : "none",
                  boxShadow: isHovered ? "0 12px 28px rgba(0,0,0,0.6)" : "none"
                }}
                onMouseEnter={() => setHoveredCardId(rec.id)}
                onMouseLeave={() => setHoveredCardId(null)}
              >
                {/* Contenedor Cuadrado de Portada (Estilo Vinilo) */}
                <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", overflow: "hidden", borderTopLeftRadius: "13px", borderTopRightRadius: "13px", backgroundColor: "#111" }}>
                  {rec.imageUrl ? (
                    <img
                      src={rec.imageUrl}
                      alt={rec.itemName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.35s ease",
                        transform: isHovered ? "scale(1.06)" : "scale(1)"
                      }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>💿</div>
                  )}

                  {/* Badge superior: Álbum vs Canción */}
                  <span style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    background: "rgba(9, 9, 11, 0.85)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "999px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#fff",
                    zIndex: 2
                  }}>
                    {rec.type === "album" ? "💿 Álbum" : "🎵 Track"}
                  </span>

                  {/* Badge superior derecho: Vibra */}
                  <span style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "rgba(9, 9, 11, 0.85)",
                    backdropFilter: "blur(6px)",
                    border: `1px solid ${tagObj.color}`,
                    color: tagObj.color,
                    padding: "0.25rem 0.6rem",
                    borderRadius: "999px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    zIndex: 2
                  }}>
                    {tagObj.label}
                  </span>

                  {/* CRISTAL DE HOVER: Pitch y botón de Spotify */}
                  <div
                    onClick={() => setHoveredCardId(isHovered ? null : rec.id)}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(9, 9, 11, 0.84)",
                      backdropFilter: "blur(6px)",
                      padding: "1.25rem",
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
                    <p style={{ fontSize: "0.88rem", lineHeight: 1.45, color: "#f4f4f5", marginBottom: "1rem", fontStyle: "italic" }}>
                      "{rec.pitch}"
                    </p>

                    {rec.spotifyUrl && (
                      <a
                        href={rec.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{
                          backgroundColor: "var(--accent-green)",
                          color: "#000",
                          padding: "0.5rem 1rem",
                          borderRadius: "999px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem"
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        Escuchar
                      </a>
                    )}
                  </div>
                </div>

                {/* Pie del Vinilo: Título, Quién recomienda y Reacciones */}
                <div style={{ padding: "0.85rem 1rem", display: "flex", flexDirection: "column", gap: "0.6rem", flex: 1, justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.15rem" }} title={rec.itemName}>
                      {rec.itemName}
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                      {rec.artistName}
                    </p>
                  </div>

                  {/* Autor + Borrar */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                      {authorPhoto ? (
                        <img src={authorPhoto} alt="" style={{ width: "22px", height: "22px", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem" }}>👽</div>
                      )}
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{authorName}</span>
                    </div>

                    {(isAdmin || rec.userId === user?.uid) && (
                      <button type="button" onClick={() => handleDelete(rec.id)} className="delete-btn" title="Eliminar">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </div>

                  {/* Barra de reacciones rápidas */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", alignItems: "center", position: "relative" }}>
                    {Object.entries(reactions).map(([emoji, usersArray]) => {
                      const hasReacted = usersArray.includes(user?.uid);
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleReaction(rec.id, { emoji }, reactions)}
                          style={{
                            background: hasReacted ? "var(--bg-elevated)" : "var(--bg-main)",
                            border: `1px solid ${hasReacted ? "var(--accent-blue)" : "var(--border)"}`,
                            borderRadius: "20px",
                            padding: "0.15rem 0.5rem",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            color: "var(--text-main)"
                          }}
                        >
                          <span>{emoji}</span>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{usersArray.length}</span>
                        </button>
                      );
                    })}

                    <div style={{ position: "relative", display: "inline-block" }}>
                      <button
                        type="button"
                        onClick={() => setEmojiPickerRecId(isPickingEmoji ? null : rec.id)}
                        style={{
                          background: "var(--bg-main)",
                          border: "1px dashed var(--border)",
                          borderRadius: "20px",
                          padding: "0.15rem 0.5rem",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          color: "var(--text-muted)"
                        }}
                      >
                        + 😊
                      </button>

                      {isPickingEmoji && (
                        <div style={{ position: "absolute", bottom: "130%", left: 0, zIndex: 60, boxShadow: "0 10px 25px rgba(0,0,0,0.7)" }}>
                          <EmojiPicker
                            theme="dark"
                            onEmojiClick={(emojiData) => handleReaction(rec.id, emojiData, reactions)}
                            width={280}
                            height={340}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};