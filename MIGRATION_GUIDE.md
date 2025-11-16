# Supabase Client Migration Guide

## Overview
The project has been migrated from the legacy `@supabase/supabase-js` to the modern `@supabase/ssr` package for better Next.js App Router compatibility.

## Changes Made

### 1. Client Files Updated
- ✅ `lib/supabase/client.ts` - Now uses `createBrowserClient` from `@supabase/ssr`
- ✅ `lib/supabase/server.ts` - Now uses `createServerClient` with proper cookie handling
- ✅ `components/Navbar.tsx` - Added timeout protection for session fetching
- ✅ `app/auth/callback/route.ts` - Improved redirect URL handling
- ✅ `app/login/page.tsx` - Enhanced OAuth redirect logic

### 2. Breaking Changes

#### Old Pattern (DEPRECATED):
```typescript
import { supabase } from '@/lib/supabase';
// or
import { supabaseAdmin } from '@/lib/supabase';

// Then use synchronously
const { data } = await supabase.from('users').select('*');
```

#### New Pattern (API Routes):
```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.from('users').select('*');
  return NextResponse.json({ data });
}
```

#### New Pattern (Client Components):
```typescript
import { createClient } from '@/lib/supabase/client';

export default function MyComponent() {
  const supabase = createClient();
  // Use supabase client
}
```

## Files That Need Migration

The following API route files still use the old pattern and should be migrated gradually:

### High Priority (Core Features):
- `app/api/users/route.ts`
- `app/api/meetings/route.ts`
- `app/api/posts/route.ts`
- `app/api/points/balance/route.ts`

### Medium Priority:
- `app/api/badges/route.ts`
- `app/api/achievements/route.ts`
- `app/api/leaderboard/route.ts`
- `app/api/matching/find/route.ts`

### Low Priority (Admin/Legacy):
- `app/api/admin/**/*.ts`
- `app/api/elo/**/*.ts`

## Migration Steps

For each API route file:

1. **Change the import**:
   ```diff
   - import { supabase } from '@/lib/supabase';
   + import { createClient } from '@/lib/supabase/server';
   ```

2. **Update the handler to be async** (if not already):
   ```diff
   - export async function GET(request: NextRequest) {
   + export async function GET(request: NextRequest) {
   ```

3. **Create client instance at the beginning**:
   ```diff
   export async function GET(request: NextRequest) {
   +  const supabase = await createClient();
     // rest of code...
   }
   ```

4. **For admin operations**, you may need to create a service role client:
   ```typescript
   import { createServerClient } from '@supabase/ssr'
   import { cookies } from 'next/headers'

   const supabaseAdmin = createServerClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!,
     {
       cookies: {
         getAll() { return [] },
         setAll() {},
       },
     }
   )
   ```

## Testing Checklist

After migration, test:
- [ ] User login/logout flow
- [ ] Session persistence across page refreshes
- [ ] API route functionality
- [ ] Admin panel operations
- [ ] Client component data fetching

## Known Issues

### Temporary Compatibility Layer
A temporary `lib/supabase/index.ts` file exists that re-exports the server client for backward compatibility. This allows old imports to continue working but should eventually be removed after all files are migrated.

### Session Timeout
The Navbar component now has a 5-second timeout for session fetching. If session retrieval takes longer, it will proceed without blocking the UI.

## References

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
