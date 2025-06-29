# RoomSync Firestore Schema

## Collections

### users
```typescript
{
  uid: string; // Document ID matches auth UID
  email: string;
  displayName: string;
  householdId?: string; // Reference to household
  createdAt: Timestamp;
  pushToken?: string; // For notifications
}
```

### households
```typescript
{
  id: string; // Document ID
  name: string;
  inviteCode: string; // 6-character uppercase code
  memberIds: string[]; // Array of user UIDs
  createdAt: Timestamp;
  createdBy: string; // User UID
}
```

### chores
```typescript
{
  id: string; // Document ID
  title: string;
  description: string;
  assignedTo: string; // User UID
  assignedBy: string; // User UID
  householdId: string; // Reference to household
  dueDate: Timestamp;
  completed: boolean;
  completedAt?: Timestamp;
  completedBy?: string; // User UID
  createdAt: Timestamp;
  priority: 'low' | 'medium' | 'high';
  recurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
}
```

### expenses
```typescript
{
  id: string; // Document ID
  title: string;
  description: string;
  amount: number; // In dollars
  paidBy: string; // User UID
  householdId: string; // Reference to household
  category: string; // 'food', 'utilities', 'rent', etc.
  date: Timestamp;
  splitBetween: string[]; // Array of user UIDs
  splitType: 'equal' | 'custom';
  customSplits?: { [userId: string]: number }; // Only if splitType is 'custom'
  createdAt: Timestamp;
}
```

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Household members can read/write household data
    match /households/{householdId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.memberIds;
    }
    
    // Household members can read/write chores
    match /chores/{choreId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/households/$(resource.data.householdId)).data.memberIds;
    }
    
    // Household members can read/write expenses
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/households/$(resource.data.householdId)).data.memberIds;
    }
  }
}
```

## Indexes Required

1. **chores**
   - householdId (ascending)
   - dueDate (ascending)
   - completed (ascending)

2. **expenses**
   - householdId (ascending)
   - date (descending)

3. **households**
   - inviteCode (ascending)

## Setup Instructions

1. Create a new Firebase project
2. Enable Authentication with Email/Password
3. Enable Firestore Database
4. Apply the security rules above
5. Create the required indexes
6. Update the Firebase config in `services/firebase.ts`