"use client";

import { useState } from 'react';
import { EmailHistory } from '@/types';
import { Button } from '@/components/ui/button';
import { Trash, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { deleteEmailFromVault } from '@/lib/email-service';
import toast from 'react-hot-toast';
import { Clickable } from './ui/clickable';

interface EmailHistoryItemProps {
  item: EmailHistory;
  onSelect: (item: EmailHistory) => void;
  onDelete: (id: string) => void;
}

export function EmailHistoryItem({ item, onSelect, onDelete }: EmailHistoryItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const truncatePrompt = (prompt: string) => {
    return prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt;
  };
  
  const formattedDate = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
  
  const handleCopy = () => {
    navigator.clipboard.writeText(item.email);
    toast.success('Email copied to clipboard');
  };
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteEmailFromVault(item.id);
      onDelete(item.id);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <Clickable onClick={() => onSelect(item)}>
        <div className="flex flex-col cursor-pointer hover:bg-gray-50 p-2 rounded-md">
          <div className="font-medium text-sm text-gray-800">
            {truncatePrompt(item.prompt)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formattedDate}
          </div>
        </div>
      </Clickable>
      <div className="flex items-center justify-end mt-1 gap-1">
        <Button 
          variant="ghost" 
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleCopy}
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-6 w-6 p-0 text-red-500"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
} 