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

      const { data: userData } = await supabase
        .from("users")
        .select("is_vip, vip_until")
        .eq("id", session.user.id)
        .single();

      // Check if user is VIP and VIP is not expired
      const isVipActive = userData?.is_vip && userData?.vip_until && new Date(userData.vip_until) > new Date();

      setIsVIP(!!isVipActive);
      if (isVipActive && userData?.vip_until) {
        setVipUntil(userData.vip_until);
      }
    } catch (error) {
      console.error("Failed to check VIP status:", error);
    } finally {
      setLoading(false);
    }
  };

  return { isVIP, loading, vipUntil, refresh: checkVIPStatus };
}
