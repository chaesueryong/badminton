import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Create meetings bucket
    const { data, error } = await supabase.storage.createBucket('meetings', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
      // If bucket already exists, that's okay
      if (error.message.includes('already exists')) {
        return NextResponse.json({ message: "Bucket already exists" });
      }
      throw error;
    }

    return NextResponse.json({ message: "Bucket created successfully", data });
  } catch (error: any) {
    console.error("Error creating bucket:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create bucket" },
      { status: 500 }
    );
  }
}