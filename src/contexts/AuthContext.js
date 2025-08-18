import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  // Register new user
  async function signup(mobileNumber, password, designation) {
    try {
      console.log('Starting user registration process...');
      
      // Check if user already exists
      console.log('Checking if user already exists...');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('mobileNumber', '==', mobileNumber));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('An account with this mobile number already exists');
      }

      // Create new user document
      const newUser = {
        mobileNumber,
        password, // In production, this should be hashed
        designation,
        createdAt: new Date().toISOString(),
        uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      console.log('Creating new user document:', { uid: newUser.uid, mobileNumber, designation });

      // Save user to Firestore
      await setDoc(doc(db, 'users', newUser.uid), newUser);
      console.log('User document created successfully');
      
      // Set current user (without password)
      const userData = {
        uid: newUser.uid,
        mobileNumber: newUser.mobileNumber,
        designation: newUser.designation,
        createdAt: newUser.createdAt
      };
      
      setCurrentUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      console.error('Error in signup function:', error);
      
      // Provide more specific error messages
      if (error.code === 'permission-denied') {
        throw new Error('Database access denied. Please check Firestore security rules.');
      } else if (error.code === 'unavailable') {
        throw new Error('Database is currently unavailable. Please try again later.');
      } else if (error.code === 'unauthenticated') {
        throw new Error('Authentication required. Please check your Firebase configuration.');
      } else {
        throw error;
      }
    }
  }

  // Login user
  async function login(mobileNumber, password) {
    try {
      console.log('Starting user login process...');
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('mobileNumber', '==', mobileNumber));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('No account found with this mobile number');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.password !== password) {
        throw new Error('Invalid password');
      }

      console.log('User login successful:', { mobileNumber, designation: userData.designation });

      // Set current user (without password)
      const currentUserData = {
        uid: userData.uid,
        mobileNumber: userData.mobileNumber,
        designation: userData.designation,
        createdAt: userData.createdAt
      };
      
      setCurrentUser(currentUserData);
      localStorage.setItem('currentUser', JSON.stringify(currentUserData));
      
      return currentUserData;
    } catch (error) {
      console.error('Error in login function:', error);
      throw error;
    }
  }

  // Logout user
  function logout() {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }

  // Get user data from Firestore
  async function getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  const value = {
    currentUser,
    signup,
    login,
    logout,
    getUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
