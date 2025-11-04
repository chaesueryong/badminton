import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

/**
 * 사용자의 어드민/모더레이터 권한 확인 (새 roles 테이블 사용)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_id, roles(name)')
      .eq('user_id', userId);

    if (error || !data || data.length === 0) {
      return false;
    }

    // admin 또는 moderator 역할이 있으면 true
    return data.some((ur: any) =>
      ur.roles?.name === 'admin' || ur.roles?.name === 'moderator'
    );
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
}

/**
 * 현재 로그인한 사용자의 어드민 권한 확인 (서버 사이드 - Route Handler용)
 */
export async function checkAdminAuth(request?: Request): Promise<{ user: User | null; isAdmin: boolean }> {
  try {
    // Route Handler에서 호출된 경우, cookies를 직접 가져올 수 없으므로
    // 클라이언트가 전달한 세션을 사용하거나 auth helper 사용
    // 여기서는 supabaseAdmin을 import해서 사용하도록 변경이 필요
    // 하지만 현재는 단순하게 supabase client 사용
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return { user: null, isAdmin: false };
    }

    const adminStatus = await isAdmin(session.user.id);

    return { user: session.user, isAdmin: adminStatus };
  } catch (error) {
    console.error('Check admin auth error:', error);
    return { user: null, isAdmin: false };
  }
}

/**
 * 어드민 로그 기록
 */
export async function logAdminAction(params: {
  adminId: string;
  action: string;
  targetType: 'user' | 'post' | 'meeting' | 'gym' | 'report' | 'comment';
  targetId: string;
  details?: Record<string, any>;
  ipAddress?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: params.adminId,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId,
        details: params.details || null,
        ip_address: params.ipAddress || null,
      });

    if (error) {
      console.error('Log admin action error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Log admin action failed:', error);
    return false;
  }
}

/**
 * 알림 생성
 */
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
      });

    if (error) {
      console.error('Create notification error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Create notification failed:', error);
    return false;
  }
}

/**
 * NextJS API 라우트용 어드민 권한 체크 미들웨어
 */
export async function requireAdmin(request: Request): Promise<{ authorized: boolean; userId?: string; error?: string }> {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return { authorized: false, error: 'No authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');

    // Supabase 토큰 검증
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return { authorized: false, error: 'Invalid token' };
    }

    // 어드민 권한 확인
    const adminStatus = await isAdmin(user.id);

    if (!adminStatus) {
      return { authorized: false, userId: user.id, error: 'Not an admin' };
    }

    return { authorized: true, userId: user.id };
  } catch (error) {
    console.error('Require admin error:', error);
    return { authorized: false, error: 'Internal error' };
  }
}
