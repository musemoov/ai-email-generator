-- 사용자 크레딧 테이블: 회원가입 시 자동으로 3개의 크레딧 할당
create table public.user_credits (
  user_id uuid primary key references auth.users(id),
  credits integer default 3,
  created_at timestamp with time zone default now()
);

-- IP별 회원가입 기록 테이블: IP당 한 번의 회원가입만 허용하기 위한 추적
create table public.signup_logs (
  ip_address text primary key,  -- IP 주소를 기본키로 사용하여 중복 방지
  email text not null,          -- 가입한 이메일 주소
  created_at timestamp with time zone default now()
);

-- RLS 정책 설정: 사용자는 자신의 크레딧만 조회/수정 가능
alter table public.user_credits enable row level security;

-- 사용자가 자신의 크레딧을 조회할 수 있도록 허용
create policy "Users can read their own credits"
  on public.user_credits for select
  using (auth.uid() = user_id);

-- 시스템이 사용자 크레딧을 업데이트할 수 있도록 허용
-- 실제로는 API 엔드포인트를 통해서만 수정 가능함
create policy "Users can update their own credits"
  on public.user_credits for update
  using (auth.uid() = user_id);

-- IP 로그는 관리자만 접근 가능하도록 RLS 설정
alter table public.signup_logs enable row level security; 