import React, { useEffect } from 'react';
import {doc, onSnapshot, getDoc} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { useAuth } from '../context/AuthContext.jsx';

export const Dashboard = () => {
    
    const { user } = useAuth();
    const [currentArtist, setCurrentArtist] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
   
    const unsubscribe = onSnapshot(doc(db, "globals", "general"), async (globalDoc) => {
      
      if (globalDoc.exists()) {
        const data = globalDoc.data();
        const artistId = data.currentArtistId;

        
        if (artistId) {
          const artistDoc = await getDoc(doc(db, "artists", artistId));
          if (artistDoc.exists()) {
            setCurrentArtist({ id: artistDoc.id, ...artistDoc.data() });
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{textAlign: "center", marginTop: "50px"}}>Cargando la música... 🎵</div>;

  return (
    <div style={{ padding: "20px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Bienvenido, {user?.displayName || "Melómano"}</h2>
      
      <h1 style={{ marginTop: "40px" }}>Artist of the Week 🏆</h1>
      
      {currentArtist ? (
        <div style={{ 
            border: "2px solid #444", 
            padding: "30px", 
            marginTop: "20px", 
            borderRadius: "15px",
            backgroundColor: "#222" 
        }}>
          {/* Categoría */}
          <span style={{ 
              background: "#ffcc00", 
              color: "black", 
              padding: "5px 15px", 
              borderRadius: "20px", 
              fontWeight: "bold",
              fontSize: "0.8rem"
          }}>
            {currentArtist.category.toUpperCase()}
          </span>

          {/* Nombre del Artista */}
          <h2 style={{ fontSize: "3.5rem", margin: "20px 0" }}>
            {currentArtist.name}
          </h2>
          
          {/* Botón de Spotify */}
          <div style={{ marginTop: "30px" }}>
            <a href={currentArtist.spotifyUrl} target="_blank" rel="noreferrer" 
               style={{ 
                   background: "#1DB954", 
                   color: "white", 
                   padding: "12px 25px", 
                   textDecoration: "none", 
                   borderRadius: "30px",
                   fontWeight: "bold",
                   fontSize: "1.1rem"
               }}>
              Listen on Spotify 🎧
            </a>
          </div>
        </div>
      ) : (
        <p>No hay artista seleccionado. ¡Gira la ruleta!</p>
      )}
    </div>
  );
};