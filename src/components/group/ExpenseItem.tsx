
'use client';
import { useState } from 'react';
import type { Expense, Group, User } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import { Receipt, MoreHorizontal, Pencil, Trash2, MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { deleteExpense } from '@/lib/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ExpenseDetailDialog } from './ExpenseDetailDialog';

export function ExpenseItem({
  expense,
  group,
  currentUser,
  onEdit,
}: {
  expense: Expense;
  group: Group;
  currentUser: User | null;
  onEdit: (expense: Expense) => void;
}) {
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [isDetailViewOpen, setDetailViewOpen] = useState(false);

  const paidByMember = group.members.find((m) => m.id === expense.paidById);
  const canModify = currentUser?.id === expense.authorId;

  return (
    <>
      <li className="flex items-center justify-between rounded-md border p-4 hover:bg-accent/50">
        <div className="flex items-center gap-4">
          <Receipt className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-semibold">{expense.description}</p>
            <p className="text-sm text-muted-foreground">
              Paid by {paidByMember?.name} on{' '}
              {new Date(expense.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="font-bold text-lg">{formatCurrency(expense.amount)}</p>
                <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                split among {expense.splits.filter((s) => s.amount > 0).length}
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setDetailViewOpen(true)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Details
                    </DropdownMenuItem>
                    {canModify && (
                    <>
                        <DropdownMenuItem onClick={() => onEdit(expense)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setDeleteAlertOpen(true)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </li>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense "{expense.description}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={deleteExpense}>
                <input type="hidden" name="groupId" value={group.id} />
                <input type="hidden" name="expenseId" value={expense.id} />
                <AlertDialogAction type="submit">Delete</AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ExpenseDetailDialog
        isOpen={isDetailViewOpen}
        onOpenChange={setDetailViewOpen}
        expense={expense}
        group={group}
        currentUser={currentUser}
      />
    </>
  );
}

