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

      const { data: userData } = await supabase
        .from("users")
        .select("is_premium, premium_until")
        .eq("id", session.user.id)
        .single();

      // Check if user is Premium and Premium is not expired
      const isPremiumActive = userData?.is_premium && userData?.premium_until && new Date(userData.premium_until) > new Date();

      setIsPremium(!!isPremiumActive);
      if (isPremiumActive && userData?.premium_until) {
        setPremiumUntil(userData.premium_until);
      }
    } catch (error) {
      console.error("Failed to check premium status:", error);
    } finally {
      setLoading(false);
    }
  };

  return { isPremium, loading, premiumUntil, refresh: checkPremiumStatus };
}
