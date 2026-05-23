import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const isFirebaseActive = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "");

let app;
let db: any = null;
let auth: any = null;

if (isFirebaseActive) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    console.log("Firebase initialized successfully with project ID:", firebaseConfig.projectId);
  } catch (error) {
    console.error("Firebase failed to initialize:", error);
  }
} else {
  console.log("No valid Firebase credentials found in firebase-applet-config.json. Running with local high-performance store sync!");
}

export { db, auth, isFirebaseActive };
