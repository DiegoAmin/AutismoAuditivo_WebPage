import React, { useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.25rem"
    }}>
      <section className="card" style={{
        width: "100%",
        maxWidth: "420px",
        textAlign: "center",
        padding: "2.75rem 2rem"
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem auto"
        }}>
          {/* Ícono vectorial de ondas de audio */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-main)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 10v3"/>
            <path d="M6 6v11"/>
            <path d="M10 3v18"/>
            <path d="M14 8v7"/>
            <path d="M18 5v13"/>
            <path d="M22 10v3"/>
          </svg>
        </div>

        <p style={{
          color: "var(--text-muted)",
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 700,
          marginBottom: "0.4rem"
        }}>
          Plataforma de Curaduría Musical
        </p>

        <h1 style={{
          fontSize: "1.85rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginBottom: "0.6rem"
        }}>
          Autismo Auditivo
        </h1>

        <p style={{
          color: "var(--text-muted)",
          fontSize: "0.92rem",
          lineHeight: 1.5,
          marginBottom: "2rem"
        }}>
          Accede para gestionar el catálogo de artistas, girar la ruleta semanal y registrar tu progreso.
        </p>

        <button
          onClick={handleGoogleSignIn}
          className="btn"
          style={{
            width: "100%",
            backgroundColor: "var(--text-main)",
            color: "#09090b",
            padding: "0.85rem 1.25rem",
            fontWeight: 700,
            fontSize: "0.95rem",
            borderRadius: "10px"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continuar con Google
        </button>
      </section>
    </main>
  );
};