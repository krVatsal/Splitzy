import type { Group, Expense } from './types';

// In a real app, this would be a database.
// For this demo, we use an in-memory store.
const initialGroups: Group[] = [
  {
    id: 'group-1',
    name: 'Vacation in Hawaii',
    inviteCode: 'HAWAII24',
    createdAt: new Date('2024-07-01T10:00:00Z').toISOString(),
    members: [
      { id: 'user-1', name: 'Alice', avatarUrl: 'https://picsum.photos/seed/1/150/150' },
      { id: 'user-2', name: 'Bob', avatarUrl: 'https://picsum.photos/seed/2/150/150' },
      { id: 'user-3', name: 'Charlie', avatarUrl: 'https://picsum.photos/seed/3/150/150' },
    ],
    expenses: [
      {
        id: 'exp-1',
        groupId: 'group-1',
        description: '✈️ Flights',
        amount: 120000, // $1200
        paidById: 'user-1',
        createdAt: new Date('2024-07-02T12:00:00Z').toISOString(),
        splits: [
          { memberId: 'user-1', amount: 40000 },
          { memberId: 'user-2', amount: 40000 },
          { memberId: 'user-3', amount: 40000 },
        ],
      },
      {
        id: 'exp-2',
        groupId: 'group-1',
        description: '🏨 Hotel',
        amount: 90000, // $900
        paidById: 'user-2',
        createdAt: new Date('2024-07-03T15:00:00Z').toISOString(),
        splits: [
          { memberId: 'user-1', amount: 30000 },
          { memberId: 'user-2', amount: 30000 },
          { memberId: 'user-3', amount: 30000 },
        ],
      },
      {
        id: 'exp-3',
        groupId: 'group-1',
        description: 'Dinner',
        amount: 15000,
        paidById: 'user-1',
        createdAt: new Date('2024-07-03T20:00:00Z').toISOString(),
        splits: [
            { memberId: 'user-1', amount: 7000 },
            { memberId: 'user-2', amount: 8000 },
            { memberId: 'user-3', amount: 0 },
        ],
      }
    ],
  },
   {
    id: 'group-2',
    name: 'Apartment Mates',
    inviteCode: 'APT2024',
    createdAt: new Date('2024-05-01T10:00:00Z').toISOString(),
    members: [
      { id: 'user-4', name: 'David', avatarUrl: 'https://picsum.photos/seed/4/150/150' },
      { id: 'user-5', name: 'Eve', avatarUrl: 'https://picsum.photos/seed/5/150/150' },
    ],
    expenses: [
      {
        id: 'exp-4',
        groupId: 'group-2',
        description: 'Rent',
        amount: 200000,
        paidById: 'user-4',
        createdAt: new Date('2024-07-01T09:00:00Z').toISOString(),
        splits: [
          { memberId: 'user-4', amount: 100000 },
          { memberId: 'user-5', amount: 100000 },
        ],
      },
      {
        id: 'exp-5',
        groupId: 'group-2',
        description: 'Groceries',
        amount: 12000,
        paidById: 'user-5',
        createdAt: new Date('2024-07-05T18:00:00Z').toISOString(),
        splits: [
          { memberId: 'user-4', amount: 6000 },
          { memberId: 'user-5', amount: 6000 },
        ],
      },
    ]
  }
];

// We clone the initial data to avoid modifying it during runtime
let groups: Group[] = JSON.parse(JSON.stringify(initialGroups));

// Simulate database latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const db = {
  getGroups: async () => {
    await delay(100);
    return groups;
  },
  getGroupById: async (id: string) => {
    await delay(100);
    return groups.find(g => g.id === id) || null;
  },
  getGroupByInviteCode: async (code: string) => {
    await delay(100);
    return groups.find(g => g.inviteCode === code) || null;
  },
  createGroup: async (name: string, userName: string) => {
    await delay(200);
    const userId = Date.now();
    const newMember = {
        id: `user-${userId}`,
        name: userName,
        avatarUrl: `https://picsum.photos/seed/${userId}/150/150`
    };
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      members: [newMember],
      expenses: [],
    };
    groups.push(newGroup);
    return newGroup;
  },
  addMemberToGroup: async (groupId: string, userName: string) => {
    await delay(200);
    const group = await db.getGroupById(groupId);
    if (!group) throw new Error('Group not found');

    const userId = Date.now();
    const newMember = {
        id: `user-${userId}`,
        name: userName,
        avatarUrl: `https://picsum.photos/seed/${userId}/150/150`
    };

    group.members.push(newMember);
    return group;
  },
  addExpenseToGroup: async (groupId: string, expenseData: Omit<Expense, 'id' | 'groupId' | 'createdAt'>) => {
    await delay(200);
    const group = await db.getGroupById(groupId);
    if (!group) throw new Error('Group not found');

    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      groupId,
      createdAt: new Date().toISOString(),
    };
    group.expenses.push(newExpense);
    return newExpense;
  },
};
