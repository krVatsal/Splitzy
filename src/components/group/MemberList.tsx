import type { Member } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function MemberList({ members }: { members: Member[] }) {
  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="person face" />
              <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{member.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
