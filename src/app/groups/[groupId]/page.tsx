import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { calculateBalances, simplifyDebts } from '@/lib/calculations';
import { GroupHeader } from '@/components/group/GroupHeader';
import { MemberList } from '@/components/group/MemberList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseList } from '@/components/group/ExpenseList';
import { BalanceSummary } from '@/components/group/BalanceSummary';
import { DebtSettlement } from '@/components/group/DebtSettlement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function GroupPage({ params }: { params: { groupId: string } }) {
  const group = await db.getGroupById(params.groupId);

  if (!group) {
    notFound();
  }
  
  const balances = calculateBalances(group);
  const simplifiedDebts = simplifyDebts(balances);

  return (
    <div className="space-y-8">
      <GroupHeader group={group} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="expenses" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="balances">Balances</TabsTrigger>
                    <TabsTrigger value="settle">Settle Up</TabsTrigger>
                </TabsList>
                <TabsContent value="expenses" className="mt-4">
                    <ExpenseList group={group} />
                </TabsContent>
                <TabsContent value="balances" className="mt-4">
                    <BalanceSummary balances={balances} />
                </TabsContent>
                <TabsContent value="settle" className="mt-4">
                    <DebtSettlement debts={simplifiedDebts} />
                </TabsContent>
            </Tabs>
        </div>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-headline">Group Members</CardTitle>
                </CardHeader>
                <CardContent>
                    <MemberList members={group.members} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
