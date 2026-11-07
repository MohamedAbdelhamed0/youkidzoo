import type { ImageUpload } from "../domain/admin";
export async function imageUpload(file: File): Promise<ImageUpload> {
  return {
    name: file.name,
    mimeType: file.type,
    size: file.size,
    bytes: new Uint8Array(await file.arrayBuffer()),
  };
}
