import React, { useState, useEffect } from "react";
import { doc, onSnapshot, collection, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../context/AuthContext.jsx";

const StarIcon = ({ filled, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const Reviews = () => {
  const { user, isAdmin } = useAuth();
  const [currentArtist, setCurrentArtist] = useState(null);
  const [reviews, setReviews] = useState([]);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  
  // Estados para el buscador de canciones y álbumes
  const [favoriteTracks, setFavoriteTracks] = useState([]); // Máximo 3
  const [trackQuery, setTrackQuery] = useState("");
  const [trackResults, setTrackResults] = useState([]);

  const [favoriteAlbum, setFavoriteAlbum] = useState(null); // 1 álbum
  const [albumQuery, setAlbumQuery] = useState("");
  const [albumResults, setAlbumResults] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubArtist = onSnapshot(doc(db, "globals", "general"), (docSnap) => {
      if (docSnap.exists()) setCurrentArtist(docSnap.data());
    });
    const unsubReviews = onSnapshot(collection(db, "reviews"), (snapshot) => {
      setReviews(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubArtist(); unsubReviews(); };
  }, [user]);

  const artistReviews = reviews
    .filter(r => r.artistName === currentArtist?.name)
    .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));

  useEffect(() => {
    if (!user || !currentArtist?.name) return;
    const myReview = artistReviews.find(r => r.userId === user.uid);
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment || "");
      setFavoriteTracks(myReview.favoriteTracks || []);
      setFavoriteAlbum(myReview.favoriteAlbum || null);
    } else {
      setRating(0);
      setComment("");
      setFavoriteTracks([]);
      setFavoriteAlbum(null);
    }
  }, [currentArtist?.name, user, reviews.length]);

  // Buscar canciones en tiempo real en la API
  useEffect(() => {
    if (!trackQuery.trim() || trackQuery.length < 2) {
      setTrackResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/spotify?searchTrack=${encodeURIComponent(trackQuery)}`);
        const data = await res.json();
        if (Array.isArray(data)) setTrackResults(data);
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(timer);
  }, [trackQuery]);

  // Buscar álbumes en tiempo real en la API
  useEffect(() => {
    if (!albumQuery.trim() || albumQuery.length < 2) {
      setAlbumResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/spotify?searchAlbum=${encodeURIComponent(albumQuery)}`);
        const data = await res.json();
        if (Array.isArray(data)) setAlbumResults(data);
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(timer);
  }, [albumQuery]);

  const addTrack = (track) => {
    if (favoriteTracks.length >= 3) return alert("Solo puedes elegir 3 canciones top.");
    if (favoriteTracks.some(t => t.name === track.name)) return;
    setFavoriteTracks([...favoriteTracks, track]);
    setTrackQuery("");
    setTrackResults([]);
  };

  const removeTrack = (index) => {
    setFavoriteTracks(favoriteTracks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !currentArtist?.name || rating === 0) return;

    setIsSubmitting(true);
    try {
      const safeArtistKey = currentArtist.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const reviewId = `${safeArtistKey}_${user.uid}`;

      await setDoc(doc(db, "reviews", reviewId), {
        artistName: currentArtist.name,
        userId: user.uid,
        userName: user.displayName || "Usuario",
        rating: rating,
        comment: comment.trim(),
        favoriteTracks: favoriteTracks,
        favoriteAlbum: favoriteAlbum,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error al guardar reseña:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("¿Eliminar esta reseña?")) return;
    try { await deleteDoc(doc(db, "reviews", reviewId)); } catch (e) { console.error(e); }
  };

  const isArtistValid = currentArtist && currentArtist.name;
  const averageRating = artistReviews.length > 0
    ? (artistReviews.reduce((acc, r) => acc + r.rating, 0) / artistReviews.length).toFixed(1)
    : null;

  return (
    <main className="page-container" style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem" }}>
        <div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Foro de discusión</p>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{isArtistValid ? `Opiniones: ${currentArtist.name}` : "Opiniones"}</h1>
        </div>
        {averageRating && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", padding: "0.5rem 1rem", borderRadius: "12px" }}>
            <span style={{ color: "var(--accent-amber)" }}><StarIcon filled={true} size={20} /></span>
            <span style={{ fontSize: "1.25rem", fontWeight: 800 }}>{averageRating}</span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>({artistReviews.length})</span>
          </div>
        )}
      </div>

      {!isArtistValid ? (
        <div className="card" style={{ textAlign: "center", padding: "3.5rem" }}><p style={{ color: "var(--text-muted)" }}>Sin artista activo.</p></div>
      ) : (
        <>
          <section className="card" style={{ marginBottom: "2rem" }}>
            <form onSubmit={handleSubmit}>
              {/* Estrellas */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Tu calificación</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>De 1 a 5 estrellas</p>
                </div>
                <div className="star-rating" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" className={`star-btn ${star <= (hoverRating || rating) ? "active" : ""}`} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)}>
                      <StarIcon filled={star <= (hoverRating || rating)} size={26} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comentario */}
              <textarea className="textarea-field" placeholder={`Escribe tu reseña sobre ${currentArtist.name}...`} value={comment} onChange={(e) => setComment(e.target.value)} style={{ marginBottom: "1.25rem" }} />

              {/* Selector de Top 3 Canciones con Buscador */}
              <div style={{ marginBottom: "1.25rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.4rem" }}>Tus 3 canciones favoritas</h3>
                <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                  <input type="text" className="input-field" placeholder="Busca una canción en Spotify..." value={trackQuery} onChange={(e) => setTrackQuery(e.target.value)} style={{ width: "100%" }} />
                  {trackResults.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", zIndex: 10, marginTop: "4px", maxHeight: "200px", overflowY: "auto" }}>
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
                {/* Lista de elegidas */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {favoriteTracks.map((t, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-main)", border: "1px solid var(--border)", padding: "0.35rem 0.75rem", borderRadius: "8px", fontSize: "0.85rem" }}>
                      <span>{idx + 1}. {t.name}</span>
                      <button type="button" onClick={() => removeTrack(idx)} style={{ background: "none", border: "none", color: "var(--accent-red)", cursor: "pointer", fontWeight: "bold" }}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selector de Álbum Favorito */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.4rem" }}>Tu álbum favorito</h3>
                {favoriteAlbum ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-main)", border: "1px solid var(--border)", padding: "0.5rem 0.75rem", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem" }}>
                      {favoriteAlbum.image && <img src={favoriteAlbum.image} alt="" style={{ width: "35px", height: "35px", borderRadius: "4px", objectFit: "cover" }} />}
                      <strong>{favoriteAlbum.name}</strong>
                    </div>
                    <button type="button" onClick={() => setFavoriteAlbum(null)} style={{ background: "none", border: "none", color: "var(--accent-red)", cursor: "pointer", fontSize: "0.85rem" }}>Cambiar</button>
                  </div>
                ) : (
                  <div style={{ position: "relative" }}>
                    <input type="text" className="input-field" placeholder="Busca un álbum en Spotify..." value={albumQuery} onChange={(e) => setAlbumQuery(e.target.value)} style={{ width: "100%" }} />
                    {albumResults.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", zIndex: 10, marginTop: "4px", maxHeight: "200px", overflowY: "auto" }}>
                        {albumResults.map((a, idx) => (
                          <div key={idx} onClick={() => { setFavoriteAlbum(a); setAlbumQuery(""); setAlbumResults([]); }} style={{ padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", borderBottom: "1px solid var(--border)" }} onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-elevated)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                            {a.image && <img src={a.image} alt="" style={{ width: "30px", height: "30px", borderRadius: "4px", objectFit: "cover" }} />}
                            <div style={{ fontSize: "0.85rem" }}><strong>{a.name}</strong> <span style={{ color: "var(--text-muted)" }}>({a.artist})</span></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" disabled={isSubmitting || rating === 0} className="btn" style={{ backgroundColor: "var(--text-main)", color: "#09090b", fontWeight: 700, padding: "0.75rem 1.5rem" }}>
                  {isSubmitting ? "Guardando..." : "Publicar reseña y selecciones"}
                </button>
              </div>
            </form>
          </section>

          {/* Feed con las selecciones visibles */}
          <section>
            <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "1rem" }}>Reseñas del grupo ({artistReviews.length})</h4>
            <div className="reviews-list">
              {artistReviews.map((rev) => (
                <article key={rev.id} className="review-card">
                  <div className="review-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontWeight: 600 }}>{rev.userName}</span>
                      <div style={{ display: "inline-flex", gap: "0.15rem", color: "var(--accent-amber)" }}>
                        {[1, 2, 3, 4, 5].map((s) => <StarIcon key={s} filled={s <= rev.rating} size={15} />)}
                      </div>
                    </div>
                    {(isAdmin || rev.userId === user?.uid) && (
                      <button type="button" onClick={() => handleDelete(rev.id)} className="delete-btn" title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </div>

                  {rev.comment && <p style={{ fontSize: "0.92rem", marginBottom: "1rem", lineHeight: 1.5 }}>{rev.comment}</p>}

                  {/* Mostrar canciones y álbum elegidos */}
                  {/* Mostrar canciones y álbum elegidos con link e ícono de Spotify */}
                  {(rev.favoriteTracks?.length > 0 || rev.favoriteAlbum) && (
                    <div style={{ background: "var(--bg-main)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.85rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.85rem" }}>
                      <div>
                        <strong style={{ display: "block", color: "var(--text-muted)", marginBottom: "0.3rem", fontSize: "0.75rem", textTransform: "uppercase" }}>Top 3 Canciones</strong>
                        {rev.favoriteTracks?.length ? rev.favoriteTracks.map((t, i) => (
                          <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.2rem" }}>
                            {t.url ? (
                              <a 
                                href={t.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ color: "var(--text-main)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                                onMouseOver={(e) => e.currentTarget.style.color = "var(--accent-green)"}
                                onMouseOut={(e) => e.currentTarget.style.color = "var(--text-main)"}
                              >
                                <span>{i + 1}. {t.name}</span>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.8, flexShrink: 0 }}>
                                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                </svg>
                              </a>
                            ) : (
                              <span>{i + 1}. {t.name}</span>
                            )}
                          </div>
                        )) : <span style={{ color: "var(--text-muted)" }}>Ninguna</span>}
                      </div>
                      
                      <div>
                        <strong style={{ display: "block", color: "var(--text-muted)", marginBottom: "0.3rem", fontSize: "0.75rem", textTransform: "uppercase" }}>Álbum Favorito</strong>
                        {rev.favoriteAlbum ? (
                          rev.favoriteAlbum.url ? (
                            <a 
                              href={rev.favoriteAlbum.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ color: "var(--text-main)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}
                              onMouseOver={(e) => e.currentTarget.style.color = "var(--accent-green)"}
                              onMouseOut={(e) => e.currentTarget.style.color = "var(--text-main)"}
                            >
                              <span>{rev.favoriteAlbum.name}</span>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.8, flexShrink: 0 }}>
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                              </svg>
                            </a>
                          ) : (
                            <div>{rev.favoriteAlbum.name}</div>
                          )
                        ) : <span style={{ color: "var(--text-muted)" }}>Ninguno</span>}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
};