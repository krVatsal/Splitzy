'use server';

import { z } from 'zod';
import { db } from './db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Split, User } from './types';
import { cookies } from 'next/headers';

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

export async function addExpense(prevState: any, formData: FormData) {
    const validatedFields = AddExpenseSchema.safeParse({
        description: formData.get('description'),
        amount: formData.get('amount'),
        paidById: formData.get('paidById'),
        groupId: formData.get('groupId'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid expense data.',
        };
    }
    
    const group = await db.getGroupById(validatedFields.data.groupId);
    if (!group) return { message: 'Group not found.' };

    const totalAmountCents = Math.round(validatedFields.data.amount * 100);
    const splits: Split[] = [];
    let splitTotal = 0;

    const splitType = formData.get('splitType');

    if(splitType === 'equally') {
        const memberCount = group.members.length;
        if (memberCount === 0) {
            return { message: 'Cannot split expense, no members in the group.' };
        }
        const share = Math.floor(totalAmountCents / memberCount);
        let remainder = totalAmountCents % memberCount;

        for(const member of group.members) {
            let memberShare = share;
            if (remainder > 0) {
                memberShare++;
                remainder--;
            }
            splits.push({ memberId: member.id, amount: memberShare });
        }
        splitTotal = splits.reduce((acc, s) => acc + s.amount, 0);

    } else { // Custom split
        for (const member of group.members) {
            const splitAmount = formData.get(`split-${member.id}`);
            const splitAmountCents = Math.round(Number(splitAmount || 0) * 100);
            splits.push({ memberId: member.id, amount: splitAmountCents });
            splitTotal += splitAmountCents;
        }
    }
    
    // Check if splits add up to the total amount
    if (Math.abs(splitTotal - totalAmountCents) > 1) { // Allow for small rounding differences
        return {
            message: `Splits total (${formatCurrency(splitTotal / 100)}) does not match the expense amount (${formatCurrency(totalAmountCents/100)}).`,
        };
    }

    try {
        await db.addExpenseToGroup(validatedFields.data.groupId, {
            description: validatedFields.data.description,
            amount: totalAmountCents,
            paidById: validatedFields.data.paidById,
            splits,
        });
    } catch(e) {
        return { message: 'Failed to add expense.' };
    }

    revalidatePath(`/groups/${validatedFields.data.groupId}`);
    return { message: 'Expense added successfully.', success: true };
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}
