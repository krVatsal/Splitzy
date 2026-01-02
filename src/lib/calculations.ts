import type { Group, Balance, SimplifiedDebt } from './types';

export function calculateBalances(group: Group): Balance[] {
  const balances: { [memberId: string]: number } = {};

  for (const member of group.members) {
    balances[member.id] = 0;
  }

  for (const expense of group.expenses) {
    // Add amount for the member who paid
    if (balances[expense.paidById] !== undefined) {
      balances[expense.paidById] += expense.amount;
    }
    
    // Subtract amount for each member's share
    for (const split of expense.splits) {
      if (balances[split.memberId] !== undefined) {
        balances[split.memberId] -= split.amount;
      }
    }
  }

  return group.members.map(member => ({
    memberId: member.id,
    name: member.name,
    avatarUrl: member.avatarUrl,
    balance: balances[member.id],
  }));
}

export function simplifyDebts(balances: Balance[]): SimplifiedDebt[] {
    const debtors = balances.filter(b => b.balance < 0).map(b => ({ ...b, balance: b.balance }));
    const creditors = balances.filter(b => b.balance > 0).map(b => ({ ...b, balance: b.balance }));

    const simplifiedDebts: SimplifiedDebt[] = [];

    debtors.sort((a, b) => a.balance - b.balance); // Most negative first
    creditors.sort((a, b) => b.balance - a.balance); // Most positive first

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const amountToSettle = Math.min(-debtor.balance, creditor.balance);

        if (amountToSettle > 0.5) { // Threshold to avoid tiny transactions
            simplifiedDebts.push({
                from: debtor.memberId,
                to: creditor.memberId,
                fromName: debtor.name,
                toName: creditor.name,
                amount: Math.round(amountToSettle),
            });
        }

        debtor.balance += amountToSettle;
        creditor.balance -= amountToSettle;
        
        if (Math.abs(debtor.balance) < 0.5) i++;
        if (Math.abs(creditor.balance) < 0.5) j++;
    }

    return simplifiedDebts;
}

export const formatCurrency = (amountInCents: number) => {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
};
