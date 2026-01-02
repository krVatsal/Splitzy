'use client';

import type { Group } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { InviteDialog } from './InviteDialog';
import { useState } from 'react';

export function GroupHeader({ group }: { group: Group }) {
  const [isInviteOpen, setInviteOpen] = useState(false);
  
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight font-headline">{group.name}</h1>
          <p className="text-muted-foreground">
            Created on {new Date(group.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Members
        </Button>
      </div>
      <InviteDialog group={group} isOpen={isInviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
}
