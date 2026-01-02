import type { Balance } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, TrendingDown, CircleEqual } from 'lucide-react';

export function BalanceSummary({ balances }: { balances: Balance[] }) {
  const sortedBalances = [...balances].sort((a,b) => b.balance - a.balance);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Balance Summary</CardTitle>
        <CardDescription>Who's up and who's down in the group.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {sortedBalances.map((item) => (
            <li key={item.memberId} className="flex items-center justify-between rounded-md border p-4 hover:bg-accent/50">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={item.avatarUrl} alt={item.name} data-ai-hint="person face" />
                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg ${item.balance > 0 ? 'text-green-600' : item.balance < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {item.balance > 0 ? '+' : ''}{formatCurrency(item.balance)}
                </p>
                <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                  {item.balance > 10 ? <><TrendingUp className="h-4 w-4 text-green-600"/>is owed</> : item.balance < -10 ? <><TrendingDown className="h-4 w-4 text-red-600"/>owes</> : <><CircleEqual className="h-4 w-4"/>settled</>}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
