'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { joinGroup } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const initialState = {
  message: null,
  errors: {},
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Joining...' : 'Join Group'}
    </Button>
  );
}

export function JoinGroupForm({ groupId }: { groupId: string }) {
  const [state, dispatch] = useFormState(joinGroup, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message && !state.errors) {
        toast({
            variant: "destructive",
            title: "Error",
            description: state.message,
        });
    }
  }, [state, toast]);

  return (
    <form action={dispatch} className="space-y-6">
      <input type="hidden" name="groupId" value={groupId} />
      <p className="text-sm text-center text-muted-foreground">You will be added to this group.</p>
      <SubmitButton />
    </form>
  );
}
