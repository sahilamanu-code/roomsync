import { collection, doc, addDoc, getDocs, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface Chore {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  householdId: string;
  dueDate: Timestamp;
  completed: boolean;
  completedAt?: Timestamp;
  completedBy?: string;
  createdAt: Timestamp;
  priority: 'low' | 'medium' | 'high';
  recurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
}

export const createChore = async (choreData: Omit<Chore, 'id' | 'createdAt' | 'completed'>): Promise<string> => {
  try {
    const chore = {
      ...choreData,
      dueDate: Timestamp.fromDate(choreData.dueDate as any),
      createdAt: Timestamp.now(),
      completed: false,
    };
    
    const docRef = await addDoc(collection(db, 'chores'), chore);
    return docRef.id;
  } catch (error) {
    console.error('Error creating chore:', error);
    throw error;
  }
};

export const getHouseholdChores = async (householdId: string): Promise<Chore[]> => {
  try {
    const choresRef = collection(db, 'chores');
    const q = query(
      choresRef,
      where('householdId', '==', householdId),
      orderBy('dueDate', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const chores: Chore[] = [];
    
    querySnapshot.forEach((doc) => {
      chores.push({ id: doc.id, ...doc.data() } as Chore);
    });
    
    return chores;
  } catch (error) {
    console.error('Error fetching chores:', error);
    return [];
  }
};

export const completeChore = async (choreId: string, completedBy: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'chores', choreId), {
      completed: true,
      completedAt: Timestamp.now(),
      completedBy,
    });
  } catch (error) {
    console.error('Error completing chore:', error);
    throw error;
  }
};

export const updateChore = async (choreId: string, updates: Partial<Chore>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'chores', choreId), updates);
  } catch (error) {
    console.error('Error updating chore:', error);
    throw error;
  }
};