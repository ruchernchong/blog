/**
 * Outside Next.js there is no cache to revalidate in-process, so ask the
 * deployed app's `POST /api/revalidate` to do it.
 */
export async function revalidateTags(tags: string[]): Promise<void> {
  const url = process.env.REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) {
    console.warn(
      `REVALIDATE_URL or REVALIDATE_SECRET is not set; skipped revalidating ${tags.join(", ")}`,
    );
    return;
  }

  // The route accepts at most 100 tags per request, so send them in batches.
  for (let start = 0; start < tags.length; start += 100) {
    // The write has already succeeded, so a failed revalidation only warns:
    // reporting an error would invite the client to retry the write.
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: tags.slice(start, start + 100) }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        console.warn(`Revalidation failed with status ${response.status}`);
      }
    } catch (error) {
      console.warn("Revalidation request failed", error);
    }
  }
}
