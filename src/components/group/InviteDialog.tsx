'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Group } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function InviteDialog({ group, isOpen, onOpenChange }: { group: Group, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInviteUrl(`${window.location.origin}/join/${group.inviteCode}`);
    }
  }, [group.inviteCode, isOpen]);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
        title: 'Copied to clipboard!',
        description: 'You can now share the link with others.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite members to {group.name}</DialogTitle>
          <DialogDescription>
            Share the code or link with others to let them join your group.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="invite-code">Invite Code</Label>
                <div className="flex items-center space-x-2">
                    <Input id="invite-code" value={group.inviteCode} readOnly className="font-mono text-center tracking-widest text-lg h-12" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="invite-link">Invite Link</Label>
                <div className="flex items-center space-x-2">
                    <Input id="invite-link" value={inviteUrl} readOnly />
                    <Button type="button" size="icon" onClick={() => copyToClipboard(inviteUrl)} variant="outline">
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
