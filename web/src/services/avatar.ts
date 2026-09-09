import { supabase } from "./supabase.ts";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionFor(mime: string): string | null {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return null;
}

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Use uma imagem JPG, PNG, WEBP ou GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("A imagem deve ter no máximo 2 MB.");
  }
  const ext = extensionFor(file.type);
  if (!ext) {
    throw new Error("Formato de imagem inválido.");
  }
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) {
    throw new Error("Não foi possível enviar o avatar.");
  }
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
