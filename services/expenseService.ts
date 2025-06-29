import { collection, doc, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  paidBy: string;
  householdId: string;
  category: string;
  date: Timestamp;
  splitBetween: string[];
  splitType: 'equal' | 'custom';
  customSplits?: { [userId: string]: number };
  createdAt: Timestamp;
}

export interface ExpenseBalance {
  userId: string;
  owes: { [toUserId: string]: number };
  owed: { [fromUserId: string]: number };
  netBalance: number;
}

export const createExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'date'> & { date: Date }): Promise<string> => {
  try {
    const expense = {
      ...expenseData,
      date: Timestamp.fromDate(expenseData.date),
      createdAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, 'expenses'), expense);
    return docRef.id;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

export const getHouseholdExpenses = async (householdId: string): Promise<Expense[]> => {
  try {
    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('householdId', '==', householdId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];
    
    querySnapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() } as Expense);
    });
    
    return expenses;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
};

export const calculateBalances = (expenses: Expense[], memberIds: string[]): { [userId: string]: ExpenseBalance } => {
  const balances: { [userId: string]: ExpenseBalance } = {};
  
  // Initialize balances
  memberIds.forEach(userId => {
    balances[userId] = {
      userId,
      owes: {},
      owed: {},
      netBalance: 0,
    };
  });
  
  // Calculate balances from expenses
  expenses.forEach(expense => {
    const { paidBy, amount, splitBetween, splitType, customSplits } = expense;
    
    if (splitType === 'equal') {
      const splitAmount = amount / splitBetween.length;
      
      splitBetween.forEach(userId => {
        if (userId !== paidBy) {
          balances[userId].owes[paidBy] = (balances[userId].owes[paidBy] || 0) + splitAmount;
          balances[paidBy].owed[userId] = (balances[paidBy].owed[userId] || 0) + splitAmount;
        }
      });
    } else if (splitType === 'custom' && customSplits) {
      Object.entries(customSplits).forEach(([userId, splitAmount]) => {
        if (userId !== paidBy) {
          balances[userId].owes[paidBy] = (balances[userId].owes[paidBy] || 0) + splitAmount;
          balances[paidBy].owed[userId] = (balances[paidBy].owed[userId] || 0) + splitAmount;
        }
      });
    }
  });
  
  // Calculate net balances
  Object.values(balances).forEach(balance => {
    const totalOwed = Object.values(balance.owed).reduce((sum, amount) => sum + amount, 0);
    const totalOwes = Object.values(balance.owes).reduce((sum, amount) => sum + amount, 0);
    balance.netBalance = totalOwed - totalOwes;
  });
  
  return balances;
};