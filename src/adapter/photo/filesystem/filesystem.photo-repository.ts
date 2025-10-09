import { promises as fs } from "fs";
import path from "path";
import { Elysia } from "elysia";
import fsSync from "fs";

export class FilesystemPhotoRepository {
  private baseDir: string;
  private publicBasePath: string;
  private static serverStarted = false;

  constructor(options?: { baseDir?: string; publicBasePath?: string }) {

    this.baseDir = options?.baseDir ?? "test-uploads";
    this.publicBasePath = options?.publicBasePath ?? "/uploads";

    fs.mkdir(this.baseDir, { recursive: true });

  
    if (!FilesystemPhotoRepository.serverStarted) {
      try {
        new Elysia()
          .get("*", ({ request }) => {
            const url = new URL(request.url);
            const filename = url.pathname.split("/").filter(Boolean).pop();
            if (!filename) return new Response("Not found", { status: 404 });

            const filepath = path.join(this.baseDir, filename);
            if (!fsSync.existsSync(filepath)) {
              return new Response("Not found", { status: 404 });
            }

            return new Response(Bun.file(filepath)); // compatible con Bun
          })
          .listen(3000);
        FilesystemPhotoRepository.serverStarted = true;
        console.log("🧪 Static file server started at http://localhost:3000");
      } catch {
        // ignora si el puerto ya está ocupado
      }
    }
  }

  async savePhoto(file: File | { buffer: Buffer; originalname: string }, id: string): Promise<URL> {
    let buffer: Buffer;
    let originalname: string;

    if (file instanceof File) {
      buffer = Buffer.from(await file.arrayBuffer());
      originalname = file.name;
    } else {
      buffer = file.buffer;
      originalname = file.originalname;
    }

    const safeName = originalname.replace(/\s+/g, "_");
    const filename = `${id}-${Date.now()}-${safeName}`;
    const filepath = path.join(this.baseDir, filename);

    await fs.writeFile(filepath, buffer);

    const base = process.env.PUBLIC_URL ?? "http://localhost:3000";
    return new URL(`${this.publicBasePath}/${filename}`, base);
  }
}
