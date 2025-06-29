import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface Household {
  name: string;
  inviteCode: string;
  memberIds: string[];
  createdAt: Timestamp;
  createdBy: string;
}

export interface HouseholdMember {
  uid: string;
  displayName: string;
  email: string;
  joinedAt: Timestamp;
}

const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createHousehold = async (name: string, creatorUid: string): Promise<string> => {
  try {
    const inviteCode = generateInviteCode();
    
    const household: Household = {
      name,
      inviteCode,
      memberIds: [creatorUid],
      createdAt: Timestamp.now(),
      createdBy: creatorUid,
    };

    // Use addDoc for auto-generated ID
    const docRef = await addDoc(collection(db, 'households'), household);
    
    // Update user's household reference
    await updateDoc(doc(db, 'users', creatorUid), {
      householdId: docRef.id,
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating household:', error);
    throw error;
  }
};

export const joinHousehold = async (inviteCode: string, userUid: string): Promise<string> => {
  try {
    const householdsRef = collection(db, 'households');
    const q = query(householdsRef, where('inviteCode', '==', inviteCode.toUpperCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Invalid invite code');
    }
    
    const householdDoc = querySnapshot.docs[0];
    const householdData = householdDoc.data() as Household;
    
    if (householdData.memberIds.includes(userUid)) {
      throw new Error('You are already a member of this household');
    }
    
    // Add user to household
    await updateDoc(doc(db, 'households', householdDoc.id), {
      memberIds: [...householdData.memberIds, userUid],
    });
    
    // Update user's household reference
    await updateDoc(doc(db, 'users', userUid), {
      householdId: householdDoc.id,
    });
    
    return householdDoc.id;
  } catch (error) {
    console.error('Error joining household:', error);
    throw error;
  }
};

export const getHousehold = async (householdId: string): Promise<(Household & { id: string }) | null> => {
  try {
    const docRef = doc(db, 'households', householdId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as (Household & { id: string });
    }
    return null;
  } catch (error) {
    console.error('Error fetching household:', error);
    return null;
  }
};