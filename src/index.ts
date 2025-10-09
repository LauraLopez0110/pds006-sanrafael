// src/index.ts
import { Elysia } from "elysia";
import path from "path";
import fs from "fs";
import { FilesystemPhotoRepository } from "./adapter/photo/filesystem/filesystem.photo-repository";

const PORT = Number(process.env.PORT ?? 3000);

// 🔧 NUEVA RUTA donde se guardan las imágenes:
const uploadDir = path.resolve(
  process.cwd(),
  "src/adapter/photo/filesystem/filesystemPhotoRepository"
);
const publicBasePath = "/files";

const repo = new FilesystemPhotoRepository({ baseDir: uploadDir, publicBasePath });

// Helper: convertir Web File/Blob a Buffer (Bun environment)
async function fileToBuffer(file: File | Blob): Promise<Buffer> {
  const ab = await file.arrayBuffer();
  return Buffer.from(ab);
}

const app = new Elysia()
  .get("/", () => "Hello Elysia")

  // POST /upload -> guarda imagen en filesystemPhotoRepository
  .post("/upload", async ({ request }) => {
    try {
      const form = await request.formData();
      const fileField = form.get("file");

      if (!fileField) {
        return { ok: false, message: "No file provided (field 'file')" };
      }

      // fileField es un File (web File)
      const webFile: File = fileField as any;
      const buffer = await fileToBuffer(webFile);

      const nodeFile = {
        buffer,
        originalname: (webFile as any).name ?? "upload",
        mimetype: (webFile as any).type ?? "application/octet-stream",
      };

      const deviceId = form.get("deviceId") ?? "unknown-device";

      // 📁 Guarda la imagen
      const url = await repo.savePhoto(nodeFile, String(deviceId));

      // 🌍 Construir URL completa (para abrir desde navegador)
      const host = request.headers.get("host") ?? `localhost:${PORT}`;
      const protoHeader = request.headers.get("x-forwarded-proto");
      const protocol = protoHeader ? protoHeader.split(",")[0] : "http";

      const absolute = `${protocol}://${host}${url.pathname}`;
      return { ok: true, url: absolute };
    } catch (err: any) {
      console.error("Upload error:", err);
      return { ok: false, message: err?.message ?? String(err) };
    }
  })

  // GET /files/:filename -> sirve las imágenes guardadas
  .get("/files/:filename", ({ params }) => {
    try {
      const filename = params.filename as string;
      if (!filename || filename.includes("..")) return new Response("Not allowed", { status: 400 });

      const filepath = path.join(uploadDir, filename);
      if (!fs.existsSync(filepath)) return new Response("Not found", { status: 404 });

      // Devuelve el archivo usando Bun.file
      // @ts-ignore
      return new Response(Bun.file(filepath));
    } catch (err) {
      console.error("Error serving file:", err);
      return new Response("Internal server error", { status: 500 });
    }
  })

  .listen(PORT);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
