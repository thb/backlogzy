import { api } from "./api";

// Direct-to-S3 upload: ask the API for a presigned PUT URL, upload the bytes straight
// to Scaleway, and return the object key to store on the resource.
export async function uploadFile(file: File): Promise<string> {
  const { key, url } = await api.post<{ key: string; url: string }>("/v1/uploads", {
    filename: file.name,
    content_type: file.type,
  });

  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("File upload failed");

  return key;
}
