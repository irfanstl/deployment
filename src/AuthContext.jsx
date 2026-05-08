import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './services/api.js';
import { auth } from './firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      if (!import.meta.env.VITE_FIREBASE_API_KEY) {
        throw new Error("No Firebase API Key");
      }
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            api.setToken(token);
            // Get our DB user profile using the firebase token
            const profile = await api.getProfile();
            setUser(profile);
            localStorage.setItem('nexus_user', JSON.stringify(profile));
          } catch (err) {
            console.error("Failed to sync firebase user with backend", err);
            setUser(null);
            localStorage.removeItem('nexus_user');
          }
        } else {
          setUser(null);
          api.clearToken();
          localStorage.removeItem('nexus_user');
        }
        setLoading(false);
      });
    } catch (err) {
      console.warn("Firebase Auth bypassed due to missing config.");
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      api.setToken(token);
      // Wait for the sync in onAuthStateChanged or force it
      const profile = await api.getProfile();
      setUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ email, password, displayName }) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      api.setToken(token);
      
      // Register in backend MySQL DB
      const profile = await api.completeSignup({ email, displayName, uid: userCredential.user.uid });
      setUser(profile.user);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const token = await userCredential.user.getIdToken();
      api.setToken(token);
      
      const profile = await api.getProfile();
      setUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    api.clearToken();
    setUser(null);
    localStorage.removeItem('nexus_user');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
