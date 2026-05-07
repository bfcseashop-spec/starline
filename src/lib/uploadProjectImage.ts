import { backend } from "@/lib/backendClient";

const MAX_MB = 5;

export async function uploadProjectCoverImage(file: File, folderPrefix: string): Promise<{ url: string | null; error?: string }> {
  if (!file.type.startsWith("image/")) return { url: null, error: "Please choose an image file." };
  if (file.size > MAX_MB * 1024 * 1024) return { url: null, error: `Image too large (max ${MAX_MB}MB).` };
  const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const path = `${folderPrefix.replace(/\/$/, "")}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const { error } = await backend.storage.from("project-images").upload(path, file);
  if (error) return { url: null, error: error.message };
  const { data } = backend.storage.from("project-images").getPublicUrl(path);
  return { url: data.publicUrl };
}
