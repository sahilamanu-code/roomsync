// services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Polyfill URL for web
import 'react-native-url-polyfill/auto';

const firebaseConfig = {
  apiKey: "AIzaSyBQMEiD79vl2pccHeJ6UA3YBeEWP80u9yw",
  authDomain: "roomsync-2fe91.firebaseapp.com",
  projectId: "roomsync-2fe91",
  storageBucket: "roomsync-2fe91.firebasestorage.app",
  messagingSenderId: "559942508087",
  appId: "1:559942508087:web:83bdfb0efa5870ec51e9b2",
};

const app = initializeApp(firebaseConfig);

// ALWAYS use this for both web & native under Expo SDK 53
export const auth = getAuth(app);

// If you need Firestore:
export const db = getFirestore(app);
