import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Polyfills for React Native Web
import 'react-native-url-polyfill/auto';

// Your Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyBQMEiD79vl2pccHeJ6UA3YBeEWP80u9yw",
  authDomain: "roomsync-2fe91.firebaseapp.com",
  projectId: "roomsync-2fe91",
  storageBucket: "roomsync-2fe91.firebasestorage.app",
  messagingSenderId: "559942508087",
  appId: "1:559942508087:web:83bdfb0efa5870ec51e9b2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Firestore
export const db = getFirestore(app);
export { auth };
export default app;