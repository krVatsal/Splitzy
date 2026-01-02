import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { JoinGroupForm } from '@/components/JoinGroupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function JoinGroupPage({ params }: { params: { inviteCode: string } }) {
  const group = await db.getGroupByInviteCode(params.inviteCode.toUpperCase());
  
  if (!group) {
    return (
        <div className="mx-auto max-w-md text-center">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-destructive">Invalid Invite Code</CardTitle>
                    <CardDescription>The invite code you used is not valid or has expired.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Join Group</CardTitle>
          <CardDescription>You're invited to join</CardDescription>
          <p className="font-bold text-xl pt-2 text-primary font-headline">{group.name}</p>
        </CardHeader>
        <CardContent>
          <JoinGroupForm groupId={group.id} />
        </CardContent>
      </Card>
    </div>
  );
}
