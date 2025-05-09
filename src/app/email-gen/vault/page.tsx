"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import Image from "next/image";
import { NavLink } from "@/components/ui/nav-link";
import { EmailHistoryItem } from "@/components/EmailHistoryItem";
import { fetchEmailHistory } from "@/lib/email-service";
import { EmailHistory } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function VaultPage() {
  const { signOut } = useAuth();
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailHistory | null>(null);
  const [isLoadingEmails, setIsLoadingEmails] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    loadEmailHistory();
    
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserEmail(user.email);
      }
    };
    getUserEmail();
  }, []);

  const loadEmailHistory = async () => {
    try {
      setIsLoadingEmails(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to view your vault");
        return;
      }
      
      const history = await fetchEmailHistory(user.id);
      setEmailHistory(history);
      
      // Set the first email as selected if available
      if (history.length > 0) {
        setSelectedEmail(history[0]);
      }
    } catch (error) {
      console.error("Error loading email history:", error);
      toast.error("Failed to load your saved emails");
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const handleLogout = async () => {
    setIsLogoutLoading(true);
    await signOut();
    setIsLogoutLoading(false);
  };
  
  const handleSelectEmail = (email: EmailHistory) => {
    setSelectedEmail(email);
  };
  
  const handleDeleteEmail = (id: string) => {
    setEmailHistory(prev => prev.filter(email => email.id !== id));
    
    // If the deleted email was selected, select another one
    if (selectedEmail?.id === id) {
      const nextEmail = emailHistory.find(email => email.id !== id);
      setSelectedEmail(nextEmail || null);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar currentSection="vault" emailHistory={emailHistory} />
      
      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-200">
          <div className="container flex flex-wrap md:flex-nowrap justify-between items-center py-3 px-4 md:px-6 gap-2">
            <div className="flex items-center whitespace-nowrap gap-2">
              <Image 
                src="/mailmeteor-logo.svg" 
                alt="AI-Email-Gen Logo" 
                width={40} 
                height={40}
              />
              <span className="text-lg font-bold">AI-Email-Gen</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <NavLink hasDropdown={true}>Product</NavLink>
              <NavLink>Features</NavLink>
              <NavLink>Resources</NavLink>
              <NavLink>Pricing</NavLink>
            </nav>
            <div className="flex flex-wrap items-center ml-auto gap-2 md:gap-4">
              {userEmail && (
                <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap">Logged in as: {userEmail}</span>
              )}
              <Button 
                className="bg-[#FF5474] hover:bg-[#ff3c62] text-white font-bold text-xs md:text-sm py-1 px-2 md:px-4"
                onClick={handleLogout}
                disabled={isLogoutLoading}
              >
                {isLogoutLoading ? "LOGGING OUT..." : "LOG OUT"}
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto py-8 px-4 md:px-6 pb-20 md:pb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Email Vault</h1>
            <p className="text-lg text-gray-600">
              Access your saved emails and reuse them anytime
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <Card className="p-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 md:border-r md:border-gray-200 md:pr-4">
                  <h2 className="text-lg font-semibold mb-4">Saved Emails</h2>
                  
                  {isLoadingEmails ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : emailHistory.length > 0 ? (
                    <div className="max-h-[500px] overflow-y-auto">
                      {emailHistory.map(item => (
                        <EmailHistoryItem
                          key={item.id}
                          item={item}
                          onSelect={handleSelectEmail}
                          onDelete={handleDeleteEmail}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No saved emails yet</p>
                      <p className="text-sm mt-2">Generate and save emails to see them here</p>
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <h2 className="text-lg font-semibold mb-4">Email Content</h2>
                  
                  {selectedEmail ? (
                    <div>
                      <div className="bg-gray-50 rounded-md p-4 mb-4">
                        <h3 className="font-medium text-gray-800 mb-2">Prompt:</h3>
                        <p className="text-gray-700">{selectedEmail.prompt}</p>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-md p-4 min-h-[300px]">
                        <div className="whitespace-pre-line">{selectedEmail.email}</div>
                      </div>
                      
                      <div className="flex justify-center md:justify-end mt-4">
                        <Button
                          className="text-sm bg-[#FF5474] hover:bg-[#ff3c62] text-white font-bold"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedEmail.email);
                            toast.success('Email copied to clipboard');
                          }}
                        >
                          Copy to Clipboard
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-[400px] text-gray-500">
                      {emailHistory.length > 0 
                        ? "Select an email from the list to view its content"
                        : "Save emails to view them here"
                      }
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </main>
        
        {/* 모바일 하단 내비게이션 */}
        <MobileNav currentSection="vault" />
      </div>
    </div>
  );
} 