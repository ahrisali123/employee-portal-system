'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.activeRole === 'ADMIN') {
      router.replace('/tickets');
    } else {
      router.replace('/my-tickets');
    }
  }, [user, loading, router]);

  return null;
}
