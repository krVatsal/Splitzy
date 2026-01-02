
'use client';
import { useState, useEffect, useRef } from 'react';
import type { Expense, Group, User } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import { addComment } from '@/lib/actions';
import { useFormState, useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Send } from 'lucide-react';

const initialState = { message: null, errors: {}, success: false };

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="icon" disabled={pending}>
            {pending ? '...' : <Send className="h-4 w-4" />}
        </Button>
    );
}

export function ExpenseDetailDialog({
  isOpen,
  onOpenChange,
  expense,
  group,
  currentUser,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense;
  group: Group;
  currentUser: User | null;
}) {
  const paidByMember = group.members.find((m) => m.id === expense.paidById);
  const [state, dispatch] = useFormState(addComment, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
        toast({
            variant: state.success ? 'default' : 'destructive',
            title: state.success ? 'Success' : 'Error',
            description: state.message,
        });
        if (state.success) {
            formRef.current?.reset();
        }
    }
  }, [state, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{expense.description}</DialogTitle>
          <DialogDescription>
            <span className="font-bold text-primary text-xl">{formatCurrency(expense.amount)}</span> paid by {paidByMember?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 max-h-[60vh] overflow-hidden flex flex-col">
            <div className="pr-4">
                <h4 className="font-semibold mb-2">Split Details</h4>
                <ul className="space-y-2 text-sm">
                    {expense.splits.filter(s => s.amount > 0).map(split => {
                        const member = group.members.find(m => m.id === split.memberId);
                        return (
                            <li key={split.memberId} className="flex justify-between items-center">
                                <span>{member?.name} owes</span>
                                <span className="font-medium">{formatCurrency(split.amount)}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
            
            <div className="flex-grow flex flex-col overflow-hidden">
                <h4 className="font-semibold mb-2">Comments</h4>
                <ScrollArea className="flex-grow pr-4 -mr-4">
                    <div className="space-y-4">
                        {expense.comments && expense.comments.length > 0 ? (
                            expense.comments.map(comment => {
                                const author = group.members.find(m => m.id === comment.authorId);
                                return (
                                <div key={comment.id} className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={author?.avatarUrl} alt={author?.name} />
                                        <AvatarFallback>{author?.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="bg-muted p-3 rounded-lg w-full">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-semibold text-sm">{comment.authorName}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <p className="text-sm">{comment.text}</p>
                                    </div>
                                </div>
                                )
                            })
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {currentUser && (
                <form ref={formRef} action={dispatch} className="flex items-start gap-2 pt-4 border-t">
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="expenseId" value={expense.id} />
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                        <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="w-full space-y-2">
                        <Label htmlFor="comment" className="sr-only">Add a comment</Label>
                        <Textarea id="comment" name="comment" placeholder="Add a comment..." rows={2} required className="text-sm" />
                        <div aria-live="polite" aria-atomic="true">
                            {state?.errors?.comment && <p className="text-sm font-medium text-destructive">{state.errors.comment[0]}</p>}
                        </div>
                    </div>
                    <SubmitButton />
                </form>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
