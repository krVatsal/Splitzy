
export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export type Member = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type Split = {
  memberId: string;
  amount: number; // in cents
};

export type Comment = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
};

export type Expense = {
  id:string;
  description: string;
  amount: number; // in cents
  paidById: string;
  authorId: string;
  splits: Split[];
  createdAt: string;
  comments?: Comment[];
};

export type Group = {
  id: string;
  name: string;
  inviteCode: string;
  memberIds: string[];
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
