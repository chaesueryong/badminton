import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePremium() {
  const supabase = createClient();
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
        .maybeSingle();

      // Check if user is Premium and Premium is not expired
      const isPremiumActive = (userData as any)?.is_premium && (userData as any)?.premium_until && new Date((userData as any).premium_until) > new Date();

      setIsPremium(!!isPremiumActive);
      if (isPremiumActive && (userData as any)?.premium_until) {
        setPremiumUntil((userData as any).premium_until);
      }
    } catch (error) {
      console.error("Failed to check premium status:", error);
    } finally {
      setLoading(false);
    }
  };

  return { isPremium, loading, premiumUntil, refresh: checkPremiumStatus };
}
