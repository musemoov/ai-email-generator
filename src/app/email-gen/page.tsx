"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { NavLink } from "@/components/ui/nav-link";
import { Clickable } from "@/components/ui/clickable";
import { samplePrompts } from "@/data/samplePrompts";
import { LoadingSpinner, LoadingDots } from "@/components/ui/loading-spinner";
import toast from "react-hot-toast";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import { saveEmailToVault } from "@/lib/email-service";
import { supabase } from "@/lib/supabaseClient";

// 에러 타입 인터페이스 정의
interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}

export default function EmailGenPage() {
  const { signOut } = useAuth();
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<{
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEmailSaved, setIsEmailSaved] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserEmail(user.email);
        
        // 사용자 크레딧 정보 가져오기
        const { data, error } = await supabase
          .from("user_credits")
          .select("credits")
          .eq("user_id", user.id)
          .single();
          
        if (!error && data) {
          setRemainingCredits(data.credits);
        }
      }
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    setIsLogoutLoading(true);
    await signOut();
    setIsLogoutLoading(false);
  };

  const handleGenerateEmail = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt for your email");
      return;
    }

    try {
      // 상태 초기화
      setIsGenerating(true);
      setGeneratedEmail("");
      setUsedModel(null);
      setTokenUsage(null);
      setIsEmailSaved(false);
      
      // 세션 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || null;
      
      // API 요청
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt,
          authToken 
        }),
      });

      const data = await response.json();

      // 응답 처리
      if (!response.ok) {
        // 크레딧 부족 오류 처리
        if (response.status === 403 && data.error === "No remaining credits") {
          toast.error("You have used all your credits. Please contact support to get more.");
          setRemainingCredits(0);
          throw new Error(data.message || "No remaining credits");
        }
        
        // 다른 오류 처리
        if (response.status === 500 && data.error?.includes("API key")) {
          throw new Error(`${data.error}. ${data.details || ''}`);
        } else if (response.status === 401) {
          throw new Error(`${data.error}. ${data.details || ''}`);
        } else {
          throw new Error(data.error || "Failed to generate email");
        }
      }

      // 결과 설정
      setGeneratedEmail(data.email);
      setUsedModel(data.model);
      
      // 남은 크레딧 업데이트
      if (data.credits_remaining !== undefined) {
        setRemainingCredits(data.credits_remaining);
      }
      
      // 토큰 사용량 업데이트
      if (data.usage) {
        setTokenUsage({
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        });
      }
      
      // 저장 상태 업데이트
      setIsEmailSaved(data.saved || false);
      if (data.saved) {
        toast.success("Email saved to your vault");
      } else if (data.message) {
        if (data.message === "User not authenticated") {
          toast("Login to save emails to your vault");
        } else {
          toast(data.message);
        }
      }
      
      // 결과 화면으로 스크롤
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error: unknown) {
      console.error("Client error generating email:", error);
      toast.error(getErrorMessage(error) || 'Failed to generate email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSamplePromptClick = (promptText: string) => {
    setPrompt(promptText);
  };

  const handleSaveEmail = async () => {
    // Return early if no email is generated or already saving or already saved
    if (!generatedEmail || isSaving || isEmailSaved) return;
    
    try {
      setIsSaving(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to save emails");
        return;
      }
      
      const success = await saveEmailToVault(user.id, prompt, generatedEmail);
      
      if (success) {
        setIsEmailSaved(true);
        toast.success("Email saved to your vault");
      } else {
        toast.error("Failed to save email");
      }
    } catch (error) {
      console.error("Error saving email:", error);
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar currentSection="new" emailHistory={[]} />
      
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap">Logged in as: {userEmail}</span>
                  {remainingCredits !== null && (
                    <span className={`text-xs md:text-sm font-medium px-2 py-1 rounded-full ${
                      remainingCredits > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {remainingCredits} credit{remainingCredits !== 1 ? 's' : ''} left
                    </span>
                  )}
                </div>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Email Generator</h1>
            <p className="text-lg text-gray-600">
              Let me write email for you. Eliminate stress and craft professional email in seconds.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <Card className="p-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Tell us about your email</h2>
                  <Textarea 
                    placeholder="Explain the purpose of your email here…" 
                    className="h-80 resize-none border-gray-200"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                  />
                  <div className="flex justify-center mt-4">
                    <Button 
                      className="bg-[#FF5474] hover:bg-[#ff3c62] text-white px-6 py-2 rounded-full"
                      onClick={handleGenerateEmail}
                      disabled={!prompt.trim() || isGenerating || remainingCredits === 0}
                      title={remainingCredits === 0 ? "No credits remaining" : ""}
                    >
                      {isGenerating ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" color="text-white" />
                          <span>Generating...</span>
                        </div>
                      ) : remainingCredits === 0 ? (
                        <div className="flex items-center gap-2">
                          <span>No Credits Left</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Generate Email</span>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16.01 11H4V13H16.01V16L20 12L16.01 8V11Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                      )}
                    </Button>
                  </div>
                  {remainingCredits === 0 && (
                    <div className="mt-3 text-center text-sm text-red-600">
                      You have used all your credits. Please contact support to get more.
                    </div>
                  )}
                </div>
                <div ref={resultRef}>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold">Email result</h2>
                    {generatedEmail && (
                      isEmailSaved ? (
                        <div className="flex items-center text-green-600 text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>저장됨</span>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-sm"
                          onClick={handleSaveEmail}
                          disabled={isSaving || !generatedEmail}
                        >
                          {isSaving ? "Saving..." : "Save to Vault"}
                        </Button>
                      )
                    )}
                  </div>
                  <div className="bg-gray-50 h-80 rounded-md p-4 text-gray-700 overflow-y-auto">
                    {isGenerating ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="text-center">
                          <LoadingDots />
                          <p className="text-gray-500 mt-2">Generating your email...</p>
                        </div>
                      </div>
                    ) : generatedEmail ? (
                      <div>
                        <div className="whitespace-pre-line">{generatedEmail}</div>
                        <div className="mt-4 text-xs text-gray-400">
                          {usedModel && (
                            <div>Generated with: {usedModel}</div>
                          )}
                          {tokenUsage && (
                            <div className="mt-1">
                              Tokens: {tokenUsage.promptTokens} prompt + {tokenUsage.completionTokens} completion = {tokenUsage.totalTokens} total
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-full text-gray-400">
                        Your AI-generated email will appear here
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
              {samplePrompts.map((prompt) => (
                <Clickable key={prompt.id} onClick={() => handleSamplePromptClick(prompt.text)}>
                  <Card className="p-4 border border-gray-200 hover:shadow-md transition-shadow min-h-[6rem] flex items-center justify-center">
                    <p className="text-sm text-center">{prompt.text}</p>
                  </Card>
                </Clickable>
              ))}
            </div>
          </div>
        </main>
        
        {/* 모바일 하단 내비게이션 */}
        <MobileNav currentSection="new" />
      </div>
    </div>
  );
} 