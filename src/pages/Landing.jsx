import React, { use } from 'react';
import { signInWithPopup } from 'firebase/auth';
import {auth, googleProvider} from '../firebase/config.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useEffect } from 'react';



export const Landing = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleGoogleSignIn = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            
        } catch (error) {
            console.error("Error during Google sign-in:", error);
        } 

};

return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Welcome to Autismo Auditivo 🎵</h1>
      <p>Spin the wheel</p>
      
      <button 
        onClick={handleGoogleSignIn}
        style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
      >
        Login with Google
      </button>
    </div>
  );
};