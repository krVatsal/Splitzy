import { CreateGroupForm } from '@/components/CreateGroupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateGroupPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Create a New Group</CardTitle>
          <CardDescription>
            Give your group a name and add yourself as the first member. You can invite others later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateGroupForm />
        </CardContent>
      </Card>
    </div>
  );
}
