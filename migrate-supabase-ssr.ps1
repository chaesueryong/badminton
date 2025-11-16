# Supabase SSR Migration Script (PowerShell)
# This script migrates API routes from old Supabase pattern to new @supabase/ssr pattern

Write-Host "Starting Supabase SSR migration..." -ForegroundColor Green

# List of files to migrate
$files = @(
  "app\api\events\[id]\route.ts",
  "app\api\events\[id]\join\route.ts",
  "app\api\gyms\[id]\route.ts",
  "app\api\gyms\[id]\reviews\route.ts",
  "app\api\clubs\[id]\route.ts",
  "app\api\meetings\[id]\join\route.ts",
  "app\api\meetings\[id]\schedules\[scheduleId]\join\route.ts",
  "app\api\comments\[id]\route.ts",
  "app\api\posts\[id]\route.ts",
  "app\api\posts\[id]\comments\route.ts",
  "app\api\subscription\subscribe\route.ts",
  "app\api\subscription\cancel\route.ts",
  "app\api\subscription\plans\route.ts",
  "app\api\points\redeem\route.ts",
  "app\api\points\award\route.ts",
  "app\api\points\rewards\route.ts",
  "app\api\elo\submit-result\route.ts",
  "app\api\elo\history\route.ts",
  "app\api\elo\confirm\route.ts",
  "app\api\admin\users\route.ts",
  "app\api\admin\users\[userId]\route.ts",
  "app\api\admin\posts\route.ts",
  "app\api\admin\posts\[postId]\route.ts",
  "app\api\admin\meetings\route.ts",
  "app\api\admin\meetings\[meetingId]\route.ts",
  "app\api\admin\gyms\route.ts",
  "app\api\admin\gyms\[gymId]\route.ts",
  "app\api\admin\reports\route.ts",
  "app\api\admin\reports\[reportId]\route.ts"
)

$migrated = 0
$skipped = 0
$errors = 0

foreach ($file in $files) {
  if (-not (Test-Path $file)) {
    Write-Host "⏭️  Skipping $file (not found)" -ForegroundColor Yellow
    $skipped++
    continue
  }

  Write-Host "Processing: $file" -ForegroundColor Cyan

  try {
    # Create backup
    Copy-Item $file "$file.backup" -Force

    # Read file content
    $content = Get-Content $file -Raw

    # Replace import statements
    $content = $content -replace "import \{ supabase \} from ['`"]@/lib/supabase['`"]", "import { createClient } from '@/lib/supabase/server'"
    $content = $content -replace "import \{ supabaseAdmin \} from ['`"]@/lib/supabase['`"]", "import { createClient } from '@/lib/supabase/server'"

    # Replace supabaseAdmin with supabase
    $content = $content -replace '\bsupabaseAdmin\b', 'supabase'

    # Remove unnecessary type casts
    $content = $content -replace '\(supabase as any\)', 'supabase'

    # Save modified content
    Set-Content -Path $file -Value $content -NoNewline

    Write-Host "✅ Migrated: $file" -ForegroundColor Green
    $migrated++
  }
  catch {
    Write-Host "❌ Error migrating $file : $_" -ForegroundColor Red
    $errors++
  }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Migration Summary:" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "Migrated: $migrated" -ForegroundColor Green
Write-Host "Skipped:  $skipped" -ForegroundColor Yellow
Write-Host "Errors:   $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "⚠️  IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. You must manually add 'const supabase = await createClient();' at the beginning of each handler function" -ForegroundColor Yellow
Write-Host "2. Review each migrated file to ensure correctness" -ForegroundColor Yellow
Write-Host "3. Test all API endpoints thoroughly" -ForegroundColor Yellow
Write-Host "4. Delete .backup files after verifying changes" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backups have been created with .backup extension" -ForegroundColor Cyan
