import type { SimplifiedDebt } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Handshake } from 'lucide-react';

export function DebtSettlement({ debts }: { debts: SimplifiedDebt[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Settle Up</CardTitle>
        <CardDescription>The simplest way for everyone to get even.</CardDescription>
      </CardHeader>
      <CardContent>
        {debts.length > 0 ? (
          <ul className="space-y-4">
            {debts.map((debt, index) => (
              <li key={index} className="flex items-center justify-between rounded-md border p-4 hover:bg-accent/50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 font-medium">
                  <span className="text-destructive">{debt.fromName}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  <span className="sm:hidden text-muted-foreground text-xs">pays</span>
                  <span className="text-green-600">{debt.toName}</span>
                </div>
                <div className="font-bold text-lg">{formatCurrency(debt.amount)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10 border-2 border-dashed rounded-lg">
            <Handshake className="h-12 w-12 text-green-500 mb-4" />
            <p className="font-semibold text-lg font-headline">All Settled Up!</p>
            <p className="text-muted-foreground">Everyone is even. Nothing to settle.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
