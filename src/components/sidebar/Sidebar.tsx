"use client";

import React from 'react';
import Link from 'next/link';
import { PenLine, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmailHistory } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface SidebarProps {
  currentSection: 'new' | 'vault';
  emailHistory?: EmailHistory[];
}

export function Sidebar({ currentSection, emailHistory = [] }: SidebarProps) {
  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // 프롬프트 텍스트 줄이기 함수
  const truncatePrompt = (prompt: string) => {
    return prompt.length > 25 ? `${prompt.substring(0, 25)}...` : prompt;
  };

  return (
    <aside className="min-w-[200px] w-48 h-screen bg-gray-50 border-r border-gray-200 p-4 hidden md:block">
      <div className="flex flex-col space-y-1">
        <Link 
          href="/email-gen" 
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
            currentSection === 'new' 
              ? "bg-blue-100 text-blue-800" 
              : "hover:bg-gray-200 text-gray-700"
          )}
        >
          <PenLine className="w-4 h-4" />
          <span>New Email</span>
        </Link>
        
        <Link 
          href="/email-gen/vault" 
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
            currentSection === 'vault' 
              ? "bg-blue-100 text-blue-800" 
              : "hover:bg-gray-200 text-gray-700"
          )}
        >
          <Archive className="w-4 h-4" />
          <span>Vault</span>
        </Link>
      </div>
      
      {currentSection === 'vault' && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Saved Emails</h3>
          <div className="space-y-1">
            {emailHistory.length === 0 ? (
              <div className="text-xs text-gray-400 italic">
                Your saved emails will appear here
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-1">
                {emailHistory.map((email) => (
                  <Link 
                    key={email.id} 
                    href={`/email-gen/vault?id=${email.id}`}
                    className="flex flex-col py-2 px-1 text-sm hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <span className="text-gray-800">{truncatePrompt(email.prompt)}</span>
                    <span className="text-xs text-gray-500 mt-1">{formatDate(email.created_at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
} 