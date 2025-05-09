"use client";

import Link from 'next/link';
import { PenLine, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  currentSection: 'new' | 'vault';
}

export function MobileNav({ currentSection }: MobileNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-10">
      <div className="flex justify-around items-center h-16">
        <Link 
          href="/email-gen" 
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            currentSection === 'new' 
              ? "text-blue-600" 
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          <PenLine className="w-5 h-5 mb-1" />
          <span className="text-xs">New Email</span>
        </Link>
        
        <Link 
          href="/email-gen/vault" 
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            currentSection === 'vault' 
              ? "text-blue-600" 
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          <Archive className="w-5 h-5 mb-1" />
          <span className="text-xs">Vault</span>
        </Link>
      </div>
    </div>
  );
} 