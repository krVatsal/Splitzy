export type Member = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type Split = {
  memberId: string;
  amount: number; // in cents
};

export type Expense = {
  id:string;
  groupId: string;
  description: string;
  amount: number; // in cents
  paidById: string;
  splits: Split[];
  createdAt: string;
};

export type Group = {
  id: string;
  name: string;
  inviteCode: string;
  members: Member[];
  expenses: Expense[];
  createdAt: string;
};

export type Balance = {
  memberId: string;
  name: string;
  avatarUrl: string;
  balance: number; // in cents. +ve: owed to, -ve: owes
};

export type SimplifiedDebt = {
  from: string; // memberId
  to: string; // memberId
  fromName: string;
  toName: string;
  amount: number; // in cents
};
