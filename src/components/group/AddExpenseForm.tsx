'use client';

import { addExpense } from '@/lib/actions';
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useState, useMemo } from 'react';
import type { Group } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatCurrency } from '@/lib/calculations';
import { ScrollArea } from '../ui/scroll-area';

const initialState = { message: null, errors: {}, success: false };

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Adding Expense...' : 'Add Expense'}
        </Button>
    );
}

export function AddExpenseForm({ group, isOpen, onOpenChange }: { group: Group; isOpen: boolean; onOpenChange: (open: boolean) => void }) {
    const [state, dispatch] = useFormState(addExpense, initialState);
    const { toast } = useToast();
    const [splitType, setSplitType] = useState('equally');
    const [totalAmount, setTotalAmount] = useState(0);
    const [customSplits, setCustomSplits] = useState<Record<string, number>>({});

    const totalCustomSplit = useMemo(() => {
        return Object.values(customSplits).reduce((sum, amount) => sum + amount, 0);
    }, [customSplits]);

    const remainingAmount = totalAmount * 100 - totalCustomSplit * 100;

    useEffect(() => {
        if (state.message) {
            toast({
                variant: state.success ? 'default' : 'destructive',
                title: state.success ? 'Success' : 'Error',
                description: state.message,
            });
            if(state.success) {
                onOpenChange(false);
                // Reset form state on success
                setSplitType('equally');
                setTotalAmount(0);
                setCustomSplits({});
            }
        }
    }, [state, toast, onOpenChange]);

    const handleCustomSplitChange = (memberId: string, value: string) => {
        setCustomSplits(prev => ({ ...prev, [memberId]: Number(value) || 0 }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Add a New Expense</DialogTitle>
                    <DialogDescription>Enter the details of the shared expense.</DialogDescription>
                </DialogHeader>
                <form action={dispatch} className="space-y-4">
                    <input type="hidden" name="groupId" value={group.id} />
                    
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" placeholder="e.g., Groceries" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount ($)</Label>
                            <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required onChange={(e) => setTotalAmount(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paidById">Paid by</Label>
                            <Select name="paidById" required defaultValue={group.members[0].id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select who paid" />
                                </SelectTrigger>
                                <SelectContent>
                                    {group.members.map(member => (
                                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Split</Label>
                        <RadioGroup name="splitType" defaultValue="equally" onValueChange={setSplitType} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="equally" id="equally" />
                                <Label htmlFor="equally">Equally</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="custom" id="custom" />
                                <Label htmlFor="custom">Custom</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {splitType === 'custom' && (
                        <div className="space-y-3 rounded-md border p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium">Custom Split</h4>
                                <p className={`text-sm font-semibold ${remainingAmount !== 0 ? 'text-destructive' : 'text-green-600'}`}>
                                    {formatCurrency(remainingAmount)} remaining
                                </p>
                            </div>
                             <ScrollArea className="h-40">
                                <div className="space-y-2 pr-4">
                                {group.members.map(member => (
                                    <div key={member.id} className="flex items-center gap-2">
                                        <Label htmlFor={`split-${member.id}`} className="flex-1">{member.name}</Label>
                                        <Input
                                            id={`split-${member.id}`}
                                            name={`split-${member.id}`}
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-24"
                                            onChange={(e) => handleCustomSplitChange(member.id, e.target.value)}
                                        />
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                    
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
