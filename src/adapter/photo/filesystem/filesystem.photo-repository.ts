import { promises as fs } from "fs";
import path from "path";
import fsSync from "fs";
import { DeviceId } from "@/core/domain";
import { DevicePhotoRepository } from "@/core/repository";

const MEDIA_PORT = Number(process.env.MEDIA_PORT ?? 8080);
const BASE_PATH = "./test-uploads";
const BASE_URL = `http://localhost:${MEDIA_PORT}/uploads/`;

export class FilesystemPhotoRepository implements DevicePhotoRepository {
  private static serverStarted = false;
  private baseDir: string;
  private publicBasePath: string;

  constructor(options?: { baseDir?: string; publicBasePath?: string }) {
    this.baseDir = options?.baseDir ?? BASE_PATH;
    this.publicBasePath = options?.publicBasePath ?? "/uploads";

    // Asegura que exista la carpeta base
    fs.mkdir(this.baseDir, { recursive: true });

    // Solo levanta el servidor una vez
    if (!FilesystemPhotoRepository.serverStarted) {
      try {
        Bun.serve({
          port: MEDIA_PORT,
          fetch: req => {
            const url = new URL(req.url);
            const filename = url.pathname.split("/").pop();
            if (!filename) return new Response("Not found", { status: 404 });

            const filepath = path.join(this.baseDir, filename);
            if (!fsSync.existsSync(filepath))
              return new Response("Not found", { status: 404 });

            return new Response(Bun.file(filepath));
          },
        });
        FilesystemPhotoRepository.serverStarted = true;
        console.log(`🧪 Static file server running at ${BASE_URL}`);
      } catch {
        // Ignora si el puerto ya está ocupado
      }
    }
  }

  async savePhoto(file: File, id: DeviceId): Promise<URL> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/\s+/g, "_");
    const filename = `${id}-${Date.now()}-${safeName}`;
    const filepath = path.join(this.baseDir, filename);

    await fs.writeFile(filepath, buffer);
    return new URL(`${filename}`, BASE_URL);
  }
}
