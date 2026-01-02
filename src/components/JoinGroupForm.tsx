'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { joinGroup } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <div className="space-y-2">
        <Label htmlFor="yourName">Your Name</Label>
        <Input id="yourName" name="yourName" placeholder="Enter your name" required aria-describedby="yourName-error" />
        <div id="yourName-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.yourName && <p className="text-sm font-medium text-destructive">{state.errors.yourName[0]}</p>}
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
