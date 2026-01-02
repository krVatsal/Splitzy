
'use client';

import type { Group, Expense } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { AddExpenseForm } from './AddExpenseForm';
import { ExpenseItem } from './ExpenseItem';
import { getCurrentUser } from '@/lib/auth';
import { useEffect } from 'react';
import type { User } from '@/lib/types';


export function ExpenseList({ group }: { group: Group }) {
  const [isAddExpenseOpen, setAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // This is a workaround to get the current user on the client side
    // as server components cannot pass user to client components directly.
    const fetchUser = async () => {
        const res = await fetch('/api/user');
        if(res.ok) {
            const user = await res.json();
            setCurrentUser(user);
        }
    };
    fetchUser();
  }, []);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setAddExpenseOpen(true);
  };
  
  const handleAdd = () => {
    setEditingExpense(undefined);
    setAddExpenseOpen(true);
  }

  const handleOpenChange = (isOpen: boolean) => {
    setAddExpenseOpen(isOpen);
    if (!isOpen) {
        setEditingExpense(undefined);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start sm:items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="font-headline">Expenses</CardTitle>
            <CardDescription>All shared expenses in this group.</CardDescription>
          </div>
          <Button onClick={handleAdd} className="shrink-0">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </CardHeader>
        <CardContent>
          {group.expenses.length > 0 ? (
            <ul className="space-y-4">
              {group.expenses.slice().reverse().map((expense) => (
                 <ExpenseItem 
                    key={expense.id} 
                    expense={expense} 
                    group={group} 
                    currentUser={currentUser}
                    onEdit={handleEdit}
                 />
              ))}
            </ul>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No expenses added yet.</p>
              <Button variant="link" onClick={handleAdd} className="mt-2">Add the first one</Button>
            </div>
          )}
        </CardContent>
      </Card>
      <AddExpenseForm 
        group={group} 
        expense={editingExpense} 
        isOpen={isAddExpenseOpen} 
        onOpenChange={handleOpenChange} 
       />
    </>
  );
}
