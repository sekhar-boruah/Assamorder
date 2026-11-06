# AssamOrder

Phase 1 foundation: React + TypeScript + Vite + Tailwind + Supabase.

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL and anon key
   (Supabase > Project Settings > API). Use the anon/public key only.
3. `npm run dev`
4. For quick testing, you can disable "Confirm email" in Supabase > Authentication > Providers > Email.

## Deploy (Netlify)
Build command `npm run build`, publish directory `dist`, and add the two `VITE_` variables in Netlify settings.
