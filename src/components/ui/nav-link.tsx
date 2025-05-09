"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href?: string;
  className?: string;
  children: React.ReactNode;
  hasDropdown?: boolean;
  onClick?: () => void;
}

export function NavLink({
  href,
  className,
  children,
  hasDropdown = false,
  onClick,
}: NavLinkProps) {
  const baseClasses = 
    "font-medium text-base text-slate-800 px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 hover:transform hover:-translate-y-[1px]";

  if (href) {
    return (
      <Link 
        href={href} 
        className={cn(baseClasses, className)}
        onClick={onClick}
      >
        <div className="flex items-center">
          {children}
          {hasDropdown && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="inline ml-1"
            >
              <path
                d="M6 9L1.5 4.5L2.55 3.45L6 6.9L9.45 3.45L10.5 4.5L6 9Z"
                fill="currentColor"
              />
            </svg>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div 
      className={cn(baseClasses, className)}
      onClick={onClick}
    >
      <div className="flex items-center">
        {children}
        {hasDropdown && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="inline ml-1"
          >
            <path
              d="M6 9L1.5 4.5L2.55 3.45L6 6.9L9.45 3.45L10.5 4.5L6 9Z"
              fill="currentColor"
            />
          </svg>
        )}
      </div>
    </div>
  );
} 