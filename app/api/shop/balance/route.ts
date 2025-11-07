import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("feathers, points")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user balance:", userError);
      return NextResponse.json(
        { error: "Failed to fetch balance" },
        { status: 500 }
      );
    }

    // Check if user has active premium
    const now = new Date().toISOString();
    const { data: premium, error: premiumError } = await supabase
      .from("premium_memberships")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gte("end_date", now)
      .single();

    return NextResponse.json({
      feathers: user?.feathers || 0,
      points: user?.points || 0,
      isPremium: !!premium,
    });
  } catch (error) {
    console.error("Balance GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
