'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createGroup } from '@/lib/actions';
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
      {pending ? 'Creating Group...' : 'Create Group'}
    </Button>
  );
}

export function CreateGroupForm() {
  const [state, dispatch] = useFormState(createGroup, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message) {
        toast({
            variant: "destructive",
            title: "Error",
            description: state.message,
        });
    }
  }, [state, toast]);

  return (
    <form action={dispatch} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="groupName">Group Name</Label>
        <Input id="groupName" name="groupName" placeholder="e.g., Hawaii Trip" required aria-describedby="groupName-error" />
        <div id="groupName-error" aria-live="polite" aria-atomic="true">
            {state?.errors?.groupName && <p className="text-sm font-medium text-destructive">{state.errors.groupName[0]}</p>}
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
