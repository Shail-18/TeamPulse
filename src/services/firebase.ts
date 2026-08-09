import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import config from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: config.apiKey || "AIzaSyBu-KF-GtHPnfWMVWedqJ5QUrdqr8gpwQY",
  authDomain: config.authDomain || "teampulse-d582c.firebaseapp.com",
  projectId: config.projectId || "teampulse-d582c",
  storageBucket: config.storageBucket || "teampulse-d582c.firebasestorage.app",
  messagingSenderId: config.messagingSenderId || "917861227419",
  appId: config.appId || "1:917861227419:web:2f065f880fb553887e9f3e"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const dbId = config.firestoreDatabaseId;
export const dbFirestore = (dbId && dbId !== '(default)') 
  ? getFirestore(app, dbId) 
  : getFirestore(app);

export const auth = getAuth(app);
