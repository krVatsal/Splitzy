'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { loginOrRegister } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const initialState = {
  message: null,
  errors: {},
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing in...' : 'Sign In'}
    </Button>
  );
}

export function LoginForm() {
  const [state, dispatch] = useFormState(loginOrRegister, initialState);

  return (
    <form action={dispatch} className="space-y-6">
       <div className="space-y-2">
        <Label htmlFor="name">Your Name</Label>
        <Input id="name" name="name" placeholder="e.g., Alice" required aria-describedby="name-error" />
        <div id="name-error" aria-live="polite" aria-atomic="true">
            {state?.errors?.name && <p className="text-sm font-medium text-destructive">{state.errors.name[0]}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" required aria-describedby="email-error"/>
         <div id="email-error" aria-live="polite" aria-atomic="true">
            {state?.errors?.email && <p className="text-sm font-medium text-destructive">{state.errors.email[0]}</p>}
        </div>
      </div>
      {state?.message && !state.errors && <p className="text-sm font-medium text-destructive">{state.message}</p>}
      <SubmitButton />
    </form>
  );
}
