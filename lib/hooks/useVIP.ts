import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function useVIP() {
  const supabase = createClientComponentClient();
  const [isVIP, setIsVIP] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vipUntil, setVipUntil] = useState<string | null>(null);

  useEffect(() => {
    checkVIPStatus();
  }, []);

  const checkVIPStatus = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const now = new Date().toISOString();
      const { data: vipMembership } = await supabase
        .from("vip_memberships")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .gte("end_date", now)
        .single();

      setIsVIP(!!vipMembership);
      if (vipMembership) {
        setVipUntil(vipMembership.end_date);
      }
    } catch (error) {
      console.error("Failed to check VIP status:", error);
    } finally {
      setLoading(false);
    }
  };

  return { isVIP, loading, vipUntil, refresh: checkVIPStatus };
}
