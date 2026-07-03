import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDf8oHIE6FncDNYCSgCNS2lRorYYsgmkyc",
  authDomain: "localplates-foods.firebaseapp.com",
  databaseURL: "https://localplates-foods-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "localplates-foods",
  storageBucket: "localplates-foods.firebasestorage.app",
  messagingSenderId: "292956963287",
  appId: "1:292956963287:web:02ba20df36733085304b92",
  measurementId: "G-8PVP4Z3TRR"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;