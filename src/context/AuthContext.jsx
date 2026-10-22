import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/config.js";

const AuthContext = createContext();

// AQUÍ DEFINIMOS A LOS JEFES
const ADMIN_EMAILS = [
  "logrosluisma@gmail.com",
  "sancheziguti@gmail.com",
  "diegoaminhernandez@gmail.com"
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = () => signOut(auth);

  // Variable mágica que sabrá si el usuario activo es admin o plebeyo
  const isAdmin = user ? ADMIN_EMAILS.includes(user.email) : false;

  return (
    <AuthContext.Provider value={{ user, isAdmin, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);