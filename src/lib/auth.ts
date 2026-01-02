import { cookies } from 'next/headers';
import { db } from './db';
import type { User } from './types';

export async function getCurrentUser(): Promise<User | null> {
    const userEmail = cookies().get('user_email')?.value;
    if (!userEmail) {
        return null;
    }
    try {
        const user = await db.getUserByEmail(userEmail);
        return user;
    } catch (error) {
        console.error("Failed to fetch user", error);
        return null;
    }
}
