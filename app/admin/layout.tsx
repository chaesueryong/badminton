"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { name: "대시보드", href: "/admin", icon: "📊" },
  { name: "회원 관리", href: "/admin/users", icon: "👥" },
  { name: "모임 관리", href: "/admin/meetings", icon: "🏸" },
  { name: "게시글 관리", href: "/admin/posts", icon: "📝" },
  { name: "체육관 관리", href: "/admin/gyms", icon: "🏢" },
  { name: "신고 관리", href: "/admin/reports", icon: "🚨" },
  { name: "통계", href: "/admin/statistics", icon: "📈" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const verifyAdmin = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/login?redirect=/admin");
        return;
      }

      // 사용자의 role 확인 (새 roles 테이블 사용)
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role_id, roles(name)')
        .eq('user_id', session.user.id);

      if (error || !userRoles || userRoles.length === 0) {
        router.push("/");
        return;
      }

      // Check if user has admin or moderator role
      const hasAdminAccess = userRoles.some((ur: any) =>
        ur.roles?.name === 'admin' || ur.roles?.name === 'moderator'
      );
      if (!hasAdminAccess) {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      setUserEmail(session.user.email || "");
      setLoading(false);
    };

    verifyAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* 사이드바 */}
        <aside className="w-64 bg-gray-900 text-white min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-8">배드메이트 관리자</h1>
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-gray-300 hover-hover:hover:bg-gray-800"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 하단 정보 */}
          <div className="absolute bottom-0 w-64 p-6 border-t border-gray-800">
            <div className="text-sm text-gray-400">
              <p className="mb-1">관리자: {userEmail}</p>
              <Link
                href="/"
                className="text-indigo-400 hover-hover:hover:text-indigo-300 transition"
              >
                사이트로 돌아가기 →
              </Link>
            </div>
          </div>
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
