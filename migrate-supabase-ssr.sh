#!/bin/bash

# Supabase SSR Migration Script
# This script migrates API routes from old Supabase pattern to new @supabase/ssr pattern

echo "Starting Supabase SSR migration..."

# List of files to migrate
FILES=(
  "app/api/events/[id]/route.ts"
  "app/api/events/[id]/join/route.ts"
  "app/api/gyms/[id]/route.ts"
  "app/api/gyms/[id]/reviews/route.ts"
  "app/api/clubs/[id]/route.ts"
  "app/api/meetings/[id]/join/route.ts"
  "app/api/meetings/[id]/schedules/[scheduleId]/join/route.ts"
  "app/api/comments/[id]/route.ts"
  "app/api/posts/[id]/route.ts"
  "app/api/posts/[id]/comments/route.ts"
  "app/api/subscription/subscribe/route.ts"
  "app/api/subscription/cancel/route.ts"
  "app/api/subscription/plans/route.ts"
  "app/api/points/redeem/route.ts"
  "app/api/points/award/route.ts"
  "app/api/points/rewards/route.ts"
  "app/api/elo/submit-result/route.ts"
  "app/api/elo/history/route.ts"
  "app/api/elo/confirm/route.ts"
  "app/api/admin/users/route.ts"
  "app/api/admin/users/[userId]/route.ts"
  "app/api/admin/posts/route.ts"
  "app/api/admin/posts/[postId]/route.ts"
  "app/api/admin/meetings/route.ts"
  "app/api/admin/meetings/[meetingId]/route.ts"
  "app/api/admin/gyms/route.ts"
  "app/api/admin/gyms/[gymId]/route.ts"
  "app/api/admin/reports/route.ts"
  "app/api/admin/reports/[reportId]/route.ts"
)

MIGRATED=0
SKIPPED=0
ERRORS=0

for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "⏭️  Skipping $file (not found)"
    ((SKIPPED++))
    continue
  fi

  echo "Processing: $file"

  # Create backup
  cp "$file" "$file.backup"

  # Replace import statements
  sed -i "s|import { supabase } from '@/lib/supabase'|import { createClient } from '@/lib/supabase/server'|g" "$file"
  sed -i "s|import { supabaseAdmin } from '@/lib/supabase'|import { createClient } from '@/lib/supabase/server'|g" "$file"
  sed -i "s|import { supabase } from \"@/lib/supabase\"|import { createClient } from '@/lib/supabase/server'|g" "$file"
  sed -i "s|import { supabaseAdmin } from \"@/lib/supabase\"|import { createClient } from '@/lib/supabase/server'|g" "$file"

  # Replace supabaseAdmin with supabase (remove admin usage)
  sed -i 's/supabaseAdmin/supabase/g' "$file"

  # Remove (supabase as any) type casting where possible
  sed -i 's/(supabase as any)/supabase/g' "$file"

  # For each HTTP method, add const supabase = await createClient();
  # This is a basic implementation - may need manual adjustment for complex cases

  echo "✅ Migrated: $file"
  ((MIGRATED++))
done

echo ""
echo "================================"
echo "Migration Summary:"
echo "================================"
echo "Migrated: $MIGRATED"
echo "Skipped:  $SKIPPED"
echo "Errors:   $ERRORS"
echo ""
echo "⚠️  IMPORTANT: You must manually add 'const supabase = await createClient();' "
echo "   at the beginning of each handler function (GET, POST, PUT, PATCH, DELETE)"
echo ""
echo "Backups have been created with .backup extension"
echo "Review changes and test thoroughly before committing!"
