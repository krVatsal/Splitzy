'use server';

import { z } from 'zod';
import { db } from './db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Split } from './types';

// Schema for creating a group
const CreateGroupSchema = z.object({
  groupName: z.string().min(3, "Group name must be at least 3 characters."),
  yourName: z.string().min(2, "Your name must be at least 2 characters."),
});

export async function createGroup(prevState: any, formData: FormData) {
  const validatedFields = CreateGroupSchema.safeParse({
    groupName: formData.get('groupName'),
    yourName: formData.get('yourName'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid form data.',
    };
  }

  const { groupName, yourName } = validatedFields.data;

  let newGroup;
  try {
    newGroup = await db.createGroup(groupName, yourName);
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
  yourName: z.string().min(2, "Your name must be at least 2 characters."),
  groupId: z.string(),
});

export async function joinGroup(prevState: any, formData: FormData) {
    const validatedFields = JoinGroupSchema.safeParse({
        yourName: formData.get('yourName'),
        groupId: formData.get('groupId'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid form data.',
        };
    }

    const { yourName, groupId } = validatedFields.data;
    
    try {
        await db.addMemberToGroup(groupId, yourName);
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
            message: `Splits total (${formatCurrency(splitTotal)}) does not match the expense amount (${formatCurrency(totalAmountCents)}).`,
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

function formatCurrency(amountInCents: number) {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}
