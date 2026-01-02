import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, HandCoins } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-card shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <HandCoins className="h-7 w-7" />
            <span className="font-headline">Splitzy</span>
          </Link>
          <Button asChild>
            <Link href="/groups/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Group
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
