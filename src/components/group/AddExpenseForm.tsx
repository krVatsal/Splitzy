
'use client';

import { addExpense, editExpense } from '@/lib/actions';
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useState, useMemo, useRef } from 'react';
import type { Group, Member, Expense } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatCurrency } from '@/lib/calculations';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';

const initialState = { message: null, errors: {}, success: false };

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Expense')}
        </Button>
    );
}

export function AddExpenseForm({
    group,
    expense,
    isOpen,
    onOpenChange,
}: {
    group: Group;
    expense?: Expense;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const formRef = useRef<HTMLFormElement>(null);
    const isEditing = !!expense;
    const action = isEditing ? editExpense : addExpense;
    const [state, dispatch] = useFormState(action, initialState);
    const { toast } = useToast();
    
    // Form state
    const [description, setDescription] = useState(expense?.description || '');
    const [amount, setAmount] = useState((expense?.amount || 0) / 100);
    const [paidById, setPaidById] = useState(expense?.paidById || group.members[0]?.id);
    const [splitType, setSplitType] = useState('equally');
    const [customSplits, setCustomSplits] = useState<Record<string, number>>({});
    const [selectedMembers, setSelectedMembers] = useState<string[]>(group.members.map(m => m.id));

    const totalCustomSplit = useMemo(() => {
        return Object.values(customSplits).reduce((sum, amount) => sum + amount, 0);
    }, [customSplits]);
    
    const remainingAmount = amount * 100 - totalCustomSplit * 100;

    useEffect(() => {
        if (state.message) {
            toast({
                variant: state.success ? 'default' : 'destructive',
                title: state.success ? (isEditing ? 'Success' : 'Success') : 'Error',
                description: state.message,
            });
            if(state.success) {
                onOpenChange(false);
            }
        }
    }, [state, toast, onOpenChange, isEditing]);

    useEffect(() => {
        if (isOpen) {
            if (expense) {
                // Editing mode
                const expenseAmount = expense.amount / 100;
                setDescription(expense.description);
                setAmount(expenseAmount);
                setPaidById(expense.paidById);
                
                const hasCustomSplits = expense.splits.some(s => s.amount > 0 && expense.splits.filter(sp => sp.amount === s.amount).length === 1) && expense.splits.filter(s => s.amount > 0).length > 1;
                const areSplitsEqual = new Set(expense.splits.filter(s=> s.amount > 0).map(s => s.amount)).size === 1;

                if (hasCustomSplits && !areSplitsEqual) {
                     setSplitType('custom');
                     const custom: Record<string, number> = {};
                     expense.splits.forEach(s => {
                         const member = group.members.find(m => m.id === s.memberId);
                         if(member) custom[member.id] = s.amount / 100;
                     });
                     setCustomSplits(custom);
                } else if (!areSplitsEqual) {
                     setSplitType('unequally');
                     setSelectedMembers(expense.splits.filter(s => s.amount > 0).map(s => s.memberId));
                } else {
                    setSplitType('equally');
                    setSelectedMembers(group.members.map(m => m.id));
                }
            } else {
                // Adding mode - reset form
                formRef.current?.reset();
                setDescription('');
                setAmount(0);
                setPaidById(group.members[0]?.id);
                setSplitType('equally');
                setCustomSplits({});
                setSelectedMembers(group.members.map(m => m.id));
            }
        }
    }, [expense, isOpen, group.members]);


    const handleCustomSplitChange = (memberId: string, value: string) => {
        setCustomSplits(prev => ({ ...prev, [memberId]: Number(value) || 0 }));
    };

    const handleMemberSelect = (memberId: string, isSelected: boolean) => {
        setSelectedMembers(prev => {
            if (isSelected) {
                return [...prev, memberId];
            } else {
                return prev.filter(id => id !== memberId);
            }
        });
    };
    
    const handleSplitTypeChange = (value: string) => {
        setSplitType(value);
        if (value === 'unequally') {
            setSelectedMembers(group.members.map(m => m.id));
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Expense' : 'Add a New Expense'}</DialogTitle>
                    <DialogDescription>{isEditing ? 'Modify the details of the expense.' : 'Enter the details of the shared expense.'}</DialogDescription>
                </DialogHeader>
                <form ref={formRef} action={dispatch} className="space-y-4">
                    <input type="hidden" name="groupId" value={group.id} />
                    {isEditing && <input type="hidden" name="expenseId" value={expense.id} />}
                    
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" placeholder="e.g., Groceries" required value={description} onChange={e => setDescription(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount ($)</Label>
                            <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paidById">Paid by</Label>
                            <Select name="paidById" required value={paidById} onValueChange={setPaidById}>
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
                        <RadioGroup name="splitType" value={splitType} onValueChange={handleSplitTypeChange} className="flex flex-wrap gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="equally" id="equally" />
                                <Label htmlFor="equally">Equally</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unequally" id="unequally" />
                                <Label htmlFor="unequally">Select People</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="custom" id="custom" />
                                <Label htmlFor="custom">Custom</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {splitType === 'unequally' && (
                        <div className="space-y-3 rounded-md border p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium">Split between</h4>
                                <p className="text-sm text-muted-foreground">
                                    {selectedMembers.length} of {group.members.length} people
                                </p>
                            </div>
                            <ScrollArea className="h-40">
                                <div className="space-y-3 pr-4">
                                {group.members.map(member => (
                                    <div key={member.id} className="flex items-center gap-3">
                                        <Checkbox 
                                            id={`member-${member.id}`} 
                                            name="selectedMembers"
                                            value={member.id}
                                            checked={selectedMembers.includes(member.id)}
                                            onCheckedChange={(checked) => handleMemberSelect(member.id, !!checked)}
                                        />
                                        <Label htmlFor={`member-${member.id}`} className="font-normal flex-1 cursor-pointer">{member.name}</Label>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {splitType === 'custom' && (
                        <div className="space-y-3 rounded-md border p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium">Custom Split</h4>
                                <p className={`text-sm font-semibold ${remainingAmount !== 0 ? 'text-destructive' : 'text-green-600'}`}>
                                    {formatCurrency(remainingAmount / 100)} remaining
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
                                            value={customSplits[member.id] || ''}
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
                        <SubmitButton isEditing={isEditing} />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
