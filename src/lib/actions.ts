
'use server';

import { z } from 'zod';
import { db } from './db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Split, User, Comment, Expense } from './types';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// --- USER ACTIONS ---

const UserAuthSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  name: z.string().min(2, "Name must be at least 2 characters."),
});

async function getAuthenticatedUser(): Promise<User | null> {
    const userEmail = cookies().get('user_email')?.value;
    if (!userEmail) return null;
    return await db.getUserByEmail(userEmail);
}

export async function loginOrRegister(prevState: any, formData: FormData) {
    const validatedFields = UserAuthSchema.safeParse({
        email: formData.get('email'),
        name: formData.get('name'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid form data.',
        };
    }
    
    const { email, name } = validatedFields.data;
    
    let user = await db.getUserByEmail(email);
    if (!user) {
        user = await db.createUser(name, email);
    }

    cookies().set('user_email', user.email, { httpOnly: true, path: '/' });
    
    redirect('/');
}

export async function logout() {
    cookies().delete('user_email');
    redirect('/login');
}


// --- GROUP ACTIONS ---

// Schema for creating a group
const CreateGroupSchema = z.object({
  groupName: z.string().min(3, "Group name must be at least 3 characters."),
});

export async function createGroup(prevState: any, formData: FormData) {
  const user = await getAuthenticatedUser();
  if (!user) return { message: 'You must be logged in to create a group.' };

  const validatedFields = CreateGroupSchema.safeParse({
    groupName: formData.get('groupName'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid form data.',
    };
  }

  const { groupName } = validatedFields.data;

  let newGroup;
  try {
    newGroup = await db.createGroup(groupName, user);
  } catch (error) {
    return {
      message: 'Failed to create group.',
    };
  }
  
  revalidatePath('/');
  redirect(`/groups/${newGroup.id}`);
}

// Schema for joining a group
const JoinGroupSchema = z.object({
  groupId: z.string(),
});

export async function joinGroup(prevState: any, formData: FormData) {
    const user = await getAuthenticatedUser();
    if (!user) return { message: 'You must be logged in to join a group.' };

    const validatedFields = JoinGroupSchema.safeParse({
        groupId: formData.get('groupId'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid form data.',
        };
    }

    const { groupId } = validatedFields.data;
    
    try {
        await db.addMemberToGroup(groupId, user);
    } catch(error) {
        return { message: 'Failed to join group.' };
    }

    revalidatePath(`/groups/${groupId}`);
    redirect(`/groups/${groupId}`);
}


// Schema for adding an expense
const AddExpenseSchema = z.object({
    description: z.string().min(1, 'Description is required.'),
    amount: z.coerce.number().positive('Amount must be positive.'),
    paidById: z.string(),
    groupId: z.string(),
});

const calculateSplits = (formData: FormData, totalAmountCents: number, members: User[]): Split[] => {
    const splits: Split[] = [];
    const splitType = formData.get('splitType');

    const distributeAmount = (memberIds: string[]) => {
        const memberCount = memberIds.length;
        if (memberCount === 0) {
            return;
        }
        const share = Math.floor(totalAmountCents / memberCount);
        let remainder = totalAmountCents % memberCount;

        for(const memberId of memberIds) {
            let memberShare = share;
            if (remainder > 0) {
                memberShare++;
                remainder--;
            }
            splits.push({ memberId: memberId, amount: memberShare });
        }
    };
    
    if (splitType === 'equally') {
        distributeAmount(members.map(m => m.id));
    } else if (splitType === 'unequally') {
        const selectedMembers = formData.getAll('selectedMembers') as string[];
        if (selectedMembers.length === 0) {
            throw new Error('You must select at least one person to split the expense with.');
        }
        distributeAmount(selectedMembers);
        members.forEach(member => {
            if (!selectedMembers.includes(member.id)) {
                splits.push({ memberId: member.id, amount: 0 });
            }
        });
    } else if (splitType === 'custom') {
        for (const member of members) {
            const splitAmount = formData.get(`split-${member.id}`);
            const splitAmountCents = Math.round(Number(splitAmount || 0) * 100);
            splits.push({ memberId: member.id, amount: splitAmountCents });
        }
    } else {
        throw new Error('Invalid split type.');
    }

    const splitTotal = splits.reduce((acc, s) => acc + s.amount, 0);

    if (Math.abs(splitTotal - totalAmountCents) > 1) { 
        throw new Error(`Splits total (${formatCurrency(splitTotal / 100)}) does not match the expense amount (${formatCurrency(totalAmountCents/100)}).`);
    }

    return splits;
};

export async function addExpense(prevState: any, formData: FormData) {
    const user = await getAuthenticatedUser();
    if (!user) return { message: 'Authentication required.', success: false };

    const validatedFields = AddExpenseSchema.safeParse({
        description: formData.get('description'),
        amount: formData.get('amount'),
        paidById: formData.get('paidById'),
        groupId: formData.get('groupId'),
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, message: 'Invalid expense data.', success: false };
    }
    
    const group = await db.getGroupById(validatedFields.data.groupId);
    if (!group) return { message: 'Group not found.', success: false };

    try {
        const totalAmountCents = Math.round(validatedFields.data.amount * 100);
        const splits = calculateSplits(formData, totalAmountCents, group.members);
        
        await db.addExpenseToGroup(validatedFields.data.groupId, {
            description: validatedFields.data.description,
            amount: totalAmountCents,
            paidById: validatedFields.data.paidById,
            authorId: user.id,
            splits,
        });

        revalidatePath(`/groups/${validatedFields.data.groupId}`);
        return { message: 'Expense added successfully.', success: true };
    } catch(e: any) {
        return { message: e.message || 'Failed to add expense.', success: false };
    }
}

export async function editExpense(prevState: any, formData: FormData) {
    const user = await getAuthenticatedUser();
    if (!user) return { message: 'Authentication required.', success: false };

    const expenseId = formData.get('expenseId') as string;
    const validatedFields = AddExpenseSchema.safeParse({
        description: formData.get('description'),
        amount: formData.get('amount'),
        paidById: formData.get('paidById'),
        groupId: formData.get('groupId'),
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, message: 'Invalid expense data.', success: false };
    }

    const group = await db.getGroupById(validatedFields.data.groupId);
    if (!group) return { message: 'Group not found.', success: false };
    
    const expense = group.expenses.find(e => e.id === expenseId);
    if (!expense || expense.authorId !== user.id) {
        return { message: 'Expense not found or you do not have permission to edit it.', success: false };
    }

    try {
        const totalAmountCents = Math.round(validatedFields.data.amount * 100);
        const splits = calculateSplits(formData, totalAmountCents, group.members);

        const updatedExpense: Expense = {
            ...expense,
            description: validatedFields.data.description,
            amount: totalAmountCents,
            paidById: validatedFields.data.paidById,
            splits: splits
        };

        await db.updateExpenseInGroup(validatedFields.data.groupId, updatedExpense);

        revalidatePath(`/groups/${validatedFields.data.groupId}`);
        return { message: 'Expense updated successfully.', success: true };

    } catch (e: any) {
        return { message: e.message || 'Failed to update expense.', success: false };
    }
}


export async function deleteExpense(formData: FormData) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Authentication required.');

    const groupId = formData.get('groupId') as string;
    const expenseId = formData.get('expenseId') as string;

    await db.deleteExpenseFromGroup(groupId, expenseId, user.id);
    revalidatePath(`/groups/${groupId}`);
}

const AddCommentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty.'),
  groupId: z.string(),
  expenseId: z.string(),
});

export async function addComment(prevState: any, formData: FormData) {
    const user = await getAuthenticatedUser();
    if (!user) return { message: 'Authentication required.', success: false };

    const validatedFields = AddCommentSchema.safeParse({
        comment: formData.get('comment'),
        groupId: formData.get('groupId'),
        expenseId: formData.get('expenseId'),
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, message: 'Invalid comment data.', success: false };
    }

    try {
        const { comment, groupId, expenseId } = validatedFields.data;
        const newComment: Comment = {
            id: uuidv4(),
            authorId: user.id,
            authorName: user.name,
            text: comment,
            createdAt: new Date().toISOString(),
        }
        await db.addCommentToExpense(groupId, expenseId, newComment);
        revalidatePath(`/groups/${groupId}`);
        return { message: 'Comment added.', success: true };
    } catch (e: any) {
        return { message: e.message || 'Failed to add comment.', success: false };
    }
}


function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
}
