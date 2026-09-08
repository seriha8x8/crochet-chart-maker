import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "photos";

export async function uploadPhoto(supabase: SupabaseClient, path: string, file: File) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export async function deletePhoto(supabase: SupabaseClient, path: string) {
  await supabase.storage.from(BUCKET).remove([path]);
}

export function getPhotoUrl(supabase: SupabaseClient, path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
