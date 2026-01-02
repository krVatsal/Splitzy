import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import type { Group } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';

export function GroupCard({ group }: { group: Group }) {
  const totalExpenses = group.expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <Link href={`/groups/${group.id}`} className="block">
      <Card className="h-full transition-shadow duration-300 hover:shadow-lg hover:border-primary">
        <CardHeader>
          <CardTitle className="truncate font-headline">{group.name}</CardTitle>
          <CardDescription>
            {new Date(group.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex -space-x-2 overflow-hidden">
            {group.members.slice(0, 5).map((member) => (
              <Avatar key={member.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="person face" />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {group.members.length > 5 && (
              <Avatar className="relative flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-background">
                <AvatarFallback>+{group.members.length - 5}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{group.members.length} member{group.members.length > 1 ? 's' : ''}</span>
            </div>
            <span className="font-semibold text-foreground">{formatCurrency(totalExpenses)} total</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
