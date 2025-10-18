'use client';

import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

export default function UserAvatar() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
    );
  }

  if (!user) {
    return (
      <Avatar>
        <AvatarFallback>
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar>
      <AvatarFallback>
        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
