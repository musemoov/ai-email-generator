"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ClickableProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Clickable({ children, className, onClick }: ClickableProps) {
  return (
    <div 
      className={cn(
        "cursor-pointer transition-transform duration-200 hover:transform hover:-translate-y-[1px]",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
} 