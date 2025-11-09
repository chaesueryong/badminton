import { createClient } from '@/lib/supabase/server';
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: items, error } = await supabase
      .from("shop_items")
      .select("*")
      .eq("enabled", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching shop items:", error);
      return NextResponse.json(
        { error: "Failed to fetch shop items" },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: items || [] });
  } catch (error) {
    console.error("Shop items GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
