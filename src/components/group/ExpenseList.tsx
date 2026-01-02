'use client';

import type { Group } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Receipt } from 'lucide-react';
import { useState } from 'react';
import { AddExpenseForm } from './AddExpenseForm';
import { formatCurrency } from '@/lib/calculations';

export function ExpenseList({ group }: { group: Group }) {
  const [isAddExpenseOpen, setAddExpenseOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start sm:items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="font-headline">Expenses</CardTitle>
            <CardDescription>All shared expenses in this group.</CardDescription>
          </div>
          <Button onClick={() => setAddExpenseOpen(true)} className="shrink-0">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </CardHeader>
        <CardContent>
          {group.expenses.length > 0 ? (
            <ul className="space-y-4">
              {group.expenses.slice().reverse().map((expense) => {
                const paidByMember = group.members.find(m => m.id === expense.paidById);
                return (
                  <li key={expense.id} className="flex items-center justify-between rounded-md border p-4 hover:bg-accent/50">
                    <div className="flex items-center gap-4">
                      <Receipt className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Paid by {paidByMember?.name} on {new Date(expense.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(expense.amount)}</p>
                       <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                        split among {expense.splits.filter(s => s.amount > 0).length}
                       </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No expenses added yet.</p>
              <Button variant="link" onClick={() => setAddExpenseOpen(true)} className="mt-2">Add the first one</Button>
            </div>
          )}
        </CardContent>
      </Card>
      <AddExpenseForm group={group} isOpen={isAddExpenseOpen} onOpenChange={setAddExpenseOpen} />
    </>
  );
}
