"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Email storage utility function
  const saveEmailToLocalStorage = (email: string) => {
    localStorage.setItem("userEmail", email);
  };

  // Get saved email
  const getSavedEmail = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userEmail");
    }
    return null;
  };

  // Sign in with email and password
  const signInWithEmail = async (
    email: string,
    password: string,
    rememberEmail: boolean
  ) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      if (rememberEmail) {
        saveEmailToLocalStorage(email);
      }

      toast.success("Logged in successfully!");
      router.push("/email-gen");
      return { success: true, data };
    } catch (error: unknown) {
      toast.error("An error occurred while logging in.");
      return { success: false, error: getErrorMessage(error) };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUpWithEmail = async (
    email: string,
    password: string,
    rememberEmail: boolean
  ) => {
    try {
      setIsLoading(true);
      
      // 1. 커스텀 API를 통한 회원가입 처리 (/api/signup)
      // 이 API는 Gmail 계정 확인, IP 중복 검사, 크레딧 할당을 수행함
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();
      
      // 2. 오류 처리: 이미 가입한 이메일, IP 제한 등
      if (!response.ok) {
        toast.error(result.error || "Failed to register");
        return { success: false, error: result.error };
      }

      // 3. 이메일 저장 (사용자가 선택한 경우)
      if (rememberEmail) {
        saveEmailToLocalStorage(email);
      }

      // 4. 회원가입 성공 후 자동 로그인 시도
      // signInWithPassword를 사용하여 새로 생성된 계정으로 로그인
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // 5. 자동 로그인 실패 시 수동 로그인 페이지로 이동
      if (signInError) {
        toast.error("Account created but failed to login automatically. Please log in manually.");
        router.push("/login");
        return { success: true, data: result };
      }

      // 6. 성공 메시지 표시 및 이메일 생성 페이지로 이동
      toast.success(result.message || "Account created successfully!");
      router.push("/email-gen");
      return { success: true, data: signInData };
    } catch (error: unknown) {
      toast.error("An error occurred while creating your account.");
      return { success: false, error: getErrorMessage(error) };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out the user
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }
      
      toast.success("Logged out successfully!");
      router.push("/login");
      return { success: true };
    } catch (error: unknown) {
      toast.error("An error occurred while logging out.");
      return { success: false, error: getErrorMessage(error) };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    signInWithEmail,
    signUpWithEmail,
    getSavedEmail,
    signOut,
  };
} 