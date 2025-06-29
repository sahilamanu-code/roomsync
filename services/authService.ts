import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  householdId?: string;
  createdAt: Timestamp;
}

export const signUp = async (email: string, password: string, displayName: string) => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    
    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName,
      createdAt: Timestamp.now(),
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    return { user, userProfile };
  } catch (error) {
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  } catch (error) {
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};