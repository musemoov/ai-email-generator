import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';

// 로깅 유틸리티 함수 추가
const logInfo = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(message, data);
  }
};

const logError = (message: string, error?: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(message, error);
  }
};

// OpenAI API 키 로깅 (개발 환경에서만)
if (process.env.NODE_ENV === "development") {
  if (process.env.OPENAI_API_KEY) {
    const maskedKey = `${process.env.OPENAI_API_KEY.substring(0, 3)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4)}`;
    logInfo(`OPENAI_API_KEY loaded: ${maskedKey}`);
  } else {
    logError("OPENAI_API_KEY is not defined in environment variables.");
    logInfo("Please check your .env.local file at the project root.");
  }
}

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",  // 빈 문자열로 fallback (undefined 방지)
});

// 기본 Supabase 클라이언트 (인증 없음)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 에러 타입 인터페이스 정의
interface ErrorWithMessage {
  message: string;
}

interface OpenAIError {
  status?: number;
  message?: string;
  code?: string;
  type?: string;
  headers?: Record<string, string>;
  cause?: unknown;
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

/**
 * POST /api/generate-email
 * 
 * 입력 프롬프트를 기반으로 이메일을 생성하고, 인증된 사용자의 경우 결과를 저장하고 크레딧을 차감합니다.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      logError("OPENAI_API_KEY is not defined in environment variables.");
      return NextResponse.json(
        { 
          error: "OpenAI API key is not configured",
          details: "Please add OPENAI_API_KEY to your .env.local file"
        },
        { status: 500 }
      );
    }

    // 2. 요청 본문 파싱
    const { prompt, authToken } = await req.json();

    // 3. 프롬프트 유효성 검사
    if (!prompt || prompt.trim() === "") {
      return NextResponse.json(
        { error: "A prompt is required" },
        { status: 400 }
      );
    }

    // 4. 인증된 Supabase 클라이언트 생성 (토큰이 제공된 경우)
    const authenticatedSupabase = authToken ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      }
    ) : supabase;

    // 5. 이메일 생성 시도
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional email assistant. Write clear, polite, well-formatted emails based on user requests."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      const generatedContent = completion.choices[0].message.content;
      
      // 6. 토큰 사용량 로깅
      if (completion.usage) {
        logInfo("Token usage:", {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        });
      }

      // 7. 사용자 인증 및 크레딧 처리
      let saved = false;
      let message = null;
      let creditsRemaining = null;
      
      try {
        // 7.1 사용자 인증 확인
        const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
        
        if (userError || !user) {
          message = "User not authenticated";
          logInfo("❌ User not authenticated, skipping email save");
          
          return NextResponse.json({ 
            email: generatedContent, 
            model: "gpt-3.5-turbo",
            usage: completion.usage,
            saved: false,
            message: message
          });
        }
        
        // 민감 정보 마스킹 처리하여 로깅
        if (user?.email) {
          const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
          logInfo(`✅ User authenticated: ${maskedEmail}`);
        }
        
        // 7.2 사용자 크레딧 확인
        const { data: creditData, error: creditError } = await authenticatedSupabase
          .from("user_credits")
          .select("credits")
          .eq("user_id", user.id)
          .single();
          
        if (creditError) {
          logError("Error checking user credits:", creditError?.message || creditError);
          message = "Failed to check user credits";
          return NextResponse.json({ 
            email: generatedContent, 
            model: "gpt-3.5-turbo",
            usage: completion.usage,
            saved: false,
            message: message
          });
        }
        
        // 7.3 크레딧 부족 확인
        if (!creditData || creditData.credits <= 0) {
          message = "You have used all your credits";
          // 마스킹 처리
          if (user?.email) {
            const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
            logInfo(`❌ User has no remaining credits: ${maskedEmail}`);
          }
          return NextResponse.json({ 
            error: "No remaining credits",
            message: "You have used all your credits"
          }, { status: 403 });
        }
        
        // 7.4 크레딧 차감 (1개)
        const { error: updateError } = await authenticatedSupabase
          .from("user_credits")
          .update({ credits: creditData.credits - 1 })
          .eq("user_id", user.id);
          
        if (updateError) {
          logError("Error updating user credits:", updateError?.message || updateError);
          message = "Failed to update user credits";
        } else {
          logInfo(`✅ User credit updated: ${creditData.credits} -> ${creditData.credits - 1}`);
          creditsRemaining = creditData.credits - 1;
        }
        
        // 7.5 이메일 저장
        const { error: insertError } = await authenticatedSupabase
          .from("email_history")
          .insert({
            user_id: user.id,
            prompt,
            email: generatedContent,
          });
        
        if (insertError) {
          logError("Error saving email to Supabase:", insertError?.message || insertError);
          message = "Failed to save email";
        } else {
          saved = true;
          logInfo("Email saved to Supabase successfully");
        }

        // 7.6 응답 반환
        return NextResponse.json({ 
          email: generatedContent, 
          model: "gpt-3.5-turbo",
          usage: completion.usage,
          saved,
          message: message,
          credits_remaining: creditsRemaining
        });
        
      } catch (saveError) {
        // 저장 과정 오류 처리
        logError("Error during save to Supabase:", saveError instanceof Error ? saveError.message : saveError);
        message = "Error processing save request";
        
        return NextResponse.json({ 
          email: generatedContent, 
          model: "gpt-3.5-turbo",
          usage: completion.usage,
          saved: false,
          message: message
        });
      }
    } catch (openAIError: unknown) {
      if (typeof openAIError === 'object' && openAIError !== null && 'status' in openAIError) {
        const err = openAIError as OpenAIError;
        if (err.status === 401 || err.message?.includes("API key")) {
          logError("OpenAI API Key Authentication Error:", {
            message: err.message,
            status: err.status,
          });
          return NextResponse.json(
            { 
              error: "Invalid or expired OpenAI API key",
              details: "Please check your API key in .env.local"
            },
            { status: 401 }
          );
        }
        // 기타 상세한 오류 로깅
        logError("OpenAI API Error:", {
          message: err.message,
          status: err.status,
          code: err.code,
          type: err.type,
          headers: err.headers,
          cause: err.cause,
        });
        // 적절한 상태 코드와 메시지로 응답
        const status = err.status || 500;
        const errorMessage = err.message || "Failed to generate email with OpenAI";
        return NextResponse.json(
          { 
            error: errorMessage,
            type: err.type,
            code: err.code
          },
          { status }
        );
      } else {
        // 기타 에러 처리
        return NextResponse.json(
          { 
            error: 'Failed to generate email with OpenAI',
            details: String(openAIError)
          },
          { status: 500 }
        );
      }
    }
  } catch (generalError: unknown) {
    // 9. 일반적인 요청 처리 오류
    logError("❌ Email generation or saving failed:", generalError);
    
    return NextResponse.json(
      { 
        error: 'Failed to process email generation request',
        details: getErrorMessage(generalError)
      },
      { status: 500 }
    );
  }
} 