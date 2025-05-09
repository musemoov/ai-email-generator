import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

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

/**
 * Supabase Admin 클라이언트 (서비스 역할 키 사용)
 * Admin API 호출이 필요한 작업에 사용합니다.
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '' // 서비스 역할 키로 더 높은 권한 작업 가능
);

/**
 * POST /api/signup
 * 
 * 안전한 가입 처리: Gmail 계정만 허용하고, IP당 한 번의 가입만 허용하며,
 * 새 사용자에게 3개의 크레딧을 부여합니다.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 클라이언트 IP 주소 가져오기
    const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
    
    // 2. 요청 본문에서 이메일과 비밀번호 파싱
    const { email, password } = await req.json();

    // 3. 이메일 도메인 검증: @gmail.com만 허용
    if (!email.endsWith('@gmail.com')) {
      return NextResponse.json(
        { error: "Only Gmail addresses are allowed" },
        { status: 400 }
      );
    }

    // 4. IP 주소로 중복 가입 확인
    const { data: existingIP, error: ipError } = await supabase
      .from('signup_logs')
      .select('*')
      .eq('ip_address', ip)
      .single();

    if (ipError && ipError.code !== 'PGRST116') { // PGRST116 = 결과 없음 (정상)
      console.error("IP 확인 오류:", ipError);
      return NextResponse.json(
        { error: "Failed to verify IP address" },
        { status: 500 }
      );
    }

    if (existingIP) {
      return NextResponse.json(
        { error: "Signup from this IP is already registered" },
        { status: 400 }
      );
    }

    // 5. 이메일 중복 가입 확인
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users.some(user => user.email === email);

    if (userExists) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // 6. 사용자 생성 (Admin API 사용)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // 이메일 확인 과정 없이 즉시 활성화
    });

    if (authError) {
      console.error("사용자 생성 오류:", authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // 7. 사용자에게 초기 크레딧 할당 (3개)
    const { error: creditError } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        credits: 3
      });

    if (creditError) {
      console.error("크레딧 초기화 오류:", creditError);
      // 오류 로깅만 하고 계속 진행 (사용자 생성은 성공함)
    }

    // 8. IP 주소 기록 (abuse 추적용)
    const { error: logError } = await supabase
      .from('signup_logs')
      .insert({
        ip_address: ip,
        email
      });

    if (logError) {
      console.error("IP 로그 저장 오류:", logError);
      // 오류 로깅만 하고 계속 진행
    }

    // 9. 성공 응답 반환
    return NextResponse.json({
      success: true,
      message: "User registered successfully with 3 credits",
      user: {
        id: userId,
        email: authData.user.email
      }
    });

  } catch (error: unknown) {
    console.error("회원가입 처리 오류:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
} 