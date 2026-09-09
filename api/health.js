export default function handler(_req, res) {
  res.statusCode = 200;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(
    JSON.stringify({
      ok: true,
      supabaseUrl: Boolean(process.env.SUPABASE_URL),
      supabasePublishableKey: Boolean(
        process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY,
      ),
      supabaseSecretKey: Boolean(process.env.SUPABASE_SECRET_KEY),
      livekit: Boolean(
        process.env.LIVEKIT_URL &&
          process.env.LIVEKIT_API_KEY &&
          process.env.LIVEKIT_API_SECRET,
      ),
    }),
  );
}
