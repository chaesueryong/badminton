"use client";

// Supabase Auth는 클라이언트 컴포넌트에서 직접 사용하므로
// SessionProvider가 필요 없습니다.
// 하위 호환성을 위해 children만 반환합니다.

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
