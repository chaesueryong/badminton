"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface AdSpaceProps {
  slot?: string;
  className?: string;
}

export default function AdSpace({ slot = "default", className = "" }: AdSpaceProps) {
  const supabase = createClientComponentClient();
  const [isAdFree, setIsAdFree] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdFreeStatus();
  }, []);

  const checkAdFreeStatus = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      // Check if user has VIP membership (VIP members get ad-free experience)
      const now = new Date().toISOString();
      const { data: vipMembership } = await supabase
        .from("vip_memberships")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .gte("end_date", now)
        .single();

      setIsAdFree(!!vipMembership);
    } catch (error) {
      console.error("Failed to check ad-free status:", error);
    } finally {
      setLoading(false);
    }
  };

  // VIP 회원은 광고 표시 안 함
  if (isAdFree) {
    return null;
  }

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`}>
        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
          로딩 중...
        </div>
      </div>
    );
  }

  // 실제 애드센스 코드는 여기에 추가
  return (
    <div className={`bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 ${className}`}>
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <div className="text-xs mb-2">Advertisement</div>
        <div className="text-sm font-medium">광고 영역</div>
        <div className="text-xs mt-2">VIP 회원은 광고가 표시되지 않습니다</div>
      </div>
    </div>
  );
}
