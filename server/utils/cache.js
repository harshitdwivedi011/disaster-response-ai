const supabase = require("../supabase");

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getOrSetCache(key, fetchFn) {
  const now = new Date();

  // 1. Check cache
  const { data: cached, error: cacheError } = await supabase
    .from("cache")
    .select("value, expires_at")
    .eq("key", key)
    .single();

  if (!cacheError && cached && new Date(cached.expires_at) > now) {
    return cached.value;
  }

  // 2. Fetch fresh data
  const freshValue = await fetchFn();

  // 3. Save to cache
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();
  await supabase
    .from("cache")
    .upsert({ key, value: freshValue, expires_at: expiresAt });

  return freshValue;
}

module.exports = { getOrSetCache };
