import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  enableMultiTabIndexedDbPersistence,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCTC6wHjIDHGDgAb0YPMX3piYdpGvVnQeY",
  authDomain: "warung-resoyudan.firebaseapp.com",
  projectId: "warung-resoyudan",
  storageBucket: "warung-resoyudan.firebasestorage.app",
  messagingSenderId: "383193039169",
  appId: "1:383193039169:web:267608b52dd26f8f5c21c0",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db: Firestore = getFirestore(app);

// Enable offline persistence (multi-tab safe)
if (typeof window !== "undefined") {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      // Multiple tabs open — persistence already enabled in another tab
    } else if (err.code === "unimplemented") {
      // Browser does not support IndexedDB
    }
  });
}

export { db };
