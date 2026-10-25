import React, { useState, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../context/AuthContext.jsx";

export const Profile = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Cargar datos actuales del usuario al entrar
  useEffect(() => {
    if (user) {
      setUsername(user.displayName || "");
      setPhotoUrl(user.photoURL || "");
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setMessage("");

    try {
      // 1. Actualizar el perfil nativo de Firebase Auth
      await updateProfile(user, {
        displayName: username.trim(),
        photoURL: photoUrl.trim()
      });

      // 2. Guardar un respaldo en la base de datos Firestore (colección 'users')
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        username: username.trim(),
        photoURL: photoUrl.trim(),
        updatedAt: new Date()
      }, { merge: true });

      setMessage("¡Perfil actualizado al puro centavo! 🔥");
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setMessage("Error al guardar. Checa la consola.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(""), 3500);
    }
  };

  if (!user) return null;

  return (
    <main className="page-container" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 className="page-title">Tu Perfil</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Personaliza cómo te ven los demás en el grupo.
        </p>
      </div>

      <section className="card" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
          {/* Vista previa del Avatar */}
          <div style={{ width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "var(--bg-elevated)", border: "2px solid var(--accent-blue)", overflow: "hidden", marginBottom: "1rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => e.target.style.display = 'none'} />
            ) : (
              <span style={{ fontSize: "2.5rem" }}>👽</span>
            )}
          </div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{username || "Sin nombre"}</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{user.email}</span>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
              Nombre de Usuario (Username)
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

          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
              URL de tu Foto de Perfil
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="Pega el link directo a una imagen (jpg, png...)"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              style={{ width: "100%" }}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
              * Puedes buscar cualquier imagen en Google, darle clic derecho "Copiar dirección de la imagen" y pegarla aquí.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="btn"
            style={{ width: "100%", backgroundColor: "var(--accent-blue)", color: "#fff", fontWeight: 700, padding: "0.85rem" }}
          >
            {isSaving ? "Guardando..." : "Guardar Perfil"}
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