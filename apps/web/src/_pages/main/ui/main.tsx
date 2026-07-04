import React from 'react';
import Link from 'next/link';
import { pathKey } from '@/shared/router';

export function MainPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <h1 className="text-3xl font-bold">Main Page</h1>
      <Link href={pathKey.example} className="text-blue-500 hover:underline">
        Go to Example Page
      </Link>
    </div>
  );
}
