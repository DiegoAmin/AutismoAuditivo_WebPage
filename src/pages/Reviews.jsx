import React, { useState, useEffect } from "react";
import { doc, onSnapshot, collection, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../context/AuthContext.jsx";

const StarIcon = ({ filled, size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubArtist = onSnapshot(doc(db, "globals", "general"), (docSnap) => {
      if (docSnap.exists()) setCurrentArtist(docSnap.data());
    });

    const unsubReviews = onSnapshot(collection(db, "reviews"), (snapshot) => {
      const allReviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setReviews(allReviews);
    });

    return () => {
      unsubArtist();
      unsubReviews();
    };
  }, [user]);

  const artistReviews = reviews
    .filter(r => r.artistName === currentArtist?.name)
    .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));

  // Si el usuario ya había opinado sobre este artista, precargamos sus datos para que pueda editarlos
  useEffect(() => {
    if (!user || !currentArtist?.name) return;
    const myReview = artistReviews.find(r => r.userId === user.uid);
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment);
    } else {
      setRating(0);
      setComment("");
    }
  }, [currentArtist?.name, user, reviews.length]);

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
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error al guardar la reseña:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    const confirmacion = window.confirm("¿Seguro que deseas eliminar esta reseña?");
    if (!confirmacion) return;
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
    } catch (error) {
      console.error("Error al eliminar reseña:", error);
    }
  };

  const isArtistValid = currentArtist && currentArtist.name;

  const averageRating = artistReviews.length > 0
    ? (artistReviews.reduce((acc, r) => acc + r.rating, 0) / artistReviews.length).toFixed(1)
    : null;

  return (
    <main className="page-container">
      {/* Encabezado y Promedio General */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem" }}>
        <div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Foro de discusión
          </p>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            {isArtistValid ? `Opiniones: ${currentArtist.name}` : "Opiniones de la Semana"}
          </h1>
        </div>

        {averageRating && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            padding: "0.5rem 1rem",
            borderRadius: "12px"
          }}>
            <span style={{ color: "var(--accent-amber)", display: "flex" }}>
              <StarIcon filled={true} size={20} />
            </span>
            <span style={{ fontSize: "1.25rem", fontWeight: 800 }}>{averageRating}</span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              ({artistReviews.length} {artistReviews.length === 1 ? "voto" : "votos"})
            </span>
          </div>
        )}
      </div>

      {!isArtistValid ? (
        <div className="card" style={{ textAlign: "center", padding: "3.5rem 1.5rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>
            Aún no hay un artista activo para reseñar esta semana.
          </p>
        </div>
      ) : (
        <>
          {/* Formulario para calificar y comentar */}
          <section className="card" style={{ marginBottom: "2rem" }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Tu evaluación</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    Selecciona una calificación de 1 a 5 estrellas
                  </p>
                </div>

                <div className="star-rating" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${isFilled ? "active" : ""}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        aria-label={`Calificar con ${star} estrellas`}
                      >
                        <StarIcon filled={isFilled} size={26} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <textarea
                className="textarea-field"
                placeholder={`Escribe tu reseña, discos favoritos o conclusión sobre ${currentArtist.name}...`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="btn"
                  style={{
                    backgroundColor: "var(--text-main)",
                    color: "#09090b",
                    fontWeight: 700,
                    padding: "0.75rem 1.5rem"
                  }}
                >
                  {isSubmitting ? "Guardando..." : "Publicar reseña"}
                </button>
              </div>
            </form>
          </section>

          {/* Feed de reseñas del grupo */}
          <section>
            <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Reseñas de la comunidad ({artistReviews.length})
            </h4>

            {artistReviews.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Nadie ha publicado una reseña para {currentArtist.name} todavía. ¡Sé el primero!
              </div>
            ) : (
              <div className="reviews-list">
                {artistReviews.map((rev) => {
                  const canDelete = isAdmin || rev.userId === user?.uid;
                  return (
                    <article key={rev.id} className="review-card">
                      <div className="review-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{rev.userName}</span>
                          <div style={{ display: "inline-flex", gap: "0.15rem", color: "var(--accent-amber)" }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <StarIcon key={s} filled={s <= rev.rating} size={15} />
                            ))}
                          </div>
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(rev.id)}
                            className="delete-btn"
                            title="Eliminar reseña"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {rev.comment ? (
                        <p style={{ color: "var(--text-main)", fontSize: "0.92rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {rev.comment}
                        </p>
                      ) : (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                          Calificó sin dejar comentario escrito.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
};