import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadToSupabase(
  file: File,
  onProgress?: (p: number) => void
): Promise<{ url: string }> {
  const resp = await fetch(
    `/api/upload-url?filename=${encodeURIComponent(file.name)}`
  );
  if (!resp.ok) throw new Error("Failed to get upload URL");
  const { bucket, path, token, fileUrl } = await resp.json();

  // Supabase's uploadToSignedUrl does not expose byte-level progress.
  // We simulate a simple indeterminate progress to keep the UI lively.
  onProgress?.(0.1);
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file);
  if (error) throw error;
  onProgress?.(1);

  return { url: fileUrl };
}
