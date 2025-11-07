'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function FloatingActionButton() {
  const pathname = usePathname();

  // Only show on rating-related pages
  const showOnPages = ['/ratings', '/matches', '/invitations'];
  const shouldShow = showOnPages.some(page => pathname?.startsWith(page));

  if (!shouldShow) return null;

  return (
    <Link
      href="/matches/create"
      className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover-hover:hover:shadow-xl hover-hover:hover:scale-110 active:scale-95 transition-all group"
      aria-label="매치 생성"
    >
      <Plus className="w-6 h-6" strokeWidth={2.5} />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        매치 생성
      </span>
    </Link>
  );
}
