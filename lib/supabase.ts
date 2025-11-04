import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 빌드 타임에는 placeholder 값 사용, 런타임에는 실제 환경변수 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// 클라이언트 사이드에서만 환경변수 검증 (빌드 타임에는 체크하지 않음)
if (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  console.warn('Supabase environment variables are not set. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// 서버 측에서 사용하는 Service Role 클라이언트 (관리자 권한)
// 주의: 이 클라이언트는 서버 측(API routes, Server Components)에서만 사용해야 합니다
function createSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

  // 런타임에만 환경변수 검증 (빌드 타임에는 체크하지 않음)
  if (process.env.NODE_ENV !== 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations may fail.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// lazy initialization - 실제 사용 시점에만 초기화
let _supabaseAdmin: SupabaseClient | null = null;

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createSupabaseAdmin();
    }
    return (_supabaseAdmin as any)[prop];
  },
});
