import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function usePremium() {
  const supabase = createClientComponentClient();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const now = new Date().toISOString();
      const { data: premium } = await supabase
        .from("premium_memberships")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .gte("end_date", now)
        .single();

      setIsPremium(!!premium);
      if (premium) {
        setPremiumUntil(premium.end_date);
      }
    } catch (error) {
      console.error("Failed to check premium status:", error);
    } finally {
      setLoading(false);
    }
  };

  return { isPremium, loading, premiumUntil, refresh: checkPremiumStatus };
}
