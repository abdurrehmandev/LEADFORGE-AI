import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  FirebaseUser,
} from '../services/firebase';
import { useNotification } from './NotificationContext';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useNotification();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast({
        type: 'success',
        title: 'Authentication Successful',
        message: 'Signed in securely with Google.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Authentication Error',
        message: err.message || 'Failed to sign in with Google.',
      });
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      showToast({
        type: 'success',
        title: 'Welcome Back',
        message: 'Signed in successfully.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Sign In Failed',
        message: err.message || 'Invalid email or password.',
      });
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      showToast({
        type: 'success',
        title: 'Account Created',
        message: 'Your authenticated organization workspace is ready.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Sign Up Failed',
        message: err.message || 'Failed to register account.',
      });
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      showToast({
        type: 'info',
        title: 'Signed Out',
        message: 'You have been logged out of LeadForge.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Logout Failed',
        message: err.message,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
