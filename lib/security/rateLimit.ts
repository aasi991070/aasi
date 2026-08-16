import { createServiceClient } from "@/lib/supabase/service";

/**
 * Records one request against the IP for `bucket` and reports whether it is
 * within the hourly limit. The check and increment happen in one Postgres
 * statement so concurrent requests cannot both pass on a stale count.
 */
export async function consumeRateLimit(
  bucket: string,
  ipHash: string,
  limit: number
): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket: bucket,
    p_ip_hash: ipHash,
    p_limit: limit,
  });

  if (error) throw error;
  return data === true;
}
