import { firestore } from './firebase';
import type { Group, Expense, Member } from './types';

const GROUPS_COLLECTION = 'groups';

// Simulate database latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const db = {
  getGroups: async (): Promise<Group[]> => {
    await delay(100);
    const snapshot = await firestore.collection(GROUPS_COLLECTION).get();
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
    return groups;
  },
  getGroupById: async (id: string): Promise<Group | null> => {
    await delay(100);
    const doc = await firestore.collection(GROUPS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Group;
  },
  getGroupByInviteCode: async (code: string): Promise<Group | null> => {
    await delay(100);
    const snapshot = await firestore.collection(GROUPS_COLLECTION).where('inviteCode', '==', code).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Group;
  },
  createGroup: async (name: string, userName: string): Promise<Group> => {
    await delay(200);
    const userId = Date.now();
    const newMember: Member = {
        id: `user-${userId}`,
        name: userName,
        avatarUrl: `https://picsum.photos/seed/${userId}/150/150`
    };
    const newGroupData = {
      name,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      members: [newMember],
      expenses: [],
    };
    const docRef = await firestore.collection(GROUPS_COLLECTION).add(newGroupData);
    return { id: docRef.id, ...newGroupData } as Group;
  },
  addMemberToGroup: async (groupId: string, userName: string): Promise<Group> => {
    await delay(200);
    const groupRef = firestore.collection(GROUPS_COLLECTION).doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) throw new Error('Group not found');

    const group = groupDoc.data() as Group;
    const userId = Date.now();
    const newMember: Member = {
        id: `user-${userId}`,
        name: userName,
        avatarUrl: `https://picsum.photos/seed/${userId}/150/150`
    };

    const updatedMembers = [...(group.members || []), newMember];
    await groupRef.update({ members: updatedMembers });

    return { ...group, id: groupId, members: updatedMembers };
  },
  addExpenseToGroup: async (groupId: string, expenseData: Omit<Expense, 'id' | 'groupId' | 'createdAt'>): Promise<Expense> => {
    await delay(200);
    const groupRef = firestore.collection(GROUPS_COLLECTION).doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) throw new Error('Group not found');

    const group = groupDoc.data() as Group;
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      groupId,
      createdAt: new Date().toISOString(),
    };
    
    const updatedExpenses = [...(group.expenses || []), newExpense];
    await groupRef.update({ expenses: updatedExpenses });

    return newExpense;
  },
};
