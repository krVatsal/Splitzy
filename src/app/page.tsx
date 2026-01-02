import { db } from '@/lib/db';
import { GroupCard } from '@/components/GroupCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default async function Home() {
  const groups = await db.getGroups();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Your Groups</h1>
      {groups.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <CardHeader>
                <CardTitle className="text-xl font-headline">No groups yet!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-4 text-muted-foreground">Get started by creating a new group.</p>
                <Link href="/groups/create" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Group
                </Link>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
