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
            success: false,
        };
    }
    
    const group = await db.getGroupById(validatedFields.data.groupId);
    if (!group) return { message: 'Group not found.', success: false };

    const totalAmountCents = Math.round(validatedFields.data.amount * 100);
    const splits: Split[] = [];
    let splitTotal = 0;

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
        distributeAmount(group.members.map(m => m.id));
    } else if (splitType === 'unequally') {
        const selectedMembers = formData.getAll('selectedMembers') as string[];
        if (selectedMembers.length === 0) {
            return { message: 'You must select at least one person to split the expense with.', success: false };
        }
        distributeAmount(selectedMembers);
        // For members not selected, their split is 0
        group.members.forEach(member => {
            if (!selectedMembers.includes(member.id)) {
                splits.push({ memberId: member.id, amount: 0 });
            }
        });
    } else if (splitType === 'custom') {
        for (const member of group.members) {
            const splitAmount = formData.get(`split-${member.id}`);
            const splitAmountCents = Math.round(Number(splitAmount || 0) * 100);
            splits.push({ memberId: member.id, amount: splitAmountCents });
        }
    } else {
        return { message: 'Invalid split type.', success: false };
    }
    
    splitTotal = splits.reduce((acc, s) => acc + s.amount, 0);

    // Check if splits add up to the total amount
    if (Math.abs(splitTotal - totalAmountCents) > 1) { // Allow for small rounding differences
        return {
            message: `Splits total (${formatCurrency(splitTotal / 100)}) does not match the expense amount (${formatCurrency(totalAmountCents/100)}).`,
            success: false,
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
        return { message: 'Failed to add expense.', success: false };
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
