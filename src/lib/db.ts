
import { firestore } from './firebase';
import type { Group, Expense, Member, User, Comment } from './types';
import { v4 as uuidv4 } from 'uuid';

const GROUPS_COLLECTION = 'groups';
const USERS_COLLECTION = 'users';

// Simulate database latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const db = {
  // USER-related functions
  getUserById: async (id: string): Promise<User | null> => {
    await delay(100);
    const doc = await firestore.collection(USERS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as User;
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    await delay(100);
    const snapshot = await firestore.collection(USERS_COLLECTION).where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  },

  createUser: async (name: string, email: string): Promise<User> => {
    await delay(200);
    const newUser: Omit<User, 'id'> = {
      name,
      email,
      avatarUrl: `https://picsum.photos/seed/${email}/150/150`,
    };
    const docRef = await firestore.collection(USERS_COLLECTION).add(newUser);
    return { id: docRef.id, ...newUser };
  },

  // GROUP-related functions
  getGroupsForUser: async (userId: string): Promise<Group[]> => {
    await delay(100);
    const snapshot = await firestore.collection(GROUPS_COLLECTION).where('memberIds', 'array-contains', userId).orderBy('createdAt', 'desc').get();
    const userGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
    
    for (const group of userGroups) {
      if (group.memberIds) {
        const memberPromises = group.memberIds.map(memberId => db.getUserById(memberId));
        const members = await Promise.all(memberPromises);
        group.members = members.filter((m): m is User => m !== null).map(m => ({ id: m.id, name: m.name, avatarUrl: m.avatarUrl }));
      } else {
        group.members = [];
      }
    }

    return userGroups;
  },

  getGroupById: async (id: string): Promise<Group | null> => {
    await delay(100);
    const doc = await firestore.collection(GROUPS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    
    const groupData = doc.data() as Omit<Group, 'id'>;

    if (!groupData.memberIds) {
        groupData.memberIds = [];
    }

    const memberPromises = groupData.memberIds.map(memberId => db.getUserById(memberId));
    const memberDocs = await Promise.all(memberPromises);
    
    const members: Member[] = memberDocs
        .filter((m): m is User => m !== null)
        .map(user => ({
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl,
        }));

    return { id: doc.id, ...groupData, members } as Group;
  },

  getGroupByInviteCode: async (code: string): Promise<Group | null> => {
    await delay(100);
    const snapshot = await firestore.collection(GROUPS_COLLECTION).where('inviteCode', '==', code).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const groupData = doc.data() as Omit<Group, 'id' | 'members'>;
     return { id: doc.id, ...groupData, members: [] } as Group;
  },

  createGroup: async (name: string, user: User): Promise<Group> => {
    await delay(200);
    const newGroupData: Omit<Group, 'id' | 'members'> = {
      name,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      memberIds: [user.id],
      expenses: [],
    };
    const docRef = await firestore.collection(GROUPS_COLLECTION).add(newGroupData);
    
    return { id: docRef.id, ...newGroupData, members: [{id: user.id, name: user.name, avatarUrl: user.avatarUrl}] } as Group;
  },

  addMemberToGroup: async (groupId: string, user: User): Promise<void> => {
    await delay(200);
    const groupRef = firestore.collection(GROUPS_COLLECTION).doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) throw new Error('Group not found');

    const group = groupDoc.data() as Group;
    if (group.memberIds && group.memberIds.includes(user.id)) {
        return; 
    }

    const updatedMemberIds = [...(group.memberIds || []), user.id];
    await groupRef.update({ memberIds: updatedMemberIds });
  },

  addExpenseToGroup: async (groupId: string, expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
    await delay(200);
    const groupRef = firestore.collection(GROUPS_COLLECTION).doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) throw new Error('Group not found');

    const group = groupDoc.data() as Group;
    const newExpense: Expense = {
      ...expenseData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      comments: [],
    };
    
    const updatedExpenses = [...(group.expenses || []), newExpense];
    await groupRef.update({ expenses: updatedExpenses });

    return newExpense;
  },
  
  updateExpenseInGroup: async (groupId: string, updatedExpense: Expense): Promise<void> => {
    await delay(200);
    const groupRef = firestore.collection(GROUPS_COLLECTION).doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) throw new Error('Group not found');
    const group = groupDoc.data() as Group;

    const expenseIndex = group.expenses.findIndex(e => e.id === updatedExpense.id);
    if (expenseIndex === -1) throw new Error('Expense not found');

    const updatedExpenses = [...group.expenses];
    updatedExpenses[expenseIndex] = updatedExpense;

    await groupRef.update({ expenses: updatedExpenses });
  },

  deleteExpenseFromGroup: async (groupId: string, expenseId: string, userId: string): Promise<void> => {
    await delay(200);
    const groupRef = firestore.collection(GROUPS_COLLECTION).doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) throw new Error('Group not found');
    const group = groupDoc.data() as Group;

    const expense = group.expenses.find(e => e.id === expenseId);
    if (!expense) return; // Expense already deleted or never existed
    if (expense.authorId !== userId) {
      throw new Error('You do not have permission to delete this expense.');
    }

    const updatedExpenses = group.expenses.filter(e => e.id !== expenseId);
    await groupRef.update({ expenses: updatedExpenses });
  },

  addCommentToExpense: async (groupId: string, expenseId: string, comment: Comment): Promise<void> => {
    await delay(200);
    const groupRef = firestore.collection(GROUPS_COLLECTION).doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) throw new Error('Group not found');
    const group = groupDoc.data() as Group;

    const expenseIndex = group.expenses.findIndex(e => e.id === expenseId);
    if (expenseIndex === -1) throw new Error('Expense not found');

    const updatedExpenses = [...group.expenses];
    const expense = updatedExpenses[expenseIndex];
    const updatedComments = [...(expense.comments || []), comment];
    updatedExpenses[expenseIndex] = { ...expense, comments: updatedComments };

    await groupRef.update({ expenses: updatedExpenses });
  },
};
