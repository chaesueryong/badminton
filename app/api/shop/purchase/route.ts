import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { itemId, paymentMethod } = await request.json();

    if (!itemId || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (paymentMethod !== "feathers" && paymentMethod !== "points") {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Fetch item details
    const { data: item, error: itemError } = await supabase
      .from("shop_items")
      .select("*")
      .eq("id", itemId)
      .eq("enabled", true)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check price
    const price = paymentMethod === "feathers" ? item.price_feathers : item.price_points;
    if (!price) {
      return NextResponse.json(
        { error: "This item cannot be purchased with " + paymentMethod },
        { status: 400 }
      );
    }

    // Fetch user balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("feathers, points")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentBalance = paymentMethod === "feathers" ? user.feathers : user.points;
    if (currentBalance < price) {
      return NextResponse.json(
        { error: "Insufficient " + paymentMethod },
        { status: 400 }
      );
    }

    // Deduct currency
    const newBalance = currentBalance - price;
    const updateField = paymentMethod === "feathers" ? "feathers" : "points";

    const { error: updateError } = await supabase
      .from("users")
      .update({ [updateField]: newBalance })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating balance:", updateError);
      return NextResponse.json(
        { error: "Failed to update balance" },
        { status: 500 }
      );
    }

    // If it's a premium membership, create membership record
    if (item.item_type.includes("premium")) {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (item.duration_days || 30));

      const { error: premiumError } = await supabase
        .from("premium_memberships")
        .insert({
          user_id: userId,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
          purchased_with: paymentMethod,
          amount_paid: price,
        });

      if (premiumError) {
        console.error("Error creating premium membership:", premiumError);
        // Rollback balance
        await supabase
          .from("users")
          .update({ [updateField]: currentBalance })
          .eq("id", userId);
        return NextResponse.json(
          { error: "Failed to create premium membership" },
          { status: 500 }
        );
      }
    }

    // Record purchase history
    await supabase.from("purchase_history").insert({
      user_id: userId,
      item_type: item.item_type,
      item_id: itemId,
      payment_method: paymentMethod,
      amount_paid: price,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      message: "Purchase completed successfully",
      newBalance,
    });
  } catch (error) {
    console.error("Purchase POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
